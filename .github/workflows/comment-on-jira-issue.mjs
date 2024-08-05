import dotenv from 'dotenv';
dotenv.config();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const ORG_TEAM_MEMBERS = process.env.ORG_TEAM_MEMBERS;
const REPO_NAME = process.env.REPO_NAME;
const PR_TITLE = process.env.PR_TITLE;
let PR_BODY = process.env.PR_BODY;

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extract the issue keys from the start of PR_TITLE
const ISSUE_KEYS = PR_TITLE.split(':')[0].match(/[A-Z]+-\d+/g);

// Discard '## Checklist' and everything after it
PR_BODY = PR_BODY.split('## Checklist')[0];

// Replace <img> tags with the plain url
PR_BODY = PR_BODY.replace(/<img[^>]*src="([^"]*)"[^>]*>/g, '$1');

// Replace ![]() with the plain url
PR_BODY = PR_BODY.replace(/!\[[^\]]*\]\(([^\)]*)\)/g, '$1');

const createContentItem = (text, type = "text", marks = []) => ({
  "text": text,
  "type": type,
  "marks": marks
});

// Table handling function
const processTableLines = (lines) => {
  // Filter out the delimiter line.
  const filteredLines = lines.filter(line => !/^\|\s*[-]+\s*\|/.test(line));

  let headers = filteredLines[0].split('|').slice(1, -1).map(cell => cell.trim());

  const processCellContent = (cell) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;
    let lastIndex = 0;
    let content = [];

    // Find all the URLs in the cell and create a link mark for them.
    while ((match = urlRegex.exec(cell)) !== null) {
      if (match.index !== lastIndex) {
        content.push(createContentItem(cell.substring(lastIndex, match.index)));
      }
      content.push({
        "type": "text",
        "text": match[0],
        "marks": [{
          "type": "link",
          "attrs": {
            "href": match[0],
            "title": match[0]
          }
        }]
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex !== cell.length) {
      content.push(createContentItem(cell.substring(lastIndex)));
    }

    return {
      "type": "paragraph",
      "content": content
    };
  }

  let rows = filteredLines.slice(1).map(row =>
      row.split('|').slice(1, -1).map(cell => processCellContent(cell.trim()))
  );

  return {
      "type": "table",
      "attrs": {
          "isNumberColumnEnabled": false,
          "layout": "default"
      },
      "content": [
          {
              "type": "tableRow",
              "content": headers.map(header => ({
                  "type": "tableHeader",
                  "attrs": {},
                  "content": [{
                      "type": "paragraph",
                      "content": [{
                          "type": "text",
                          "text": header,
                          "marks": [
                              {
                                  "type": "strong"
                              }
                          ]
                      }]
                  }]
              }))
          },
          ...rows.map(row => ({
              "type": "tableRow",
              "content": row.map(cellContent => ({
                  "type": "tableCell",
                  "attrs": {},
                  "content": [cellContent]
              }))
          }))
      ]
  };
}

// Process PR_BODY content and handle image links
let i = 0;
let contentItems = [];
const lines = PR_BODY.split('\n');
const imageLinks = [];

while (i < lines.length) {
    let line = lines[i];

    // If it's a table
    if (line.startsWith('|') && lines[i + 1] && lines[i + 1].startsWith('| ---')) {
        let tableLines = [];
        while (i < lines.length && lines[i].startsWith('|')) {
            tableLines.push(lines[i]);
            i++;
        }
        contentItems.push(processTableLines(tableLines));
    } else { // If it's not part of a table
        if (line.trim() !== "") {
            if (line.startsWith('### ')) { // If it's a h3
                line = line.replace(/^### /, '');
                contentItems.push({
                    "content": [{
                        "text": line,
                        "type": "text"
                    }],
                    "type": "heading",
                    "attrs": {
                        "level": 3
                    }
                });
            } else if (line.startsWith('## ')) { // If it's a h2
                line = line.replace(/^## /, '');
                contentItems.push({
                    "content": [{
                        "text": line,
                        "type": "text"
                    }],
                    "type": "heading",
                    "attrs": {
                        "level": 2
                    }
                });
            } else if (line.startsWith('# ')) { // If it's a h1
                line = line.replace(/^# /, '');
                contentItems.push({
                    "content": [{
                        "text": line,
                        "type": "text"
                    }],
                    "type": "heading",
                    "attrs": {
                        "level": 1
                    }
                });
            } else { // If it's anything else, treat it as a paragraph
                let content = [];
                let lastIndex = 0;
                let match;
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const boldRegex = /\*\*([^*]+)\*\*/g;
                const combinedRegex = new RegExp(`(${urlRegex.source}|${boldRegex.source})`, 'g');

                while ((match = combinedRegex.exec(line)) !== null) {
                    if (match.index !== lastIndex) {
                        content.push(createContentItem(line.substring(lastIndex, match.index)));
                    }

                    // If it's a URL match.
                    if (match[1] && match[1].startsWith('http')) {
                        // If it's an image uploaded to the PR description
                        if (match[1].startsWith(`https://github.com/user-attachments/assets/`)) {
                            const imageName = `image_${String(imageLinks.length + 1).padStart(3, '0')}`;
                            imageLinks.push({ url: match[1], name: imageName });
                            content.push(createContentItem(`See attachment "${imageName}"`));
                        } else {
                            content.push({
                                "type": "text",
                                "text": match[1],
                                "marks": [{
                                    "type": "link",
                                    "attrs": {
                                        "href": match[1],
                                        "title": match[1]
                                    }
                                }]
                            });
                        }
                    }
                    // If it's a bold match.
                    else if (match[1]) {
                      console.log(match[1]);
                      console.log(match[1].slice(2, -2));
                      const boldText = match[1].slice(2, -2);  // Remove ** from both ends
                      content.push(createContentItem(boldText, "text", [{"type": "strong"}]));
                    }

                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex !== line.length) {
                    content.push(createContentItem(line.substring(lastIndex)));
                }

                contentItems.push({
                    "content": content,
                    "type": "paragraph"
                });
            }
        }
        i++;
    }
}

let bodyData = JSON.stringify({
  "body": {
    "content": contentItems,
    "type": "doc",
    "version": 1
  }
});

const commentOnJiraIssue = async () => {
  try {
    for (const ISSUE_KEY of ISSUE_KEYS) {
      const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${ISSUE_KEY}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`
          ).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: bodyData
      })
      .then(response => {
        if (!response.ok) {
            throw new Error(`Response: ${response.status} ${response.statusText}`);
        }
        console.log(
            `Response: ${response.status} ${response.statusText}`
        );
        return response.text();
      })
      .then(text => console.log(text))
    }
  } catch (error) {
    console.error('Failed to add comment on Jira issue:', error);
    process.exit(1);
  }
}

const downloadImage = async (url, dest) => {
  // We need to follow the redirect to get the actual image URL
  const actualImageUrl = await getRedirectedUrl(url);
  const response = await fetch(actualImageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const buffer = await response.buffer();
  await fs.promises.writeFile(dest, buffer);
  console.log(`Image downloaded to ${dest}`);
};

const getRedirectedUrl = async (url) => {
  const response = await fetch(url, {
    method: 'HEAD',
    headers: {
      'Authorization': `token ${ORG_TEAM_MEMBERS}`
    },
    redirect: 'follow'
  });
  return response.url;
};

const uploadImageToJira = async (issueKey, filePath) => {
  const form = new FormData();
  const fileStream = fs.createReadStream(filePath);
  form.append('file', fileStream);

  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/attachments`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`
      ).toString('base64')}`,
      'X-Atlassian-Token': 'no-check',
      ...form.getHeaders() // Get the headers for the form data
    },
    body: form
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image to Jira: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`Image uploaded to Jira issue ${issueKey}: ${data[0].content}`);
  return data[0].content;
};

const handleImageDownloadAndUpload = async () => {
  const uploadLinks = {};

  for (const ISSUE_KEY of ISSUE_KEYS) {
    uploadLinks[ISSUE_KEY] = [];
    for (const { url, name } of imageLinks) {
      const tempImagePath = path.join(__dirname, `${name}.jpg`);
      await downloadImage(url, tempImagePath);
      const downloadLink = await uploadImageToJira(ISSUE_KEY, tempImagePath);
      await fs.promises.unlink(tempImagePath); // Clean up the temp image

      // Collect the download link for each image
      uploadLinks[ISSUE_KEY].push({ name, downloadLink });
    }
  }

  // Update the contentItems with the download links
  contentItems = contentItems.map(item => {
    if (item.type === 'paragraph') {
      uploadLinks[ISSUE_KEYS[0]].forEach(({ name, downloadLink }) => {
        if (item.content[0].text.includes(`See attachment "${name}"`)) {
          item.content = [{
            "type": "text",
            "text": `See attachment "${name}" above or `,
            "marks": []
          }, {
            "type": "text",
            "text": "click here",
            "marks": [{
              "type": "link",
              "attrs": {
                "href": downloadLink,
                "title": downloadLink
              }
            }]
          }, {
            "type": "text",
            "text": " to download the image.",
            "marks": []
          }];
        }
      });
    }
    return item;
  });

  // Recreate the bodyData with the updated contentItems
  bodyData = JSON.stringify({
    "body": {
      "content": contentItems,
      "type": "doc",
      "version": 1
    }
  });

  // Post the updated comment with download links
  await postCommentOnJiraIssue(bodyData);
};

const postCommentOnJiraIssue = async (bodyData) => {
  try {
    for (const ISSUE_KEY of ISSUE_KEYS) {
      const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${ISSUE_KEY}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`
          ).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: bodyData
      });

      if (!response.ok) {
        throw new Error(`Response: ${response.status} ${response.statusText}`);
      }

      console.log(`Response: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(text);
    }
  } catch (error) {
    console.error('Failed to add comment on Jira issue:', error);
    process.exit(1);
  }
};

handleImageDownloadAndUpload()
  .catch((error) => console.error("Error in process:", error));
