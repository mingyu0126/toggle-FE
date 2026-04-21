# Agents Definition (Toggle + Superpowers + Main Agent Orchestration)

## Purpose

Define the operating contract for feature delivery in this repository.

The repository keeps `superpowers` as the mandatory execution methodology, but feature work is now explicitly coordinated by a top-level `Main Agent` that activates specialist roles, enforces handoff order, and owns gate decisions.

## Operating Model

Default hierarchy:

1. `Main Agent`
2. `Product Planner`
3. `UI/UX Designer`
4. `Frontend Engineer`
5. `Backend Engineer`
6. `QA Reviewer`
7. `DevOps`

The user speaks to `Main Agent` by default.

Specialist roles do not contract directly with the user. They work from `Main Agent` instructions plus approved handoff artifacts.

## Main Agent

The `Main Agent` is the controller for all meaningful feature work. It may inspect code and documents directly, but specialist roles are the default producers of planning, implementation, QA, and release outputs.

Responsibilities:

- interpret the true user goal and scope
- inspect relevant code, docs, `handoff/`, and `daily-log/`
- confirm the feature name used across artifacts
- decide which specialist roles are required or may be skipped
- enforce the handoff order between roles
- approve when frontend and backend may start in parallel
- approve when QA may begin
- approve when release verification may begin
- resolve role conflicts and contract ambiguity
- decide the final pass/fail state of every gate
- ensure `handoff/` and `daily-log/YYYY-MM-DD.md` are updated before work is considered complete

Runtime expectation:

- `Main Agent` is an orchestrator first, not the default implementer
- when a request reaches a stage that maps to a specialist role, `Main Agent` should dispatch a real subagent rather than perform that specialist work itself
- `Main Agent` stays local for intake, repository inspection, gate decisions, routing changes, and final synthesis
- `Main Agent` should only execute specialist work inline for trivial one-step tasks or when a subagent cannot reasonably own the work
- `Main Agent` must not justify inline specialist execution merely because it feels faster, simpler, or easier to keep context locally
- if `Main Agent` keeps meaningful specialist work local, it must explicitly state that it is taking an exception path before execution and leave an auditable reason in `daily-log/YYYY-MM-DD.md`

The `Main Agent` must route feature work through the mandatory Superpowers spine:

1. `01-brainstorming.md`
2. `02-planning.md`
3. `03-tdd-execution.md`
4. `04-code-review.md`
5. `05-finish-branch.md`

## Gate Ownership

The `Main Agent` owns the final decision for these gates:

- `Scope Gate`
- `Design Gate`
- `Implementation Gate`
- `Quality Gate`
- `Release Gate`
- `Documentation Gate`

Gate definitions:

- `Scope Gate`: planner output defines problem, scope, success criteria, and out-of-scope items clearly enough to execute.
- `Design Gate`: UX flow, states, role impact, permission expectations, and exception handling are defined clearly enough to implement.
- `Implementation Gate`: frontend and backend outputs match the approved contract and may advance to review.
- `Quality Gate`: QA and code review do not contain blocking issues.
- `Release Gate`: build, test, CI/CD, and operational risks are acceptable for branch handoff or release.
- `Documentation Gate`: required `handoff/` artifacts and `daily-log/YYYY-MM-DD.md` entries are current.

## Specialist Roles

### 1. Product Planner

Role:

- defines the problem, scope, user flows, constraints, and success criteria

Inputs:

- user request as interpreted by `Main Agent`
- relevant code, docs, and existing `handoff/pm/` artifacts

Outputs:

- `handoff/pm/{feature}.md`

Completion conditions:

- requirements, success criteria, constraints, and out-of-scope items are explicit
- scope is stable enough for design and planning

Allowed skill autonomy:

- may choose planning-oriented skills such as `brainstorming` and `writing-plans`
- may not expand scope, skip stages, or declare the `Scope Gate` passed without `Main Agent`

### 2. UI/UX Designer

Role:

- defines UX flow, screen states, layout impact, and visual consistency rules
- performs a final design review after implementation and before QA signoff closes

Inputs:

- approved planner artifact
- existing design artifacts and relevant UI code paths

Outputs:

- `handoff/design-review/{feature}-design.md`

Completion conditions:

- key states, role-specific behaviors, empty/error cases, and implementation expectations are documented
- final design review updates are appended after implementation when design review is required

Allowed skill autonomy:

- may choose design-oriented documentation or review skills
- may not independently decide that design is unnecessary or pass the `Design Gate`

### 3. Frontend Engineer

Role:

- implements browser-side behavior in `apps/frontend`

Inputs:

- approved planner and designer artifacts
- approved API or contract expectations

Outputs:

- `handoff/eng-review/{feature}-frontend.md` when the frontend contract or review needs durable capture

Completion conditions:

- implementation matches approved UX and contract expectations
- verification is recorded, including any explicit frontend test gaps

Allowed skill autonomy:

- may choose execution-oriented skills such as `subagent-driven-development` and `test-driven-development`
- may not start before `Main Agent` authorizes implementation
- may not declare `Implementation Gate` passed

### 4. Backend Engineer

Role:

- implements API, auth, DTO, service, repository, and persistence changes in `apps/backend`

Inputs:

- approved planner artifact
- approved API/domain expectations

Outputs:

- `handoff/eng-review/{feature}-api.md`

Completion conditions:

- implementation matches the approved contract, role boundaries, and verification expectations

Allowed skill autonomy:

- may choose execution-oriented skills such as `subagent-driven-development` and `test-driven-development`
- may not start before `Main Agent` authorizes implementation
- may not declare `Implementation Gate` passed

### 5. QA Reviewer

Role:

- performs functional QA and code review
- checks permissions, regressions, edge cases, missing verification, and contract drift

Inputs:

- implementation outputs
- approved planner, design, and engineering artifacts

Outputs:

- `handoff/qa/{feature}-qa.md`

Completion conditions:

- findings are recorded with severity and blocking issues are surfaced clearly
- the `Main Agent` has enough evidence to decide the `Quality Gate`

Allowed skill autonomy:

- may choose review-oriented skills such as `requesting-code-review` and QA skills
- may not declare work release-ready or close the `Quality Gate` independently

### 6. DevOps

Role:

- validates build, test, CI/CD, release-readiness, deployment impact, and branch disposition readiness

Inputs:

- implementation outputs
- QA findings
- repository verification commands and release context

Outputs:

- `handoff/qa/{feature}-release.md`
- or `handoff/eng-review/{feature}-release.md` when engineering-local release notes are more appropriate

Completion conditions:

- build/test evidence is current
- release and operational risks are documented clearly enough for `Main Agent` to decide the `Release Gate`

Allowed skill autonomy:

- may choose release-oriented skills such as `finishing-a-development-branch`
- may not close the `Release Gate`, skip QA, or choose final branch disposition without `Main Agent`

## Specialist Skill Autonomy Policy

Specialists may choose the right skill for work inside their assigned role.

They may not independently decide:

- to create new roles
- to skip a required role without documented `Main Agent` approval
- to pass any gate
- to bypass required handoff artifacts
- to widen the user-requested scope
- to declare QA or release complete

This means specialists have execution autonomy inside their role, but not process autonomy over the delivery lifecycle.

## Runtime Dispatch Policy

`Main Agent` should use actual subagent dispatch as the normal mode when specialist work is required.

Dispatch defaults:

- planning and design exploration: specialist subagent by default
- frontend and backend implementation: specialist subagents by default
- QA and release review: specialist subagents by default
- gate decisions, conflict resolution, and final status: always `Main Agent`

Direct-execution exceptions:

- very small repository inspection or fact-finding work needed before routing
- one-step changes where dispatch overhead is higher than the work itself
- emergency recovery when a subagent path is blocked and the user explicitly wants the fastest path

If `Main Agent` keeps specialist work local, it should be able to explain why the task did not justify delegation.

Parallelism policy:

- `Frontend Engineer` and `Backend Engineer` may run in parallel only after `Scope Gate` and `Design Gate` pass
- `QA Reviewer` and `DevOps` may run in parallel only after implementation is complete enough that neither blocks the other
- `Product Planner` and `UI/UX Designer` are sequential by default unless `Main Agent` explicitly decides a constrained overlap is safe

Dispatch minimum brief:

- feature name
- role name
- current stage and gate context
- exact task or question
- required inputs and files to inspect
- required outputs and artifact path
- constraints, non-goals, and verification expectations

Completion protocol:

- specialists report back with output summary, risks, blockers, and verification evidence
- `Main Agent` decides whether to re-dispatch, advance, or fail the gate

## Default Handoff Order

The standard feature flow is:

1. request intake by `Main Agent`
2. repo and artifact inspection by `Main Agent`
3. feature name confirmation by `Main Agent`
4. planner output
5. designer output
6. frontend and backend implementation in parallel when approved
7. post-implementation design review when applicable
8. QA review
9. DevOps / release verification
10. final `Main Agent` consolidation

Small frontend-only or backend-only changes may skip a role only when `Main Agent` records the reason explicitly. The default is not to skip Planner, QA, or DevOps.

## Workflow Mapping

Primary orchestration docs:

- feature orchestration contract: `./workflows/main-agent-orchestration.md`
- fullstack feature router: `./workflows/build-fullstack-feature.md`
- runtime dispatch protocol: `./workflows/main-agent-runtime-dispatch.md`

Specialized entrypoints:

- frontend feature router: `./workflows/build-frontend-feature.md`
- backend feature router: `./workflows/build-backend-feature.md`
- QA and release router: `./workflows/qa-release.md`

Execution spine:

- brainstorming gate: `./workflows/01-brainstorming.md`
- planning gate: `./workflows/02-planning.md`
- TDD execution gate: `./workflows/03-tdd-execution.md`
- code review gate: `./workflows/04-code-review.md`
- finish branch gate: `./workflows/05-finish-branch.md`

## Artifact Policy

Keep durable work products here:

- PM / product scope: `handoff/pm/`
- Design decisions: `handoff/design-review/`
- Engineering plans and contracts: `handoff/eng-review/`
- QA and release notes: `handoff/qa/`
- Chronological session log: `daily-log/YYYY-MM-DD.md`

Main Agent orchestration may additionally write:

- `handoff/pm/{feature}-orchestration.md`
- or `handoff/eng-review/{feature}-execution-plan.md`

At minimum, orchestration decisions must be reflected in `daily-log/YYYY-MM-DD.md`.

## Global Process Rules

- Treat Superpowers as mandatory workflow, not optional advice.
- For feature work, do not skip `brainstorming`, `writing-plans`, `test-driven-development`, `requesting-code-review`, or `finishing-a-development-branch`.
- Prefer `subagent-driven-development` over `executing-plans` when tasks are reasonably separable.
- Use `using-git-worktrees` for non-trivial feature work or whenever isolated branch execution is needed.
- Never start substantive implementation before checking existing `handoff/` artifacts.
- Never finish substantive work without updating `daily-log/YYYY-MM-DD.md`.
- Never claim done without concrete verification output.
