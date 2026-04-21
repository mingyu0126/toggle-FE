# 03 TDD Execution

## Trigger

Run this only after a written plan is approved.

## Mandatory Steps

1. Announce that execution follows:
   - `superpowers:using-git-worktrees`
   - `superpowers:subagent-driven-development` by default
   - `superpowers:test-driven-development`
2. For non-trivial feature work, create or use an isolated worktree.
3. If specialist implementation work is required, `Main Agent` should dispatch real subagents by default using `main-agent-runtime-dispatch.md`.
4. Execute work task-by-task, not as one large batch.
5. Follow RED-GREEN-REFACTOR for each testable behavior:
   - write failing test first
   - verify the failure
   - write minimal implementation
   - verify pass
   - refactor while staying green
6. Verify after each task, not just at the end.
7. Update `handoff/` if plan, contract, or QA scope changed.
8. Append the session result to `daily-log/YYYY-MM-DD.md`.

## Forbidden

- production code before a failing test when a test seam exists
- skipping test execution because a change is "obvious"
- executing a full feature in one opaque patch
- silently accepting missing frontend test coverage

## Expected Outputs

- implemented code aligned with the approved plan
- verification evidence per task
- updated docs/handoff when behavior changed
- subagent-produced outputs when execution was delegated by role

## Repository Verification Commands

### Frontend

- Baseline verification: `cd apps/frontend && npm run lint`
- Build verification: `cd apps/frontend && npm run build`

Current gap:

- No frontend unit test command is defined yet.
- When practical, add targeted automated coverage.
- If not practical in the current task, explicitly record the gap and still run lint, build, and manual verification.

### Backend

- TDD verification: `cd apps/backend && ./gradlew test`
- Build verification when needed: `cd apps/backend && ./gradlew build`

### Fullstack

- Run backend test
- Run frontend lint
- Run frontend build
- Perform manual or QA flow verification for the touched contract
