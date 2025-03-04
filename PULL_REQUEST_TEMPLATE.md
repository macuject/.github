## Description

Delete me: Describe the changes in this PR.

## Screenshots

Delete me: If applicable, add screenshots to help explain this PR's changes. If not needed delete this entire section.

### Before

#### 1366x768

![Before](https://via.placeholder.com/1366x768)

#### 1920x1080

![Before](https://via.placeholder.com/1920x1080)

### After

#### 1366x768

![After](https://via.placeholder.com/1366x768)

#### 1920x1080

![After](https://via.placeholder.com/1920x1080)

## Videos

Any videos to help explain the changes in this PR, e.g. Loom or other screen recording tools.

## Breaking Changes

Delete me: If applicable, describe any breaking changes. If not needed delete this entire section.

## Security

Delete me: Does this PR modify any aspects of our security posture? If so, please describe the security changes, discussions had with the Macuject Information Security Officer, and the testing undertaken. If not needed delete this entire section.

## Acceptance Testing

Delete me: Does this PR require UAT e.g. by the product or medical team? If so, please describe the testing required and undertaken. If not needed delete this entire section.

## Data

Delete me: Does this PR require manual database, data migration or data flow change? Describe the changes required and testing undertaken. If not needed delete this entire section.

If you have dependencies on migrations in other PR/scripts please ensure you list the specific PR URL, and provide a link to the script(s) in question. This will assist in release building.

## Jobs

Delete me: Does this PR add/update/remove anything that is considered a 'job' e.g. Lambda or Cron (but explicitly not DelayedJob as this is managed entirely within the web application). If so please describe the job and undertake the platform teams [automated job process][job process]. If not needed delete this entire section.

## Impact Assessment

As part of our ongoing commitment to maintaining compliance with SOC 2 and HIPAA regulations, each proposed change should have an impact assessment undertaken. Our [impact assessment] documentation contains a summary and complete details.

- **High**: Potential for significant harm to sensitive data or user access and material adverse impact on Macuject's operations or reputation.
- **Medium**: Potential for moderate harm to sensitive data or user access and adverse impact on Macuject's operations or reputation.
- **Low**: Unlikely to significantly harm sensitive data or user access, and no expected material adverse impact on Macujects's operations or reputation.
- **None**: Changes that are not relevant to the impact assessment process. Changes will not be used in production by Macuject customers and are related to internal tooling, documentation, or other non-production systems.

**Impact Assessment for this PR**: [High/Medium/Low/None]

## Checklist

I've considered all of the following and added to the proposed changes where relevant to this PR:

- [ ] Comments for complex or unclear sections
- [ ] Logging to assist production operation
- [ ] Documentation and diagram updates (e.g. Confluence pages, local markdown docs, architecture diagrams)

I've considered all of the following and added details to the PR description where relevant:

- [ ] Breaking changes
- [ ] UAT guidance
- [ ] Data-related changes
- [ ] Job(s) have been described and a [PR opened][job process] for the platform team to review
- [ ] Security changes. This also requires the Macuject Information Security Officer to be added to this PR as an additional reviewer.

[job process]: https://macuject.atlassian.net/wiki/spaces/TT/pages/1705082972/Automated+Jobs
[impact assessment]: https://docs.google.com/document/d/1MSPJaPb9LaLvJEH6PIaRULBcz7IaODjRuE6_9hlhHMI
