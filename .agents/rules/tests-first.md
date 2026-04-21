# Tests First

## When This Applies

- new features
- bug fixes
- behavior changes
- refactors with behavioral risk

## Mandatory Rules

- Follow RED-GREEN-REFACTOR.
- Write a failing test first when the code path has a testable seam.
- Verify the test fails for the expected reason.
- Write the minimum code to pass.
- Re-run verification after the implementation and after refactor.

## Repository-Specific Requirements

### Backend

- Primary command: `cd apps/backend && ./gradlew test`
- Backend feature and bugfix work should treat automated tests as mandatory.

### Frontend

- There is currently no formal unit test command in `apps/frontend/package.json`.
- When practical, add targeted automated coverage.
- When not practical in the current task, explicitly record the test gap and still run:
  - `cd apps/frontend && npm run lint`
  - `cd apps/frontend && npm run build`
  - manual verification of the changed flow

## Forbidden

- writing production code before the test when a test seam exists
- calling manual testing alone "TDD"
- hiding missing frontend test coverage

## Expected Outputs

- failing-first test evidence where applicable
- passing verification result
- explicit note for any remaining test gap
