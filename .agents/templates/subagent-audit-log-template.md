# Subagent Audit Log

## Dispatch
- Role: {Role Name}
- Feature: {Feature Name}
- Stage: {Current stage}
- Triggered by: {Why Main Agent dispatched this role}

## Inputs
- `path/to/input-1`
- `path/to/input-2`

## Expected Output
- `path/to/output`
- or response contract

## Result
- Status: accepted | re-dispatched | blocked | rejected
- Output summary: {What the subagent returned}
- Verification summary: {What evidence came back}

## Main Agent Decision
- Gate impact: {No change | gate held | gate passed}
- Next route: {Role or workflow}
- Notes: {Conflict resolution or follow-up}
