---
description: QA and release checkpoint router under Main Agent orchestration, with separate quality and release ownership.
---

# QA And Release

This workflow starts after implementation exists and after `Main Agent` has authorized review.

Required order:

1. `main-agent-orchestration.md`
2. `04-code-review.md`
3. `05-finish-branch.md`

## QA Reviewer Responsibilities

- functional QA
- code review against approved design and plan
- permission and regression checks
- contract drift checks between frontend and backend
- findings capture in `handoff/qa/{feature}-qa.md`

QA output informs `Quality Gate`, but QA Reviewer does not close that gate independently.

## DevOps Responsibilities

- build verification
- test verification
- CI/CD and deployment impact review
- branch disposition readiness review
- release note capture when needed in `handoff/qa/{feature}-release.md` or `handoff/eng-review/{feature}-release.md`

DevOps output informs `Release Gate`, but DevOps does not close that gate independently.

## Required Checks

- role and permission regressions
- contract drift between frontend and backend
- repo-appropriate verification commands
- release/merge/keep/discard branch decision readiness
- documentation currency for `handoff/` and `daily-log/YYYY-MM-DD.md`
