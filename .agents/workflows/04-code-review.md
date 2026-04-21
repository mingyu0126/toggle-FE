# 04 Code Review

## Trigger

Run this after each meaningful implementation batch and before saying the work is done.

## Mandatory Steps

1. Announce that `superpowers:requesting-code-review` is required.
2. `Main Agent` should dispatch `QA Reviewer` as a real subagent by default for meaningful review work.
3. Review against:
   - approved design/spec
   - approved plan
   - current repository conventions
4. Check at minimum:
   - role and permission safety
   - DTO/API contract drift
   - missing validation
   - missing tests or missing verification
   - frontend/backend mismatch
   - visual or UX regressions if applicable
5. Wait for QA output if the next gate decision depends on it, then merge the result into the feature state.
6. Fix critical and important findings before moving forward.
7. Save meaningful QA/review findings to:
   - `handoff/qa/{feature}-qa.md`

## Runtime Review Protocol

- dispatch `QA Reviewer` with the approved spec, plan, touched files, and verification evidence
- if QA output is incomplete, re-dispatch `QA Reviewer` with clarified focus
- if QA findings are blocking, route fixes back to the owning engineer and re-run review
- only `Main Agent` may decide that `Quality Gate` has passed

## Forbidden

- treating successful build output as a substitute for review
- ignoring review findings because the change is small
- ending a feature without a documented QA/review checkpoint

## Expected Outputs

- review result with severity
- fixes for blocking issues
- QA/review artifact when findings or coverage matter

## Repository Notes

- For frontend work, review mobile/web parity and user-visible state handling.
- For backend work, review auth, status transitions, DTO shape, and error envelopes.
- For fullstack work, review whether frontend `src/lib` helpers still match backend DTOs and endpoints.
