---
description: Frontend feature entrypoint under Main Agent orchestration.
---

# Build Frontend Feature

Use this as a scoped router under `main-agent-orchestration.md`, not a standalone process.

Required order:

1. `main-agent-orchestration.md`
2. `01-brainstorming.md`
3. `02-planning.md`
4. `03-tdd-execution.md`
5. `04-code-review.md`
6. `qa-release.md`
7. `05-finish-branch.md`

Role expectations:

- `Main Agent` still decides whether Planner, Designer, QA Reviewer, and DevOps are required
- the default is not to skip Planner, QA Reviewer, or DevOps
- if design work is minimal, `Main Agent` must still record whether Designer was engaged or explicitly bypassed

Required artifact flow:

- planner output: `handoff/pm/{feature}.md`
- designer output when required: `handoff/design-review/{feature}-design.md`
- frontend engineering output when durable capture is useful: `handoff/eng-review/{feature}-frontend.md`
- QA output: `handoff/qa/{feature}-qa.md`
- release output when needed: `handoff/qa/{feature}-release.md` or `handoff/eng-review/{feature}-release.md`
- orchestration decision trail: `daily-log/YYYY-MM-DD.md`

Frontend-specific expectations:

- implementation happens in `apps/frontend`
- mobile/web route behavior must stay intentional
- frontend execution may begin only after `Scope Gate` and `Design Gate` are explicitly passed
- verification uses `cd apps/frontend && npm run lint` and `cd apps/frontend && npm run build`
- frontend automated unit tests are not yet configured; any gap must be called out explicitly
