---
description: Top-level orchestration contract for Main Agent driven feature delivery.
---

# Main Agent Orchestration

Use this document as the top-level operating contract for feature work.

`Main Agent` owns the workflow. Specialist roles produce outputs inside that workflow. The numbered `01~05` Superpowers documents remain the mandatory execution spine underneath.

## Canonical Flow

1. intake the request through `Main Agent`
2. inspect code, docs, `handoff/`, and `daily-log/`
3. confirm the feature name
4. route to `Product Planner`
5. route to `UI/UX Designer`
6. approve frontend/backend parallel implementation when applicable
7. require post-implementation design review when applicable
8. route to `QA Reviewer`
9. route to `DevOps`
10. close with `Main Agent` gate decisions and documentation check

## Dispatch -> Wait -> Merge Protocol

`Main Agent` should use this runtime loop whenever specialist work is delegated:

1. dispatch the specialist with a bounded brief
2. wait only when the next critical-path decision depends on that specialist result
3. merge the result into the active feature state
4. decide one of:
   - advance to the next role
   - re-dispatch the same role with clarified context
   - dispatch another role because ownership changed
   - fail or hold the current gate

Every merge step should capture:

- what the specialist inspected
- what artifact or answer they returned
- whether the output was accepted, rejected, or sent back
- what gate state changed, if any

## Role Interfaces

### Product Planner

Input:

- user request interpreted by `Main Agent`
- existing PM artifacts and relevant code/docs

Output:

- `handoff/pm/{feature}.md`

Exit conditions:

- scope, success criteria, constraints, and out-of-scope items are explicit

Main Agent approval:

- must pass `Scope Gate` before design or implementation planning advances
- if the planner output is incomplete or contradictory, re-dispatch `Product Planner` instead of advancing

### UI/UX Designer

Input:

- approved planner output
- relevant design and UI context

Output:

- `handoff/design-review/{feature}-design.md`

Exit conditions:

- user flow, states, role behavior, and exception states are explicit

Main Agent approval:

- must pass `Design Gate` before implementation begins
- if design leaves state, role, or exception handling ambiguous, re-dispatch `UI/UX Designer` or hold the gate

### Frontend Engineer

Input:

- approved planner and designer artifacts
- approved frontend/backend contract

Output:

- `handoff/eng-review/{feature}-frontend.md` when durable frontend review notes are needed

Exit conditions:

- implementation and verification match the approved design and contract

Main Agent approval:

- may start only after `Scope Gate` and `Design Gate` pass
- may not claim `Implementation Gate` without Main Agent review
- if frontend output conflicts with backend contract, hold `Implementation Gate` and re-dispatch the conflicting owner

### Backend Engineer

Input:

- approved planner artifact
- approved API/domain contract

Output:

- `handoff/eng-review/{feature}-api.md`

Exit conditions:

- implementation and verification match the approved domain and API contract

Main Agent approval:

- may start only after `Scope Gate` and `Design Gate` pass
- may not claim `Implementation Gate` without Main Agent review
- if backend output conflicts with frontend expectations, hold `Implementation Gate` and re-dispatch the conflicting owner

### QA Reviewer

Input:

- implementation outputs
- planner, design, and engineering artifacts

Output:

- `handoff/qa/{feature}-qa.md`

Exit conditions:

- functional QA and review findings are recorded clearly enough to judge release risk

Main Agent approval:

- may start only after implementation is complete enough for review
- informs but does not independently close `Quality Gate`
- if findings are blocking and owned by implementation, re-dispatch the responsible engineer before advancing

### DevOps

Input:

- current implementation state
- QA findings
- build/test/release context

Output:

- `handoff/qa/{feature}-release.md`
- or `handoff/eng-review/{feature}-release.md`

Exit conditions:

- build/test/release-readiness evidence is current

Main Agent approval:

- may start only after implementation is complete and QA has surfaced blocking issues
- informs but does not independently close `Release Gate`
- if release readiness is blocked by QA findings, the work returns to implementation or QA first rather than bypassing the gate

## Gate Policy

### Scope Gate

Evidence:

- planner artifact exists and is decision-ready

Failure examples:

- missing success criteria
- mixed scope with no out-of-scope definition

### Design Gate

Evidence:

- design artifact covers normal, empty, error, and permission-sensitive states

Failure examples:

- backend-only assumptions leaking into frontend work with no explanation
- undefined exception state handling

### Implementation Gate

Evidence:

- frontend and backend outputs match the approved contract
- implementation verification is current

Failure examples:

- DTO drift
- UI behavior contradicts approved design

### Quality Gate

Evidence:

- QA artifact records findings, severity, and remaining risk

Failure examples:

- unresolved blocking defects
- missing regression coverage on touched contract surfaces

### Release Gate

Evidence:

- build/test/release artifact records operational impact and branch-readiness

Failure examples:

- missing critical verification command
- known deployment risk with no mitigation recorded

### Documentation Gate

Evidence:

- required `handoff/` artifacts are current
- `daily-log/YYYY-MM-DD.md` includes orchestration decisions and verification summary

Failure examples:

- implementation changed but no durable artifact was updated
- `daily-log` omitted for substantive work

## Specialist Skill Autonomy

Specialists may choose skills that fit their assigned role.

They may not independently:

- skip required roles
- start implementation before authorized
- pass any gate
- expand scope
- declare QA complete
- declare release complete

If a specialist thinks a role can be skipped, that recommendation goes back to `Main Agent` for an explicit recorded decision.

## Re-Routing Rules

When specialist output is incomplete:

- re-dispatch the same specialist with clarified instructions

When specialist output conflicts with another role's approved contract:

- hold the current gate
- route to the role that owns the conflicting contract surface
- require updated artifact evidence before advancing

When specialist output reveals missing upstream decisions:

- route back upstream rather than patching around the gap downstream
- examples:
  - engineer finds missing UX state -> return to `UI/UX Designer`
  - QA finds unclear success criteria -> return to `Product Planner`
  - DevOps finds undocumented rollout risk -> return to the responsible engineer plus release artifact update
