---
description: Main Agent entrypoint for fullstack features with planner/design gates and frontend/backend parallel implementation.
---

# Build Fullstack Feature

Use this as the default router for any feature that touches both `apps/frontend` and `apps/backend`, or when the request scope is unclear at intake.

This is not a standalone process. It is the fullstack specialization of `main-agent-orchestration.md`.

## Required Order

1. `main-agent-orchestration.md`
2. `01-brainstorming.md`
3. `02-planning.md`
4. `03-tdd-execution.md`
5. `04-code-review.md`
6. `qa-release.md`
7. `05-finish-branch.md`

## Default Role Sequence

1. `Main Agent` inspects existing artifacts and confirms the feature name.
2. `Product Planner` defines scope and success criteria.
3. `UI/UX Designer` defines UX, states, and contract-sensitive behavior.
4. `Main Agent` passes `Scope Gate` and `Design Gate`.
5. `Frontend Engineer` and `Backend Engineer` start in parallel.
6. `UI/UX Designer` performs final design review when applicable.
7. `QA Reviewer` performs QA and code review.
8. `DevOps` validates build, test, release, and branch readiness.
9. `Main Agent` closes `Implementation`, `Quality`, `Release`, and `Documentation` gates.

## Runtime Execution Pattern

For actual execution, `Main Agent` should:

1. dispatch `Product Planner`, wait, and merge planner output
2. dispatch `UI/UX Designer`, wait, and merge design output
3. after `Scope Gate` and `Design Gate`, dispatch `Frontend Engineer` and `Backend Engineer` in parallel when write scopes are separable
4. wait for both implementation branches before deciding `Implementation Gate`
5. dispatch `QA Reviewer` and `DevOps` after implementation is stable enough for review
6. merge review outputs and either advance or re-route fixes

If a parallel branch returns conflicting contract changes, `Main Agent` must stop forward progress, reconcile the contract, and re-dispatch the affected branch.

## Required Inputs

- relevant `handoff/` artifacts
- relevant code and docs
- explicit feature name shared across artifacts

## Required Outputs

- planner output: `handoff/pm/{feature}.md`
- design output: `handoff/design-review/{feature}-design.md`
- backend output: `handoff/eng-review/{feature}-api.md`
- frontend output when needed: `handoff/eng-review/{feature}-frontend.md`
- QA output: `handoff/qa/{feature}-qa.md`
- release output when needed: `handoff/qa/{feature}-release.md` or `handoff/eng-review/{feature}-release.md`
- orchestration decision trail in `daily-log/YYYY-MM-DD.md`

## Fullstack-Specific Rules

- frontend and backend may run in parallel only after planner and design outputs are approved
- contract drift between frontend and backend is a blocking issue for `Implementation Gate`
- QA does not replace DevOps, and DevOps does not replace QA
- designer is expected both before implementation and again after implementation when visual or UX behavior changed
- if QA finds implementation defects, work returns to the owning engineer before `Quality Gate` can pass
- if DevOps finds release blockers, work returns to the owning engineer or release artifact owner before `Release Gate` can pass
