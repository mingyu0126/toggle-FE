---
description: End-to-end QA and release validation workflow for Toggle, ensuring role-based access control, status consistency, and regression safety before deployment.
---

# QA & Release Workflow (Toggle)

## Purpose
Use this workflow before releasing a feature or deploying to production.

This workflow ensures:
- user flow correctness
- permission safety
- status consistency
- regression prevention

---

## Input

- implemented feature
- related PRD
- API contract
- test scenarios
- check existing handoff artifacts before running QA

---

## 🚨 MANDATORY RULES

- MUST follow qa-rules.md
- MUST test by role:
  - Guest
  - Member
  - Owner
  - Admin
- MUST validate real user flows
- MUST check cross-screen consistency

---

## Execution Steps

### 1. Load Test Scenarios

Use:
→ `generate-test-scenarios` (if missing)

Ensure scenarios include:
- happy path
- edge cases
- negative cases
- regression points

---

### 2. Execute Core User Flows

#### Guest
- map browsing works
- search works
- filter works
- store detail loads
- login is NOT required

#### Member
- favorite add/remove works
- personal map create/edit/delete works
- visibility (public/private) works

#### Owner
- can update own store status
- cannot update others
- status updates correctly reflected

#### Admin
- admin endpoints accessible only to admin
- moderation behaves correctly

---

### 3. Permission Validation (CRITICAL)

Verify:

- guest cannot access member endpoints
- member cannot access owner endpoints
- owner cannot modify other stores
- non-admin cannot access admin features

Expected:
- 401 Unauthorized
- 403 Forbidden

---

### 4. Status Consistency Check (CRITICAL)

When store status changes:

Verify consistency across:

- map
- list
- store detail

❗ MUST match everywhere

---

### 5. Status Transition Validation

Check:

- valid transitions succeed
- invalid transitions return 409 Conflict

---

### 6. Edge Case Testing

Test:

- no stores in range
- empty search results
- no favorites
- no maps
- deleted store access
- private map access denied
- API failure handling

---

### 7. Regression Checks

Verify:

- existing features still work
- favorites not broken
- map filtering still accurate
- status display correct

---

### 8. Code / Logic Review

Use:
→ `gstack-review`

Check:

- missing validation
- incorrect assumptions
- logic inconsistencies

---

### 9. Final Release Checklist

Ensure:

- all tests passed
- no critical bugs
- permission rules enforced
- API responses consistent
- no breaking changes

---

## Output

- QA result summary
- release-ready status

Save to:
```
handoff/qa/{feature-name}-qa-report.md
```

---

## Naming Convention

- {feature-name} must be:
  - lowercase
  - kebab-case
  - descriptive

Examples:
- store-status-update
- favorite-store
- personal-map-create

---

## Notes

- Do NOT skip permission checks
- Do NOT skip status consistency checks
- Do NOT rely only on happy path
- Always test real user scenarios