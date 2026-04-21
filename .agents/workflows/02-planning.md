# 02 Planning

## Trigger

Run this only after brainstorming/design is approved.

## Mandatory Steps

1. Announce that `superpowers:writing-plans` is the active workflow.
2. Create a written plan before any implementation starts.
3. Break work into small, independently verifiable tasks.
4. Prefer tasks that take a few minutes each and touch one coherent behavior.
5. For each task, define:
   - exact target area
   - expected verification command
   - whether the task is frontend, backend, docs, or mixed
6. Decide execution mode:
   - default: `superpowers:subagent-driven-development`
   - fallback: `superpowers:executing-plans`
7. Save the plan to one of:
   - `docs/superpowers/plans/YYYY-MM-DD-{feature}.md`
   - or `handoff/eng-review/{feature}-implementation-plan.md` if tighter repo-local handoff is better

## Forbidden

- vague tasks like "implement feature"
- tasks that combine unrelated frontend, backend, and release work
- plan steps without concrete verification
- assuming frontend tests exist when they do not

## Expected Outputs

- written implementation plan
- chosen execution mode
- clear verification matrix for each task

## Repository Notes

Use actual commands from this repo:

- Frontend lint: `cd apps/frontend && npm run lint`
- Frontend build: `cd apps/frontend && npm run build`
- Backend test: `cd apps/backend && ./gradlew test`
- Backend build: `cd apps/backend && ./gradlew build`

Proposed, not yet present:

- Frontend unit test command: `cd apps/frontend && npm run test`
- Suggested future stack: `Vitest + React Testing Library`
