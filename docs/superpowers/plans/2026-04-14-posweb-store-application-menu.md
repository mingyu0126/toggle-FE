# POS Web Store Application Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/posweb` 좌측 메뉴에 `매장 등록 신청` 탭을 추가하고, PC에서 매장 등록 신청을 제출할 수 있게 한다.

**Architecture:** 기존 `PosWeb.jsx`의 sidebar tab 구조를 3탭으로 확장하고, 신청 생성은 `createOwnerStoreApplication()` API를 재사용한다. 제출 성공 후 신청 목록을 다시 읽고 `내 신청 현황` 탭으로 이동시켜 조회 흐름과 연결한다.

**Tech Stack:** React 19, JSX, CSS Modules, Vite 7

---

### Task 1: Document Workflow And Scope

**Files:**
- Modify: `daily-log/2026-04-14.md`
- Reference: `handoff/design-review/posweb-store-application-menu-design.md`

- [ ] **Step 1: Record scope and exceptions**

Add daily-log notes for:
- `/posweb` sidebar menu expansion
- local execution exception in current dirty workspace
- reuse of existing owner application API

### Task 2: Add Application Creation Tab

**Files:**
- Modify: `apps/frontend/src/pages/PosWeb.jsx`

- [ ] **Step 1: Add required state**

Add:
- `APPLICATION_CREATE` tab key
- application form state
- submit pending/error state

- [ ] **Step 2: Wire API import and submit flow**

Import `createOwnerStoreApplication`.
On submit:
- call API
- reload stores/applications
- reset form
- switch to `APPLICATION`

- [ ] **Step 3: Add sidebar navigation item and page section**

Render:
- new sidebar nav item
- PC form section for `APPLICATION_CREATE`

- [ ] **Step 4: Verify JSX file**

Run: `cd apps/frontend && npx eslint src/pages/PosWeb.jsx`
Expected: pass.

### Task 3: Add PC Form Styling

**Files:**
- Modify: `apps/frontend/src/pages/PosWeb.module.css`

- [ ] **Step 1: Add form layout classes**

Create styles for:
- form shell
- two-column row where appropriate
- file input / helper text / error text

- [ ] **Step 2: Verify build**

Run: `cd apps/frontend && npm run build`
Expected: pass.
