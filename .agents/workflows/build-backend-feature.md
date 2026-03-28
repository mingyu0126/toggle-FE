---
description: End-to-end workflow for implementing backend features in Toggle with PRD, API design, and QA preparation.
---

# Build Backend Feature (Toggle)

## Purpose
Use this workflow when implementing a new backend feature for Toggle.

This workflow ensures:
- proper scoping (PRD)
- correct API design
- role-safe implementation
- test coverage

---

## Input

- rough feature idea OR requirement
- existing product context (Toggle)
- optional: related docs in /docs

---

## 🚨 MANDATORY RULES

- MUST follow backend-rules.md
- MUST enforce role separation:
  - Guest / Member / Owner / Admin
- MUST use DTO (no entity exposure)
- MUST validate permissions and state transitions

---

## Execution Steps

### 0. Understand Problem Context

- What is the user trying to do?
- What is currently broken or missing?
- Why does this feature matter?

Do NOT proceed if problem is unclear.

### 1. Clarify Feature Scope

- Identify user problem
- Define target role
- Reduce to MVP scope

👉 If unclear, refine before proceeding

---

### 2. Generate PRD

Use:
→ `write-prd`

Output must include:
- user scenarios
- functional requirements
- edge cases
- role definition

Save to:
```
handoff/pm/{feature-name}-prd.md
```

---

### 3. Design API Contract

Use:
→ `design-api-contract`

Must define:
- endpoints
- request/response DTO
- auth rules
- error cases
- state transition rules

Save to:
```
handoff/eng-review/{feature-name}-api.md
```

### 3.5 Review ERD / Schema If Domain Changes

If the feature adds or changes database structure:

Use:
→ `backend-erd-review`

Must check:
- requirement coverage
- relationship integrity
- enum consistency
- index/constraint gaps

---

---

### 4. Generate Test Scenarios

Use:
→ `generate-test-scenarios`

Must include:
- guest flow
- member flow
- owner flow (if relevant)
- admin flow (if relevant)
- negative cases
- edge cases

Save to:
```
handoff/qa/{feature-name}-test.md
```

---

### 5. Validate Domain Logic

Check:

- status transition rules
- ownership constraints
- permission boundaries
- consistency across flows

If needed:
→ use `gstack-plan-eng-review`

---

### 6. Implement Backend

Follow:

- backend-rules.md
- API contract
- PRD requirements

Must ensure:

- controller → service → repository separation
- DTO usage
- proper validation
- correct error handling

Implementation may include:
- controller
- service
- repository
- dto
- entity update if required
- validation
- authorization logic
- tests if requested

---

### 7. Self Review

Use:
→ `gstack-review`

Check:

- role safety
- missing validation
- incorrect assumptions
- edge case coverage

---

### 8. Final Validation

Ensure:

- PRD ↔ API ↔ Implementation consistency
- permission enforcement
- status correctness
- test coverage completeness
- CI/CD implications reviewed if build or deploy flow changed

---

## Output

- PRD
- API contract
- test scenarios
- backend implementation plan

---

## Notes

- Do NOT skip PRD step
- Do NOT design API before defining scope
- Do NOT implement without test scenarios
- Always prefer smaller, shippable scope

## Naming Convention

- {feature-name} must be:
  - lowercase
  - kebab-case
  - descriptive

Examples:
- store-status-update
- favorite-store
- personal-map-create
