---
description: Backend feature entrypoint under Main Agent orchestration.
---

# Build Backend Feature

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
- if Designer is not needed, `Main Agent` must record the reason explicitly before implementation starts

Required artifact flow:

- planner output: `handoff/pm/{feature}.md`
- backend engineering output: `handoff/eng-review/{feature}-api.md`
- designer output when required: `handoff/design-review/{feature}-design.md`
- QA output: `handoff/qa/{feature}-qa.md`
- release output when needed: `handoff/qa/{feature}-release.md` or `handoff/eng-review/{feature}-release.md`
- orchestration decision trail: `daily-log/YYYY-MM-DD.md`

Backend-specific expectations:

- implementation happens in `apps/backend`
- auth, DTO, and role boundaries remain explicit
- backend execution may begin only after `Scope Gate` and any required `Design Gate` decision are explicitly passed
- verification uses `cd apps/backend && ./gradlew test`
- build verification uses `cd apps/backend && ./gradlew build` when release readiness matters
