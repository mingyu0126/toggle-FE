# 01 Brainstorming

## Trigger

Run this before any of the following:

- new feature work
- meaningful UX change
- API or DTO contract change
- non-trivial bugfix with unclear root cause or scope
- refactor that changes behavior or boundaries

## Mandatory Steps

1. Announce that `superpowers:brainstorming` is the required first workflow.
2. Inspect current context before asking to code:
   - `handoff/`
   - `docs/`
   - `daily-log/`
   - relevant code paths in `apps/frontend` or `apps/backend`
3. Identify whether the work affects:
   - frontend only
   - backend only
   - both
   - release/process only
4. Produce a concise design/spec before implementation.
5. Get a human approval checkpoint on the design/spec before moving on.
6. Save the approved design in an existing project convention:
   - product/scope heavy work: `handoff/pm/{feature}.md`
   - UX-heavy work: `handoff/design-review/{feature}-design.md`
   - if a richer Superpowers spec is needed, additionally save to `docs/superpowers/specs/`

## Forbidden

- editing feature code before the design exists
- inventing new API shapes without checking existing DTO and lib wrappers
- bundling design approval and implementation into one step
- skipping human approval because the change "looks small"

## Expected Outputs

- approved design/spec artifact
- affected surfaces summary
- explicit statement of success criteria and out-of-scope items

## Repository Notes

- Backend shape should follow controller -> service -> repository.
- Frontend shape should follow page/component/hook/lib boundaries already used in `apps/frontend/src`.
- If the change affects both frontend and backend, the design must lock the contract before either side starts coding.
