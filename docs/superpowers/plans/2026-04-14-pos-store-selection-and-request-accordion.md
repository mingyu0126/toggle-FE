# POS Store Selection And Request Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/pos`에서 매장 선택을 카드 직접 클릭 방식으로 바꾸고, 신청 현황 카드를 아코디언 토글 구조로 전환한다.

**Architecture:** 기존 `Pos.jsx`의 `selectedStoreId -> selectedStore` 파생 흐름을 유지하면서 선택 UI만 `button` 카드로 교체한다. 신청 현황은 렌더링 계층에 `expandedRequestIds` 상태를 추가해 데이터 구조를 바꾸지 않고 아코디언 동작만 입힌다.

**Tech Stack:** React 19, JSX, CSS Modules, Vite 7, lucide-react

---

### Task 1: Capture Workflow Exceptions And Scope

**Files:**
- Modify: `daily-log/2026-04-14.md`
- Reference: `handoff/design-review/pos-store-selection-and-request-accordion-design.md`

- [ ] **Step 1: Record why worktree/subagent defaults are not used**

Add a daily log entry that states:
- this change targets `/pos`
- same-path frontend files are already dirty in the current workspace
- explicit subagent delegation is unavailable in this session
- frontend test runner is not established, so verification will rely on build and targeted lint

- [ ] **Step 2: Re-read target page before edits**

Run: `sed -n '1,260p' apps/frontend/src/pages/Pos.jsx`
Expected: existing `selectedStoreId`, `selectedStore`, linked store list, and application list logic are visible.

### Task 2: Replace Store Select With Clickable Store Cards

**Files:**
- Modify: `apps/frontend/src/pages/Pos.jsx`
- Modify: `apps/frontend/src/pages/Pos.module.css`

- [ ] **Step 1: Update page state and handlers**

Add:
- a lightweight helper for checking selected store id
- a click path that calls `setSelectedStoreId(store.storeId)`

Preserve:
- `selectedStore`
- `useEffect([selectedStore])`
- all downstream save/status handlers

- [ ] **Step 2: Replace the dropdown markup**

Remove the conditional `select` and render a list of `button` cards instead, each showing:
- store name
- store address
- status badge
- selected indicator

- [ ] **Step 3: Add accessible and responsive styling**

Create CSS classes for:
- store card list container
- store card base / hover / active / selected
- selected indicator
- mobile-friendly spacing and touch target

- [ ] **Step 4: Verify no data-flow regressions in render**

Run: `npx eslint src/pages/Pos.jsx`
Workdir: `apps/frontend`
Expected: no lint errors from the modified page file.

### Task 3: Add Request Status Accordion

**Files:**
- Modify: `apps/frontend/src/pages/Pos.jsx`
- Modify: `apps/frontend/src/pages/Pos.module.css`

- [ ] **Step 1: Add accordion state**

Create `expandedRequestIds` state and a toggle function that opens/closes a specific `applicationId`.

- [ ] **Step 2: Split card header and details**

Refactor each application card into:
- header button with store name, badge, summary, chevron
- conditional details section with progress, verification rows, and reject reason

- [ ] **Step 3: Add accordion visuals**

Add CSS for:
- header button layout
- chevron rotation
- expanded card emphasis
- details section spacing and lightweight transition

- [ ] **Step 4: Verify render code stays syntactically correct**

Run: `npx eslint src/pages/Pos.jsx`
Workdir: `apps/frontend`
Expected: pass.

### Task 4: Final Verification

**Files:**
- Modify: `apps/frontend/src/pages/Pos.jsx`
- Modify: `apps/frontend/src/pages/Pos.module.css`

- [ ] **Step 1: Run targeted lint**

Run: `cd apps/frontend && npx eslint src/pages/Pos.jsx src/pages/Pos.module.css`
Expected: JS file passes; CSS file may be ignored by eslint depending on config.

- [ ] **Step 2: Run production build**

Run: `cd apps/frontend && npm run build`
Expected: Vite build completes successfully.

- [ ] **Step 3: Summarize changed files and user-visible behavior**

Prepare final response with:
- modified file list
- store selection behavior summary
- application accordion behavior summary
- verification results and any residual gaps
