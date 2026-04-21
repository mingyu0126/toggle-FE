# 05 Finish Branch

## Trigger

Run this after all planned tasks are complete and review gates passed.

## Mandatory Steps

1. Announce that `superpowers:finishing-a-development-branch` is the final workflow.
2. `Main Agent` should dispatch `DevOps` as a real subagent by default for meaningful release-readiness work.
3. Run final verification appropriate to the changed areas.
4. Wait for `DevOps` output when branch or release disposition depends on it, then merge the result into the feature state.
5. Summarize branch state against the approved plan.
6. Present or record the branch disposition:
   - merge locally
   - push and open PR
   - keep branch/worktree as-is
   - discard work
7. If a worktree was used, clean it up when the chosen disposition requires cleanup.
8. Ensure `handoff/` and `daily-log/` are current before closing the work.

## Runtime Release Protocol

- dispatch `DevOps` with current verification evidence, QA findings, and release context
- if DevOps identifies a release blocker, return work to the owning engineer or artifact owner before branch finalization
- if release notes or branch disposition evidence are missing, do not advance
- only `Main Agent` may decide that `Release Gate` and final branch handling are complete

## Forbidden

- finishing with stale docs or stale handoff artifacts
- offering merge/PR choices without verification
- claiming a feature is complete without a branch disposition

## Expected Outputs

- final verification summary
- branch disposition summary
- cleanup status

## Repository Verification Defaults

- Frontend-only change:
  - `cd apps/frontend && npm run lint`
  - `cd apps/frontend && npm run build`
- Backend-only change:
  - `cd apps/backend && ./gradlew test`
- Fullstack change:
  - `cd apps/backend && ./gradlew test`
  - `cd apps/frontend && npm run lint`
  - `cd apps/frontend && npm run build`

If a command is missing, document it as a repo gap and use the smallest credible fallback verification.
