# CLAUDE.md

## Repository Overview

This is Macuject's `.github` repository. It provides organisation-wide GitHub defaults:
the PR template and reusable GitHub Actions workflows. Changes here can affect
every repository in the organisation.

## PR Requirements

- **Minor changes** (templates, docs, config): no Jira ticket required.
- **Complex changes** (especially workflows): a Jira ticket **must** be created in the
  impacted product's Jira project (e.g. WebApp, Platform, Inference Pipeline).
- Branch naming follows the pattern: `PROJECT-123/short-description`
- When creating pull requests, use the template defined in `PULL_REQUEST_TEMPLATE.md`.

## Commit Messages

Use concise, imperative-tense messages describing the change. Examples from history:

- `Update PR template to add stacked on comment`
- `Replace reference to DelayedJob with Solid Queue in PR template`
- `Handle multiple issue keys passed to release-version script`

## Tech Stack

- **GitHub Actions workflows** (YAML) — reusable `workflow_call` workflows in `.github/workflows/`
- **Node.js (ESM)** — automation scripts (`.mjs`) using `node-fetch`, `@actions/core`, `@actions/github`
- **APIs** — Jira REST API v3 and GitHub REST API

## Key Files

- `PULL_REQUEST_TEMPLATE.md` — org-wide PR template
- `.github/workflows/create-jira-issue.yml` — Dependabot PR handling and Jira issue creation
- `.github/workflows/rename-pr.yml` — PR title validation and renaming from branch name
- `.github/workflows/update-jira-issue.yml` — fixVersion management and Jira commenting on merge
- `.github/workflows/*.mjs` — supporting Node.js scripts for the workflows

## Important Context

- All workflows use `workflow_call` and are consumed by other repos — test changes carefully.
- The `check-issue-key.mjs` script supports multiple Jira keys per branch using `+` separator.
- The `release-version.mjs` script has complex version resolution logic based on release branches.
- The `comment-on-jira-issue.mjs` script converts Markdown to Atlassian Document Format (ADF)
  and handles image uploads from GitHub to Jira.
