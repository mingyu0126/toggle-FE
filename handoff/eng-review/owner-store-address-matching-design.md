# Eng Review: Multi-Store Owner Registration and Store Linking

## 1. Scope
- 점주 회원가입을 계정 생성과 사업자/매장 등록 신청으로 분리한다.
- 로그인한 점주가 여러 개의 사업자/매장 신청을 만들 수 있게 한다.
- 관리자 승인 후 하나의 점주 계정에 여러 매장을 연결할 수 있게 한다.
- POS는 선택한 연결 매장 기준으로 상태를 갱신하고, 사용자 화면은 서버 상태를 조회한다.

## 2. Problem Framing
- 기존 구조는 점주 회원가입 단계에서 사업자 정보까지 받아서 `계정 생성`과 `매장 권한 신청`이 결합돼 있다.
- 이 방식은 다매장 점주 요구사항과 충돌한다.
- 해결해야 할 핵심은 "점주라는 사람 계정"과 "그 계정이 관리하는 매장 권한"을 분리하는 것이다.

## 3. Design Principles
- 계정과 매장 권한은 다른 lifecycle로 관리한다.
- 한 점주는 여러 신청과 여러 매장을 가질 수 있어야 한다.
- 한 매장은 1차 정책상 하나의 대표 점주에게만 연결한다.
- 잘못된 자동 연결보다 미연결이 낫다.
- POS write 권한은 `role=OWNER`만으로 주지 않고, `owner-store-link` 존재 여부로 판정한다.

## 4. Target State Architecture

### 4.1 Auth
- `users`
  - `USER`, `OWNER`, `ADMIN`
- 점주도 일반 회원가입처럼 계정 생성
- 사업자 관련 정보는 auth 스키마에서 제거

### 4.2 Owner Store Application
- 로그인한 점주가 `owner_store_applications`를 생성
- 각 신청은 하나의 사업자/매장 등록 시도
- 한 점주 계정은 여러 신청 보유 가능

### 4.3 Owner Store Link
- 승인 완료 후 `owner_store_links`에 점주-매장 연결 생성
- 한 점주는 여러 `link`를 가질 수 있음
- 한 매장은 하나의 점주에만 연결

## 5. Data Model

### 5.1 users
- 유지
- 점주 회원가입은 아래 정도만 받음
  - `email`
  - `password`
  - `nickname`
  - `role=OWNER`
  - `status=ACTIVE`

### 5.2 owner_store_applications
- 신규 또는 기존 `owner_applications` 리네이밍 권장
- 컬럼 제안
  - `id`
  - `owner_user_id`
  - `business_name`
  - `business_number`
  - `business_address_raw`
  - `business_address_normalized`
  - `business_license_stored_path`
  - `business_license_original_name`
  - `business_license_content_type`
  - `review_status`
  - `reviewed_at`
  - `reject_reason`
  - `created_at`
  - `updated_at`
- 제약
  - `owner_user_id` unique 제거
  - 필요시 `business_number + owner_user_id` 중복 제한 검토

### 5.3 stores
- 유지
- 추가 또는 유지 필드
  - `address_normalized`
  - `live_business_status`
  - `live_status_updated_at`
  - `live_status_source`

### 5.4 owner_store_links
- 컬럼
  - `id`
  - `owner_user_id`
  - `store_id`
  - `application_id`
  - `match_status`
  - `match_score`
  - `matched_by`
  - `match_reason`
  - `created_at`
  - `updated_at`
- 제약
  - `unique(store_id)`
  - `owner_user_id` unique 제거

### 5.5 store_status_history
- 컬럼
  - `id`
  - `store_id`
  - `owner_user_id`
  - `status`
  - `comment`
  - `changed_at`

## 6. Enum Design

### OwnerStoreApplicationReviewStatus
- `PENDING`
- `APPROVED`
- `REJECTED`

### OwnerStoreMatchStatus
- `PENDING_REVIEW`
- `AUTO_MATCHED`
- `MANUALLY_CONFIRMED`
- `REJECTED`

### LiveStatusSource
- `OWNER_POS`
- `SYSTEM`
- `ADMIN`

## 7. Address Normalization Strategy

### Phase 1 Rules
- trim
- lowercase
- `특별시 -> 시`, `광역시 -> 시`, `특별자치시 -> 시`, `특별자치도 -> 도`
- 특수문자 공백 치환
- 연속 공백 축소
- `층`, `호` 제거

### Why
- 외부 주소 표준화 서비스 없이도 흔한 표기 차이를 흡수할 수 있다.
- 다만 자동 연결은 보수적으로만 허용한다.

## 8. Matching Strategy

### 8.1 Candidate Search
- `stores.address_normalized` 기준으로 prefix/contains 검색
- 필요시 상호명 기반 보조 검색

### 8.2 Score Model
- 주소 exact normalized match: `+70`
- 주소 partial match: `+50`
- 상호명/매장명 유사: `+20`
- 전화번호 일치: `+20`
- 좌표 근접: `+10`

### 8.3 Decision Rule
- `score >= 85`
  - 자동 추천 가능
- `60 <= score < 85`
  - 검토 필요
- `< 60`
  - 미연결

### 8.4 Safety Rule
- 이미 다른 점주와 연결된 매장은 자동/수동 연결 제한
- 후보 점수가 비슷하면 자동 확정 금지

## 9. API Design

### 9.1 Owner Signup
- `POST /api/v1/auth/signup`
- `OWNER`도 일반 계정 생성처럼 처리
```json
{
  "email": "owner@toggle.com",
  "password": "password123!",
  "nickname": "토글 운영자",
  "role": "OWNER"
}
```

### 9.2 Create Store Application
- `POST /api/v1/owner/store-applications`
- multipart
```json
{
  "businessName": "토글가게 대치점",
  "businessNumber": "123-45-67890",
  "businessAddress": "서울특별시 강남구 테헤란로 123 2층"
}
```

### 9.3 List My Store Applications
- `GET /api/v1/owner/store-applications`

### 9.4 List My Linked Stores
- `GET /api/v1/owner/stores`

### 9.5 Match Candidate Query
- `GET /api/v1/admin/owner-store-applications/{applicationId}/match-candidates`

### 9.6 Confirm Match + Approve
- `POST /api/v1/admin/owner-store-applications/{applicationId}/approve`
```json
{
  "storeId": 21
}
```
- approve 시 application review와 owner-store-link 생성까지 같이 처리하는 것이 운영상 단순하다.

### 9.7 Reject Application
- `POST /api/v1/admin/owner-store-applications/{applicationId}/reject`

### 9.8 POS Status Update
- `POST /api/v1/owner/stores/{storeId}/status`
```json
{
  "status": "OPEN",
  "comment": "정상 영업 중입니다."
}
```
- 서버는 로그인 점주가 해당 `storeId`와 연결되어 있는지 검증해야 한다.

## 10. Backend Service Design

### 10.1 AuthService
- 점주 회원가입 시 사업자 검증 상태에 의존하지 않음
- 점주도 활성 계정으로 바로 로그인 가능

### 10.2 OwnerStoreApplicationService
- `createApplication(ownerUserId, request, file)`
- `listMyApplications(ownerUserId)`
- `listAdminApplications()`
- `approve(applicationId, storeId, adminId)`
- `reject(applicationId, reason, adminId)`

### 10.3 OwnerStoreMatchingService
- `findCandidates(applicationId)`
- `score(application, store)`

### 10.4 OwnerStoreLinkService
- `findLinkedStores(ownerUserId)`
- `isLinked(ownerUserId, storeId)`
- `createLink(application, store, adminId)`

### 10.5 StoreLiveStatusService
- `updateOwnerLiveStatus(ownerUserId, storeId, status, comment)`
- link 검증 후 `stores.live_business_status`와 history 갱신

## 11. Read Path Changes

### 11.1 Favorites / Store Detail / Home
- 서버 `live_business_status`를 우선 노출
- 현재 local 상태 fallback은 제거 방향

### 11.2 POS
- `내 매장 목록` 조회 필요
- 현재 선택한 매장 기준으로 상태 변경
- 연결된 매장이 없으면 신청 유도

### 11.3 Owner Dashboard
- `내 신청 현황`
- `내 매장 목록`
- `새 매장 등록 신청`

## 12. Migration Plan

### Step 1
- 점주 회원가입에서 사업자 등록 입력 제거
- 점주 계정을 즉시 생성 가능한 모델로 전환

### Step 2
- `owner_applications`를 `owner_store_applications` 개념으로 재정의
- `owner_user_id` unique 제거

### Step 3
- `owner_store_links.owner_user_id` unique 제거
- `application_id` 참조 추가

### Step 4
- 점주 대시보드용 신청/매장 목록 API 추가

### Step 5
- POS를 단일 점주 매장 모델에서 다매장 선택 모델로 전환

### Step 6
- 사용자-facing read path를 서버 live status 우선으로 정리

## 13. Edge Cases
- 한 사업자 번호로 여러 지점 신청
- 본사 주소와 지점 주소 불일치
- 동일 주소 내 복수 매장
- 이미 연결된 매장에 다른 점주 신청
- 점주는 로그인 가능하지만 연결 매장이 없어 POS 조작 불가

## 14. Risks
- 현재 구현 일부가 `점주 승인 전 로그인 불가` 전제에 맞춰져 있어 리팩터링 범위가 넓다.
- 프론트 POS가 아직 단일 매장 모델에 가깝다.
- 기존 테스트/시드 데이터도 새 lifecycle에 맞게 다시 정리해야 한다.

## 15. Recommendation
- 지금은 계정 생성과 매장 신청을 분리하는 것이 맞다.
- 백엔드는 `owner_store_applications`와 `owner_store_links`를 중심으로 다시 잡고, POS 권한은 링크 기반으로 전환한다.
- 승인 정책은 "점주 계정 승인"이 아니라 "매장 운영 권한 승인"으로 재정의한다.

## 16. Next Build Order
1. PRD/API 문서를 새 lifecycle 기준으로 확정
2. 점주 signup 간소화
3. `owner_store_applications` 모델로 전환
4. `owner_store_links` 다매장 허용으로 변경
5. 점주 대시보드 신청 API 추가
6. 관리자 승인/매칭 API 재정의
7. POS 다매장 선택 + 상태 업데이트 구현
8. 사용자 read path 서버 상태 우선 정리
