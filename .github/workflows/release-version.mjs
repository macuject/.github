import dotenv from 'dotenv';
dotenv.config();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const ISSUE_KEY = process.env.ISSUE_KEY;
const PROJECT_KEY = process.env.PROJECT_KEY;
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const PR_BASE_BRANCH = process.env.PR_BASE_BRANCH;
let github_release_branches = process.env.GITHUB_RELEASE_BRANCHES;

import fetch from 'node-fetch';

const fetchCurrentFixVersions = async (issueKey) => {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`
      ).toString('base64')}`,
      'Accept': 'application/json'
    }
  });

  const json = await response.json();
  const fixVersions = json.fields.fixVersions;
  return fixVersions.map(fixVersion => fixVersion.name);
};

const fetchUnreleasedJiraFixVersions = async () => {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/${PROJECT_KEY}/version?status=unreleased&orderBy=name`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`
      ).toString('base64')}`,
      'Accept': 'application/json'
    }
  });

  const json = await response.json();
  const values = json.values;
  console.log('Unreleased Jira fixVersions:', values.map(fixVersion => fixVersion.name));
  return values.map(fixVersion => fixVersion.name);
};

const fetchAllJiraFixVersions = async () => {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/${PROJECT_KEY}/version?orderBy=name`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`
      ).toString('base64')}`,
      'Accept': 'application/json'
    }
  });

  const json = await response.json();
  const values = json.values;
  console.log('All Jira fixVersions:', values.map(fixVersion => fixVersion.name));
  return values;
};

function sortVersionsDescending(versions) {
  return versions.sort((a, b) => {
    let aParts = a.replace(/^(origin\/)?release\//, '').split('.').map(Number);
    let bParts = b.replace(/^(origin\/)?release\//, '').split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if ((aParts[i] || 0) > (bParts[i] || 0)) return -1;
      if ((aParts[i] || 0) < (bParts[i] || 0)) return 1;
    }
    return 0;
  });
}

// Determine which fixVersion should be assigned to the Jira issue(s)
async function fetchAndCompare() {
  try {
    let issueKeys;
    if (ISSUE_KEY.startsWith('[') && ISSUE_KEY.endsWith(']')) {
      issueKeys = ISSUE_KEY.slice(1, -1).split(',').map(key => key.trim());
    } else {
      issueKeys = [ISSUE_KEY];
    }

    for (const issueKey of issueKeys) {
      console.log(`Processing issue: ${issueKey}`);
      const currentFixVersionNames = await fetchCurrentFixVersions(issueKey);
      let predictedFixVersion = null;

      // return early if (currentFixVersionNames.length > 1)
      //  i.e. if the issue has more than one fixVersion assigned to it
      if (currentFixVersionNames.length > 1) {
        console.error('More than one fixVersion assigned to issue. This shouldn\'t be the case. Unclear how to proceed, so returning early.');
        process.exit(1);
      } else {
        predictedFixVersion = currentFixVersionNames[0];
      }

      // Get all unreleased fixVersions in the Jira project, retrieved in ascending order
      let unreleasedJiraFixVersions = await fetchUnreleasedJiraFixVersions();

      let correctFixVersion = null;
      if (PR_BASE_BRANCH.includes('release')) {
        // If the base branch is a release branch with a matching Jira fixVersion, use the release branch number as the correct fixVersion
        // e.g. if the base branch is release/1.2, and there is a Jira fixVersion 1.2.0, use 1.2.0 as the correct fixVersion
        const releaseBranchNumber = PR_BASE_BRANCH.match(/\d+\.\d+$/)[0] + '.0';
        if (unreleasedJiraFixVersions.includes(releaseBranchNumber)) {
          correctFixVersion = releaseBranchNumber;
          console.log('Base branch is a release branch with a matching unreleased Jira fixVersion. Using the release branch number as the correct fixVersion.')
          console.log('Currently assigned fixVersion for Jira ticket:', predictedFixVersion);
          console.log('Correct fixVersion:', correctFixVersion);
        } else {
          // Check if the fix version exists but is already released
          const allFixVersions = await fetchAllJiraFixVersions();

          // Find the fix version that matches the release branch number
          const matchingFixVersion = allFixVersions.find(version => version.name === releaseBranchNumber);

          if (matchingFixVersion) {
            // Check if this is the most recently released version
            const isLatestReleasedVersion = allFixVersions
              .filter(v => v.released && v.name.startsWith(releaseBranchNumber.substring(0, releaseBranchNumber.lastIndexOf('.'))))
              .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))[0]?.name === releaseBranchNumber;

            if (isLatestReleasedVersion) {
              correctFixVersion = releaseBranchNumber;
              console.log('Base branch is a release branch with the most recently released matching Jira fixVersion. Using the release branch number as the correct fixVersion.')
              console.log('Currently assigned fixVersion for Jira ticket:', predictedFixVersion);
              console.log('Correct fixVersion:', correctFixVersion);
            } else {
              console.log('Release branch number:', releaseBranchNumber);
              console.log('This is not the most recently released version. Unclear how to proceed, so returning early.');
              process.exit(1);
            }
          } else {
            console.log('Release branch number:', releaseBranchNumber)
            console.log('All unreleased fixVersions in the Jira project:', unreleasedJiraFixVersions);
            console.error('Release branch number not found in Jira fixVersions. Unclear how to proceed, so returning early.');
            process.exit(1);
          }
        }
      } else if (github_release_branches.length > 0) {
        // Convert github_release_branches to an array if it's not already
        const releaseBranches = Array.isArray(github_release_branches)
          ? github_release_branches
          : github_release_branches.split(',').map(branch => branch.trim());

        console.log('Github release branches:', releaseBranches);

        // Get the release branch numbers from the Github release branches
        const githubReleaseBranchNumbers = sortVersionsDescending(releaseBranches);

        console.log('All unreleased fixVersions in the Jira project:', unreleasedJiraFixVersions);
        console.log('Sorted Github release branches:', githubReleaseBranchNumbers);
        console.log('Currently assigned fixVersion for Jira ticket:', predictedFixVersion);

        // Get the highest release branch number
        let highestReleaseBranchNum = githubReleaseBranchNumbers[0].replace(/^(origin\/)?release\//, '');

        // Find the lowest Jira version number that is higher than the highest release branch number
        correctFixVersion = unreleasedJiraFixVersions.find(item => {
          let itemParts = item.split('.').map(Number);
          let branchParts = highestReleaseBranchNum.split('.').map(Number);
          for (let i = 0; i < Math.max(itemParts.length, branchParts.length); i++) {
            if ((itemParts[i] || 0) > (branchParts[i] || 0)) return true;
            if ((itemParts[i] || 0) < (branchParts[i] || 0)) return false;
          }
          return false;
        });

        console.log('Highest release branch number:', highestReleaseBranchNum);
        console.log('Correct fixVersion:', correctFixVersion);
      } else {
        // If there are no release branches, use the lowest Jira version number as the correct fixVersion
        correctFixVersion = unreleasedJiraFixVersions[0];
        console.log('No release branches found. Using the lowest unreleased Jira version number as the correct fixVersion.')
        console.log('Correct fixVersion:', correctFixVersion);
      }

      // If the correct fixVersion is not the same as the currently assigned fixVersion, update the issue
      if (predictedFixVersion !== correctFixVersion) {
        console.log(`Updating issue ${issueKey}...`);
        const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`
            ).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            update: {
              fixVersions: [
                {
                  set: [
                    {
                      name: correctFixVersion
                    }
                  ]
                }
              ]
            }
          })
        });

        // Check the response status
        if (response.status === 204) { // Check for the appropriate successful status code here
          console.log(`✅ Issue ${issueKey} updated with fixVersion:`, correctFixVersion);
        } else {
          console.error(`Error updating fixVersion for issue ${issueKey}`, await response.text());
          process.exit(1);
        }
      } else {
        console.log(`✅ Correct fixVersion is the same as the currently assigned fixVersion for issue ${issueKey}. No update needed.`);
      }
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Execute the function
fetchAndCompare();
