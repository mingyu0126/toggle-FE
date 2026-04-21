# Toggle Development Workflow

## Overview

This repository uses `superpowers` as the default development methodology for Codex-driven work.

Codex should not jump straight into implementation. Every meaningful feature or behavior change must move through these stages:

1. Brainstorming
2. Planning
3. TDD execution
4. Code review
5. Finish branch

The `Main Agent` coordinates the process. Specialist roles such as planner, designer, frontend, backend, QA, and DevOps operate under that process instead of replacing it.

The operating model is layered:

- top layer: `Main Agent` orchestration
- runtime layer: real specialist subagent dispatch when work is role-separable
- execution layer: the mandatory `01~05` Superpowers workflow
- artifact layer: `handoff/` and `daily-log/`

Default hierarchy:

1. `Main Agent`
2. `Product Planner`
3. `UI/UX Designer`
4. `Frontend Engineer`
5. `Backend Engineer`
6. `QA Reviewer`
7. `DevOps`

By default, the user talks only to `Main Agent`.

By default, `Main Agent` should use actual subagents for specialist work instead of acting as the specialist directly.

The default runtime loop is:

1. dispatch the specialist
2. wait only when the next critical-path decision depends on that output
3. merge the result
4. either advance, re-dispatch, or fail/hold the current gate

The intended operating stance is:

- `Main Agent` decides and delegates
- specialist subagents produce the work
- `Main Agent` reviews and routes the next step

## How A Feature Starts

Every feature starts with `Main Agent` intake plus `brainstorming`.

At this stage Codex should:

- inspect current code, docs, `handoff/`, and `daily-log/`
- confirm the feature name shared across artifacts
- identify whether the change is frontend, backend, or fullstack
- decide which specialist roles are required
- define scope and success criteria
- produce a small design/spec artifact
- stop for human review before planning or coding

Recommended artifact locations:

- `handoff/pm/{feature}.md`
- `handoff/design-review/{feature}-design.md`
- optionally `docs/superpowers/specs/` for richer specs

If the request is frontend-only or backend-only, `Main Agent` may narrow role participation, but the default is not to skip Planner, QA, or DevOps. If Designer is bypassed, the reason must be documented.

## How Plans Must Be Written

After the design is approved, Codex must use a written implementation plan.

The plan must:

- break work into small tasks
- identify which tasks are frontend, backend, docs, or release
- define verification per task
- choose execution mode

Execution mode policy:

- default: `subagent-driven-development`
- fallback: `executing-plans`

Suggested plan location:

- `docs/superpowers/plans/YYYY-MM-DD-{feature}.md`
- or `handoff/eng-review/{feature}-implementation-plan.md`

For fullstack work, frontend and backend may not begin in parallel until `Main Agent` has passed both the `Scope Gate` and `Design Gate`.

Runtime dispatch default:

- `Product Planner` first
- `UI/UX Designer` second
- `Frontend Engineer` and `Backend Engineer` in parallel when approved
- `UI/UX Designer` final review when needed
- `QA Reviewer` and `DevOps` after implementation

`Main Agent` keeps gate ownership even when the underlying work is delegated.

`Main Agent` should not routinely collapse these steps back into one inline worker. If work stays local, it should be a narrow exception.

If a specialist returns incomplete or conflicting output, `Main Agent` must re-route explicitly rather than silently compensating downstream.

## How TDD Must Be Executed

Codex must follow RED-GREEN-REFACTOR for testable work.

Rules:

- no production code before a failing test when a test seam exists
- verify the failing state first
- write the minimum implementation to pass
- refactor only while green
- verify after each task

Repository-specific commands:

- Frontend lint: `cd apps/frontend && npm run lint`
- Frontend build: `cd apps/frontend && npm run build`
- Backend test: `cd apps/backend && ./gradlew test`
- Backend build: `cd apps/backend && ./gradlew build`
- Frontend dev: `cd apps/frontend && npm run dev`
- Backend dev: `cd apps/backend && ./gradlew bootRun`

Current repo gap:

- There is no frontend unit test command yet.
- Reasonable proposed default: `Vitest + React Testing Library` with `cd apps/frontend && npm run test`
- Until that exists, frontend work must still include lint, build, and manual verification, and the test gap must be documented.

## Main Agent Gates

`Main Agent` owns the final decision for these gates:

1. `Scope Gate`
2. `Design Gate`
3. `Implementation Gate`
4. `Quality Gate`
5. `Release Gate`
6. `Documentation Gate`

Interpretation:

- `Scope Gate`: planner artifact is decision-ready
- `Design Gate`: design artifact covers states, role behavior, and exceptions clearly enough to build
- `Implementation Gate`: frontend/backend implementation matches the approved contract
- `Quality Gate`: QA and review do not contain unresolved blocking issues
- `Release Gate`: build, test, CI/CD, and operational risk are acceptable
- `Documentation Gate`: required `handoff/` artifacts and `daily-log/YYYY-MM-DD.md` are current

## How Code Review Is Requested

Codex must request review after each meaningful implementation batch and before declaring a feature complete.

Review must check:

- scope compliance against the approved design and plan
- permission and auth regressions
- API/DTO drift between backend and frontend
- missing validation
- missing tests or weak verification
- visual or UX regressions when applicable

Meaningful review results should be written to:

- `handoff/qa/{feature}-qa.md`

The `QA Reviewer` owns quality findings, but does not independently close the `Quality Gate`.

## How Release Validation Works

`DevOps` is a distinct role from QA.

DevOps should check:

- build and test completeness
- CI/CD or deployment impact
- release-readiness and branch disposition risk

Release results should be written to:

- `handoff/qa/{feature}-release.md`
- or `handoff/eng-review/{feature}-release.md`

`DevOps` informs the `Release Gate`, but `Main Agent` makes the final pass/fail call.

## How A Branch Is Finalized

Once implementation and review pass, Codex must finish the branch deliberately.

Before a branch is considered complete:

- final verification commands must run
- the diff must still match the approved plan
- docs, `handoff/`, and `daily-log/` must be up to date
- the branch disposition must be explicit:
  - merge locally
  - push and create PR
  - keep as-is
  - discard

If a worktree was used, cleanup depends on that branch decision.

## Human Approval Checkpoints

Humans should approve these checkpoints explicitly:

1. Design approval before planning
2. Plan approval before execution
3. Review acceptance before final branch handling

If a change is ambiguous, the smallest reasonable assumption may be used, but it should be documented in the artifact for that stage.

## Specialist Skill Autonomy

Specialist roles may choose the skills that best fit their assigned work.

Examples:

- `Product Planner`: `brainstorming`, `writing-plans`
- `Frontend Engineer` / `Backend Engineer`: `subagent-driven-development`, `test-driven-development`
- `QA Reviewer`: `requesting-code-review`, QA skills
- `DevOps`: `finishing-a-development-branch`, release-oriented verification skills

Specialists may not independently:

- create or remove roles
- skip a required stage
- widen scope
- pass any gate
- declare QA complete
- declare release complete

Execution autonomy belongs to specialists. Process autonomy belongs to `Main Agent`.

Operationally, this means the user should experience `Main Agent` as the person assigning work, not the person doing every specialist task itself.

## Subagent Audit Trail

`daily-log/YYYY-MM-DD.md` should record not only the final work result, but also the Main Agent orchestration trail for meaningful delegated work.

Recommended minimum fields:

- which specialist was dispatched
- why that role was dispatched
- what inputs were provided
- what output came back
- whether the output was accepted, rejected, or re-dispatched
- what gate or routing decision changed next

Use `./.agents/templates/subagent-audit-log-template.md` when a durable format is helpful.

## Existing Project Conventions

This repo already uses:

- `.agents/` for role and workflow guidance
- `handoff/` for durable PM, design, engineering, QA, and release artifacts
- `daily-log/YYYY-MM-DD.md` for chronological working notes

Primary routing docs:

- `./.agents/agents.md`
- `./.agents/workflows/main-agent-orchestration.md`
- `./.agents/workflows/build-fullstack-feature.md`
- `./.agents/workflows/main-agent-runtime-dispatch.md`

Codex should keep using those conventions rather than inventing a parallel local process.
