# Backend Owner Registration Duplication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일반 사용자 닉네임 중복을 막고, 관리자 카카오 주소 검증 시 이미 등록된 Kakao place ID 매장을 다른 점주가 다시 등록하지 못하게 만든다.

**Architecture:** `AuthService`에 `USER` 전용 닉네임 중복 검사를 추가하고 `users.nickname`을 DB 유니크 키로 보강한다. `OwnerApplicationService.runMapVerification()`에서는 카카오 후보를 1건으로 확정한 뒤 `ExternalSource.KAKAO + placeId`로 로컬 `stores`를 조회해, 현재 신청건이 아닌 기존 매장이 이미 있으면 즉시 검증 실패 이력으로 남기고 `resolveStore()` 경로로 진입하지 않게 한다.

**Tech Stack:** Spring Boot 3.3, Java 21, Spring Data JPA, MockMvc, H2, Gradle

---

### Task 1: 워크플로우 기록과 TDD용 실패 시나리오 정리

**Files:**
- Modify: `daily-log/2026-04-14.md`
- Test: `apps/backend/src/test/java/com/toggle/ToggleBackendApplicationTests.java`

- [ ] **Step 1: 일일 로그에 로컬 실행 예외와 이번 작업 목표를 기록**

```text
- using-git-worktrees 예외: 기존 워크스페이스가 이미 대규모 변경 중이라 같은 backend 경로 문맥 유지가 우선
- subagent 예외: 현재 세션 정책상 명시적 사용자 요청 없이 위임 불가
- 이번 작업 목표: USER 닉네임 중복 차단, Kakao place ID 중복 매장 등록 차단
```

- [ ] **Step 2: 닉네임 중복 실패 테스트 추가**

```java
@Test
void duplicateUserNicknameShouldBeRejected() throws Exception {
    mockMvc.perform(post("/api/v1/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "alpha@toggle.com",
                  "password": "password123!",
                  "nickname": "dup-user",
                  "role": "USER"
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(post("/api/v1/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "beta@toggle.com",
                  "password": "password123!",
                  "nickname": "dup-user",
                  "role": "USER"
                }
                """))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error.code").value("NICKNAME_ALREADY_EXISTS"));
}
```

- [ ] **Step 3: place ID 중복 등록 실패 테스트 추가**

```java
@Test
void duplicateKakaoPlaceShouldFailDuringMapVerification() throws Exception {
    String firstOwnerToken = signupAndLoginOwner("owner-one@toggle.com");
    String secondOwnerToken = signupAndLoginOwner("owner-two@toggle.com");
    mockAutomaticBusinessVerificationSuccess();
    mockMatchingPlace("1234567890", "경기도 안양시 만안구 만안로 35", "shared-place");

    mockMvc.perform(multipart("/api/v1/owner/store-registration-requests")
            .file(ownerApplicationRequestPart("경기도 안양시 만안구 만안로 35", "하삼동 커피"))
            .file(ownerLicenseFile())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + firstOwnerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.mapVerificationStatus").value("VERIFIED"));

    mockMvc.perform(multipart("/api/v1/owner/store-registration-requests")
            .file(ownerApplicationRequestPart("경기도 안양시 만안구 만안로 35", "하삼동 커피"))
            .file(ownerLicenseFile())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + secondOwnerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.mapVerificationStatus").value("FAILED"));
}
```

- [ ] **Step 4: 실패 테스트만 실행해서 RED 확인**

Run: `cd apps/backend && ./gradlew test --tests com.toggle.ToggleBackendApplicationTests`
Expected: 새 테스트가 `NICKNAME_ALREADY_EXISTS` 미구현 또는 place ID 중복 미차단 때문에 실패

### Task 2: USER 닉네임 유니크니스 구현

**Files:**
- Modify: `apps/backend/src/main/java/com/toggle/entity/User.java`
- Modify: `apps/backend/src/main/java/com/toggle/repository/UserRepository.java`
- Modify: `apps/backend/src/main/java/com/toggle/service/AuthService.java`

- [ ] **Step 1: `User` 엔티티에 닉네임 유니크 제약 추가**

```java
@Column(nullable = false, unique = true)
private String nickname;
```

- [ ] **Step 2: `UserRepository`에 닉네임 조회 메서드 추가**

```java
boolean existsByNickname(String nickname);
```

- [ ] **Step 3: `AuthService.signup()`에 USER 전용 닉네임 중복 검사 추가**

```java
if (role == UserRole.USER && userRepository.existsByNickname(normalizedNickname)) {
    throw new ApiException(HttpStatus.CONFLICT, "NICKNAME_ALREADY_EXISTS", "이미 사용 중인 닉네임입니다.");
}
```

- [ ] **Step 4: RED 테스트 재실행으로 닉네임 테스트 GREEN 확인**

Run: `cd apps/backend && ./gradlew test --tests com.toggle.ToggleBackendApplicationTests.duplicateUserNicknameShouldBeRejected`
Expected: PASS

### Task 3: Kakao place ID 중복 매장 검증 구현

**Files:**
- Modify: `apps/backend/src/main/java/com/toggle/service/OwnerApplicationService.java`
- Modify: `apps/backend/src/main/java/com/toggle/repository/StoreRepository.java` if helper needed
- Test: `apps/backend/src/test/java/com/toggle/ToggleBackendApplicationTests.java`

- [ ] **Step 1: `runMapVerification()`에서 `bestCandidate` 확정 직후 기존 매장 조회 분기 추가**

```java
Optional<Store> existingStore = storeRepository.findByExternalSourceAndExternalPlaceId(
    ExternalSource.KAKAO,
    bestCandidate.externalPlaceId()
);
```

- [ ] **Step 2: 현재 신청건이 아닌 기존 매장이 있으면 즉시 검증 실패 처리**

```java
if (existingStore.isPresent() && !isSameVerifiedStore(application, existingStore.get())) {
    application.markMapVerificationFailed();
    mapVerificationHistoryRepository.save(new MapVerificationHistory(
        application,
        bestCandidate.queryText(),
        bestCandidate.queryType(),
        VerificationRecordStatus.FAILED,
        narrowedCandidates.size(),
        bestCandidate.externalPlaceId(),
        bestCandidate.storeName(),
        bestCandidate.roadAddress(),
        bestCandidate.jibunAddress(),
        bestCandidate.phone(),
        bestCandidate.categoryName(),
        bestCandidate.latitude() == null ? null : bestCandidate.latitude().toPlainString(),
        bestCandidate.longitude() == null ? null : bestCandidate.longitude().toPlainString(),
        safeJson(narrowedCandidates),
        existingStore.get(),
        "KAKAO_PLACE_ALREADY_REGISTERED",
        "이미 다른 점주가 등록한 매장입니다.",
        LocalDateTime.now()
    ));
    return;
}
```

- [ ] **Step 3: 동일 신청건 재검증 허용 헬퍼 추가**

```java
private boolean isSameVerifiedStore(OwnerApplication application, Store store) {
    return application.getVerifiedStore() != null
        && application.getVerifiedStore().getId().equals(store.getId());
}
```

- [ ] **Step 4: 기존 매장이 없거나 같은 신청건이면 기존 `resolveStore()` 경로 유지**

```java
Store verifiedStore = existingStore
    .filter(store -> isSameVerifiedStore(application, store))
    .orElseGet(() -> storeService.getStore(
        storeService.resolveStore(new ResolveStoreRequest(...)).storeId()
    ));
```

- [ ] **Step 5: place ID 중복 테스트 재실행으로 GREEN 확인**

Run: `cd apps/backend && ./gradlew test --tests com.toggle.ToggleBackendApplicationTests.duplicateKakaoPlaceShouldFailDuringMapVerification`
Expected: PASS

### Task 4: 통합 검증

**Files:**
- Modify: `daily-log/2026-04-14.md`

- [ ] **Step 1: 변경 파일과 검증 명령을 일일 로그에 추가**

```text
- changed: AuthService, User, UserRepository, OwnerApplicationService, ToggleBackendApplicationTests
- verified: targeted ToggleBackendApplicationTests, full backend test suite
```

- [ ] **Step 2: 전체 백엔드 테스트 실행**

Run: `cd apps/backend && ./gradlew test`
Expected: PASS

- [ ] **Step 3: 결과 요약**

```text
- USER 닉네임 중복은 409/NICKNAME_ALREADY_EXISTS
- 동일 Kakao place ID의 두 번째 점주 신청은 mapVerification FAILED
- 기존 모호성/주소 불일치 검증은 유지
```
