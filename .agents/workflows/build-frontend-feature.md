---
description: End-to-end workflow for implementing frontend features in Toggle while preserving guest-first browsing, mobile/web consistency, and status clarity.
---

# Build Frontend Feature (Toggle)

## Purpose
Use this workflow when implementing a new frontend feature for Toggle.

This workflow ensures:
- product scope is understood before UI work starts
- mobile and web routes stay consistent
- guest browsing is not accidentally blocked
- status-driven UX remains clear
- frontend changes stay aligned with backend/domain rules

---

## Input

- rough feature idea OR requirement
- existing product context in `/docs`
- existing frontend implementation in `apps/frontend`
- optional: related PRD, API contract, ERD, mocks

---

## 🚨 MANDATORY RULES

- MUST follow `frontend-rules.md`
- MUST preserve guest-first browsing
- MUST validate mobile/web route impact
- MUST keep status representation consistent with product docs
- MUST handle loading, empty, error, and login-required states

---

## Execution Steps

### 0. Understand Existing Frontend Context

Check:
- which routes already exist
- whether the feature affects mobile, web, or both
- whether current screens use mocks, shared components, or page-local logic
- whether status or permission behavior is already inconsistent

Do NOT design in isolation from the existing codebase.

---

### 1. Clarify Feature Scope

- identify the user problem
- define target role:
  - Guest
  - Member
  - Owner
  - Admin
- decide whether the feature belongs to:
  - mobile routes
  - web routes
  - both
- reduce to MVP scope

If scope is unclear, refine before implementation.

---

### 2. Load Product And Domain Context

Review as needed:
- `docs/product/toggle.md`
- `docs/architecture/toggle_erd.md`

If frontend behavior depends on schema or enum interpretation:
- verify standardized values first

If the feature changes data shape or schema expectations:
- coordinate with `backend-erd-review`
- coordinate with `design-api-contract`

---

### 3. Define Frontend Behavior

Decide and document:
- entry point
- route impact
- UI states
- login boundary
- map/list/detail consistency rules
- mobile/web parity rules

At minimum, answer:
- What can guests do?
- What requires login?
- What changes on mobile?
- What changes on web?
- What happens on empty/error states?

---

### 4. Identify Reuse vs New UI

Before creating new files, check:
- can an existing common component be reused?
- can current pages share helper logic?
- is this actually a page concern instead of a reusable component?

Preferred order:
1. reuse existing component
2. extend existing component carefully
3. create a new component only when responsibility is clearly separate

---

### 5. Prepare Data Flow

Determine:
- mock-driven implementation or real API integration
- page-local state vs lifted state
- where enum/status mapping should live
- how selected place, filter state, and auth prompts are coordinated

Rules:
- keep raw API/mock data out of deeply presentational components
- keep domain mapping centralized
- do not duplicate status label/color logic across pages

---

### 6. Implement Frontend

Possible implementation scope:
- page components
- shared components
- CSS Modules
- route wiring
- mocks
- constants
- lightweight helpers

Must ensure:
- no guest browsing regression
- no route mismatch between mobile and web where parity is expected
- no hidden login requirement for browse flows
- no status inconsistency between map/list/detail

---

### 7. Self Review

Check:
- route clarity
- prop clarity
- duplicate logic
- auth boundary correctness
- state predictability
- styling consistency
- mobile/web parity

If architecture or plan quality is in doubt:
- use `gstack-plan-design-review`
- use `gstack-plan-eng-review` when data flow or integration risk is high

---

### 8. QA Validation

Validate at minimum:
- guest happy path
- member happy path if relevant
- login-required action prompt
- empty state
- error state
- mobile route rendering
- web route rendering if relevant
- status display consistency

If a runnable frontend is available:
- use `gstack-browse` and/or `gstack-qa`

---

### 9. Final Validation

Ensure:
- product requirement ↔ frontend behavior consistency
- backend/domain enum consistency
- no accidental guest access regression
- no accidental owner/admin UI exposure
- no unnecessary divergence between mobile and web flows

---

## Output

- frontend implementation plan
- route impact summary
- affected components/pages summary
- QA considerations

Save related artifacts under `handoff/` when the task requires formal handoff.

---

## Notes

- Do NOT rewrite the app structure just because a cleaner architecture is imaginable
- Do NOT force TypeScript or Tailwind into the current codebase unless requested
- Do NOT let mock-driven UI invent backend contracts silently
- Always prefer small, shippable frontend changes that preserve existing flows

---

## Naming Convention

- feature names must be lowercase kebab-case

Examples:
- favorite-store
- public-map-detail
- owner-status-update
- shared-map-view
