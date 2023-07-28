## Description

Delete me: Describe the changes in this PR. Please explicitly note any breaking changes.

**Jira**: <https://jira.macuject.com/[ID]>

## Screenshots / Videos

Delete me: If applicable, add screenshots to help explain this PR's changes. If not needed delete this entire section.`

| Type         | Before | After |
| ------------ | ------ | ----- |
| Wide screen  | IMG    | IMG   |
| Small screen | IMG    | IMG   |

## Data

Delete me: Does this PR require database, data migration or data flow change? Describe the changes required and testing undertaken. If not needed delete this entire section.

## Security

Delete me: Does this PR modify any aspects of our security posture? If so, please describe the security changes, discussions had with the Macuject Information Security Officer, and the testing undertaken. If not needed delete this entire section.

## Jobs (Cron, Lambda etc)

Delete me: Does this PR add/update/remove anything that is considered a 'job' e.g. Lambda or Cron (but explicitly not DelayedJob as this is managed entirely within the web application). If so please describe the job and undertake the platform teams [automated job process][job process]. If not needed delete this entire section.

## Impact Assessment

As part of our ongoing commitment to maintaining compliance with SOC 2 and HIPAA regulations, each proposed change should have an impact assessment undertaken. A summary is provided and full details can be found within our [impact assessment] documentation.

- **High**: Potential for significant harm to sensitive data or user access, and material adverse impact on Macuject's operations or reputation.
- **Medium**: Potential for moderate harm to sensitive data or user access, and adverse impact on Macuject's operations or reputation.
- **Low**: Unlikely to result in significant harm to sensitive data or user access, and no expected material adverse impact on Macujects's operations or reputation.

**Impact Assessment for this PR**: [High/Medium/Low]

## Checklist

I've considered all of the following and added to the proposed changes where relevant to this PR:

- [ ] Comments for complex or unclear sections
- [ ] Logging to assist production operation
- [ ] Documentation and diagram updates (e.g. Confluence pages, local markdown docs, architecture diagrams)

I've considered all of the following and added details to the PR description where relevant:

- [ ] Breaking changes
- [ ] Data related changes
- [ ] Job(s) have been described and a [PR opened][job process] for the platform team to review
- [ ] Security changes. This also requires the Macuject Information Security Officer to be added to this PR as an additional reviewer.

[job process]: https://macuject.atlassian.net/wiki/spaces/TT/pages/1705082972/Automated+Jobs
[impact assessment]: https://docs.google.com/document/d/1MSPJaPb9LaLvJEH6PIaRULBcz7IaODjRuE6_9hlhHMI
