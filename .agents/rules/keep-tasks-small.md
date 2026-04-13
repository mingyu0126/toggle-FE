# Keep Tasks Small

## When This Applies

During plan writing and execution.

## Mandatory Rules

- Break work into small, independently verifiable tasks.
- Each task should change one coherent behavior or boundary.
- Each task must name the target area and verification step.
- Prefer separate tasks for:
  - failing test
  - pass implementation
  - refactor
  - review/fix loop

## Forbidden

- vague mega-tasks like "implement the whole feature"
- bundling unrelated frontend, backend, docs, and release changes into a single task
- tasks without explicit verification

## Expected Outputs

- small checklist-style tasks
- clear per-task verification
- better suitability for subagent-driven execution
