# Verify Before Done

## When This Applies

For any substantive implementation, refactor, QA, or bugfix completion.

## Mandatory Rules

- A task is not done until verification is run and reported.
- Verification must match the changed surface.
- Update the relevant `handoff/` artifact if the behavior, contract, QA scope, or release note changed.
- Update `daily-log/YYYY-MM-DD.md` in the same session.

## Repository Verification Minimums

- Frontend-only:
  - `cd apps/frontend && npm run lint`
  - `cd apps/frontend && npm run build`
- Backend-only:
  - `cd apps/backend && ./gradlew test`
- Fullstack/API contract:
  - `cd apps/backend && ./gradlew test`
  - `cd apps/frontend && npm run lint`
  - `cd apps/frontend && npm run build`
  - manual or QA flow verification

## Forbidden

- claiming success from inspection alone
- skipping verification because CI is disabled or absent
- leaving verification implicit

## Expected Outputs

- exact commands run
- result summary
- remaining known gaps, if any
