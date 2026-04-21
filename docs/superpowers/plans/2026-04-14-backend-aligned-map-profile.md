# Backend-Aligned Map Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove remaining frontend mock/shared-map profile dependencies and make `MyMap` / `SharedMap` fully driven by backend contracts.

**Architecture:** Extend the authenticated user contract with a persisted map-profile object, add public map lookup and map-profile update APIs on the backend, then migrate `MyMap`, `MyMapWeb`, and `SharedMap` to use those APIs instead of hardcoded users or local-only map metadata. Favorites remain the canonical saved-place source.

**Tech Stack:** Spring Boot 3.3, Java 21, Spring Security, JPA, React 19, Vite 7, CSS Modules

---

### Task 1: Backend contract tests

**Files:**
- Modify: `apps/backend/src/test/java/com/toggle/ToggleBackendApplicationTests.java`

- [ ] Add failing integration tests for:
  - authenticated user `GET /api/v1/auth/me` returning a `mapProfile`
  - `PUT /api/v1/users/me/map-profile` persisting map profile updates
  - public `GET /api/v1/users/public-maps/{publicMapId}` returning only public users and their favorite ids

- [ ] Run: `cd apps/backend && ./gradlew test --tests com.toggle.ToggleBackendApplicationTests`

- [ ] Confirm the new assertions fail for missing fields/endpoints before implementation.

### Task 2: Backend implementation

**Files:**
- Modify: `apps/backend/src/main/java/com/toggle/entity/User.java`
- Modify: `apps/backend/src/main/java/com/toggle/dto/auth/MeResponse.java`
- Modify: `apps/backend/src/main/java/com/toggle/service/AuthService.java`
- Modify: `apps/backend/src/main/java/com/toggle/controller/AuthController.java`
- Modify: `apps/backend/src/main/java/com/toggle/global/security/SecurityConfig.java`
- Create: `apps/backend/src/main/java/com/toggle/dto/user/UpdateMyMapProfileRequest.java`
- Create: `apps/backend/src/main/java/com/toggle/dto/user/UserPublicMapResponse.java`
- Create: `apps/backend/src/main/java/com/toggle/controller/UserController.java`

- [ ] Add persisted user map-profile fields and domain mutator methods.
- [ ] Extend `MeResponse` to include map-profile metadata and a stable `publicMapId`.
- [ ] Implement authenticated map-profile update endpoint.
- [ ] Implement public map lookup endpoint backed by user favorites.
- [ ] Re-run backend tests until green.

### Task 3: Frontend API/session migration

**Files:**
- Modify: `apps/frontend/src/lib/auth.js`
- Modify: `apps/frontend/src/lib/session.js`
- Create: `apps/frontend/src/lib/users.js`

- [ ] Add frontend helpers for public-map lookup and map-profile update.
- [ ] Normalize `auth/me` map-profile data into session state.
- [ ] Keep favorites as the master saved-place source and stop relying on local-only `myMap` ownership metadata.

### Task 4: MyMap and SharedMap UI migration

**Files:**
- Modify: `apps/frontend/src/pages/MyMap.jsx`
- Modify: `apps/frontend/src/pages/MyMapWeb.jsx`
- Modify: `apps/frontend/src/pages/SharedMap.jsx`

- [ ] Remove hardcoded searched-user branches and switch to backend public-map lookup.
- [ ] Use backend map-profile data for title, description, profile image, visibility, and share URL.
- [ ] Make shared-map search/load states and empty states consistent with backend responses.

### Task 5: Verification and docs

**Files:**
- Modify: `daily-log/2026-04-14.md`

- [ ] Run: `cd apps/backend && ./gradlew test`
- [ ] Run: `cd apps/frontend && npm run lint`
- [ ] Run: `cd apps/frontend && npm run build`
- [ ] Update `daily-log/2026-04-14.md` with the routing trail, implementation summary, and verification evidence.
