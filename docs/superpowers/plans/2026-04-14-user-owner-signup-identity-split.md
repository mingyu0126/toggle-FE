# User Owner Signup Identity Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일반 사용자의 공개 닉네임과 점주 회원가입의 표시명을 분리해, `USER`만 닉네임 유니크 제약을 적용할 수 있는 구조로 바꾼다.

**Architecture:** `SignupRequest`를 role-aware 계약으로 바꾸고, `User`에는 `nickname`과 `ownerDisplayName`을 분리 저장한다. 인증/세션 응답에는 화면용 `displayName`을 추가해 기존 owner UI가 깨지지 않게 유지하고, 공개 지도 영역은 계속 `nickname`을 사용한다.

**Tech Stack:** Spring Boot 3.3, Java 21, React 19, Vite 7, MockMvc, Gradle

---

### Task 1: 실패 테스트 추가

**Files:**
- Modify: `apps/backend/src/test/java/com/toggle/ToggleBackendApplicationTests.java`

- [ ] `USER` 닉네임 중복 시 409 테스트 추가
- [ ] `OWNER` 동일 표시명 중복 허용 테스트 추가
- [ ] owner 로그인 응답이 표시명으로 동작하는지 확인하는 테스트 추가
- [ ] 타깃 테스트 실행으로 RED 확인

### Task 2: 백엔드 계약/엔티티 분리

**Files:**
- Modify: `apps/backend/src/main/java/com/toggle/dto/auth/SignupRequest.java`
- Modify: `apps/backend/src/main/java/com/toggle/dto/auth/SignupResponse.java`
- Modify: `apps/backend/src/main/java/com/toggle/dto/auth/AuthUserResponse.java`
- Modify: `apps/backend/src/main/java/com/toggle/dto/auth/MeResponse.java`
- Modify: `apps/backend/src/main/java/com/toggle/entity/User.java`
- Modify: `apps/backend/src/main/java/com/toggle/repository/UserRepository.java`
- Modify: `apps/backend/src/main/java/com/toggle/service/AuthService.java`

- [ ] `nickname`/`ownerDisplayName` 분리
- [ ] `USER` 전용 닉네임 검증 및 유니크 체크
- [ ] `displayName` 응답 필드 추가

### Task 3: 프론트 회원가입/세션 소비처 정리

**Files:**
- Modify: `apps/frontend/src/pages/Signup.jsx`
- Modify: `apps/frontend/src/pages/SignupWeb.jsx`
- Modify: `apps/frontend/src/lib/session.js`
- Modify: `apps/frontend/src/pages/Pos.jsx`
- Modify: `apps/frontend/src/pages/PosWeb.jsx`

- [ ] 회원가입 탭별 payload 분기
- [ ] 세션에 `displayName` 보존
- [ ] owner 화면에서 `nickname` 대신 `displayName` 사용

### Task 4: 검증

**Files:**
- Modify: `daily-log/2026-04-14.md`

- [ ] `apps/backend && ./gradlew test`
- [ ] `apps/frontend && npm run build`
- [ ] 변경 경로 대상 lint 또는 최소 빌드 검증
