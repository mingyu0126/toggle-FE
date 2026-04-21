---
description: Runtime dispatch protocol for when Main Agent should spawn, coordinate, and rejoin specialist subagents.
---

# Main Agent Runtime Dispatch

Use this document when `Main Agent` is actively executing work with real subagents.

This is the runtime counterpart to `main-agent-orchestration.md`. The orchestration document defines the operating model. This document defines how `Main Agent` should actually dispatch specialist subagents during a live task.

## Main Rule

When work clearly belongs to a specialist role, `Main Agent` should use a real subagent instead of simulating that role inline.

`Main Agent` stays local for:

- user communication
- repo inspection
- feature naming
- gate decisions
- conflict resolution
- final synthesis

This means `Main Agent` is the dispatcher and approver by default. Specialist production work belongs to specialist subagents.

## Dispatch Sequence

### 1. Intake And Grounding

`Main Agent` works locally to:

- inspect relevant code and artifacts
- identify affected surfaces
- determine whether the request is frontend, backend, fullstack, QA, release, or documentation heavy
- confirm the feature name

At this stage, do not dispatch blindly. Ground the task first, then delegate.

### 2. Scope And Design Dispatch

Default dispatch order:

1. dispatch `Product Planner`
2. wait for planner output
3. dispatch `UI/UX Designer`
4. wait for designer output
5. decide `Scope Gate` and `Design Gate`

Exception:

- if the change is backend-only and has no meaningful UX or state design impact, `Main Agent` may bypass `UI/UX Designer`, but the bypass reason must be recorded

### 3. Implementation Dispatch

After `Scope Gate` and `Design Gate` pass:

- dispatch `Frontend Engineer` if frontend work exists
- dispatch `Backend Engineer` if backend work exists

Parallel policy:

- run frontend and backend in parallel only when their write scopes are reasonably separable
- if contract churn is still likely, dispatch backend first or delay the dependent branch until the contract stabilizes

### 4. Post-Implementation Review Dispatch

After implementation is complete enough to review:

- dispatch `UI/UX Designer` again when visual or interaction behavior changed materially
- dispatch `QA Reviewer`
- dispatch `DevOps`

Wait policy:

- do not block on a subagent unless the next critical-path step truly depends on that result
- when multiple non-overlapping review tasks exist, dispatch them in parallel and keep `Main Agent` focused on synthesis

### 5. Final Consolidation

`Main Agent` collects outputs, decides the remaining gates, verifies documentation currency, and reports final status to the user.

## Agent Type Defaults

Recommended mapping:

- `Product Planner`: `default` agent for product/spec reasoning
- `UI/UX Designer`: `default` agent for design reasoning
- `Frontend Engineer`: `worker` agent
- `Backend Engineer`: `worker` agent
- `QA Reviewer`: `explorer` for read-heavy review, `worker` only if explicitly assigned fixes
- `DevOps`: `explorer` for verification-heavy release checks, `worker` only if explicitly assigned release-doc or config work

## Required Brief Format

Every subagent dispatch should include:

- role: the specialist role being assigned
- feature: stable feature name
- goal: exactly what this subagent must produce
- inputs: files, docs, and artifacts to inspect
- outputs: file or artifact to update, or exact answer format if read-only
- constraints: scope limits, role boundaries, non-goals
- verification: commands or evidence expected before completion
- ownership: which files or surfaces this subagent may change

Use `./templates/subagent-brief-template.md` as the default structure.

## Role-Specific Runtime Rules

### Product Planner

- default action: inspect current artifacts and produce/update `handoff/pm/{feature}.md`
- should not start implementation
- should escalate ambiguities back to `Main Agent`

### UI/UX Designer

- default action: produce or update `handoff/design-review/{feature}-design.md`
- may review implementation after FE/BE work completes
- should not independently approve implementation

### Frontend Engineer

- default action: implement approved frontend scope in `apps/frontend`
- should own only assigned frontend surfaces
- should not widen API contract or backend behavior without escalation

### Backend Engineer

- default action: implement approved backend scope in `apps/backend`
- should own only assigned backend surfaces
- should not widen frontend UX or route behavior without escalation

### QA Reviewer

- default action: inspect implementation and produce `handoff/qa/{feature}-qa.md`
- findings-first mindset
- should not silently fix issues unless explicitly reassigned implementation ownership

### DevOps

- default action: verify build/test/release readiness and produce release notes when needed
- should not merge release and QA judgment into one decision

## Re-Dispatch Rules

Re-dispatch the same specialist when:

- they returned `BLOCKED` because context was missing
- they found contract ambiguity that `Main Agent` resolved
- review found fixable issues in their owned area

Dispatch a different specialist when:

- the blocker is about a different role's responsibility
- implementation exposed a missing planner or designer decision
- QA surfaced release risk that belongs to DevOps

## Anti-Patterns

Do not:

- dispatch subagents before grounding the task locally
- let `Main Agent` quietly become the frontend engineer, backend engineer, QA reviewer, or DevOps owner for normal feature work
- let specialists decide gates
- let planner/design work and implementation start at the same time by default
- dispatch multiple implementers against the same write scope without explicit separation
- use QA or DevOps as a substitute for missing planning or design work

## Enforcement Default

For meaningful work, the expected pattern is:

1. `Main Agent` inspects and decides
2. specialist subagent executes
3. `Main Agent` reviews and routes

If step 2 is missing, the work should be treated as an exception, not the norm.
