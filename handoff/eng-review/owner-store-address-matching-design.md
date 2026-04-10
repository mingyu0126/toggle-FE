# Eng Review: Owner Store Registration, Verification, And Approval

## 1. Requirement Interpretation
- 매장 등록은 `신청`과 `승인 완료`를 분리해야 한다.
- 관리자 최종 승인은 아래 두 조건을 모두 만족해야 한다.
  - 사업자 검증 완료
  - 카카오맵 검증 완료
- 사업자 검증은 지역과 무관하게 국세청 API 자동 검증을 기본으로 한다.
- 수동 검증은 자동 검증 실패나 외부 장애를 보정하는 예외 처리 수단이다.
- 카카오맵 검증은 검색 결과를 찾는 것만으로 끝나지 않는다.
  - 최적 후보를 확정
  - `stores` 저장 완료
  - 필요한 외부 원본 데이터 저장
  - 여기까지 가야 검증 완료다.

## 2. Approval Flow

### Step 1. Owner 신청 생성
- OWNER가 신청서를 제출한다.
- `store_registration_requests`를 생성한다.
- 초기 상태
  - request status: `PENDING`
  - business verification status: `NOT_STARTED`
  - map verification status: `NOT_STARTED`

### Step 2. 사업자 자동 검증
- 주소 지역과 무관하게 `AUTO_VERIFICATION_PENDING`
- 국세청 API 호출
- 일치하면 `AUTO_VERIFIED`
- 불일치 또는 정상 실패면 `AUTO_VERIFICATION_FAILED`
- 외부 장애/미설정/타임아웃이면 `AUTO_VERIFICATION_UNAVAILABLE`
- 필요 시 관리자 수동 검증으로 보정한다.

### Step 3. 카카오맵 검증
- 점주가 입력한 실영업주소를 그대로 조회 기준으로 사용한다.
- `매장명 + 실영업주소`로 1차 검색
- `실영업주소` 단독으로 2차 검색
- exact address match가 없으면 `FAILED`
- exact address match가 2건 이상이면 자동 확정하지 않고 `FAILED`
- exact address match가 정확히 1건일 때만 `stores`에 upsert
- 성공 시 `VERIFIED`

### Step 4. 관리자 검토
- 관리자는 신청 상세에서 아래를 확인한다.
  - 신청 원문
  - 사업자 검증 결과
  - 카카오맵 검증 결과
  - 저장된 store 요약
  - 검증 이력
- 관리자는 수동 사업자 검증이 필요한 건을 검증 처리한다.

### Step 5. 관리자 최종 승인
- 승인 전 검증 조건
  - business verification status in (`AUTO_VERIFIED`, `MANUAL_VERIFIED`)
  - map verification status = `VERIFIED`
- 조건 충족 시에만 `APPROVED`
- 승인 시 `owner_store_links` 생성 또는 최종 활성화
- 반려 시 `REJECTED`

## 2.1 Scenario Matrix

### Scenario A. 자동 검증 성공 + 지도 검증 성공
- 입력
  - 사업자등록번호 / 대표자명 / 개업일자 정상
- 흐름
  - `NOT_STARTED -> AUTO_VERIFICATION_PENDING -> AUTO_VERIFIED`
  - `NOT_STARTED -> SEARCH_PENDING -> VERIFIED`
  - 승인 API 호출 가능
- 기대 결과
  - request status: `APPROVED`
  - `verified_store_id` 설정
  - `owner_store_links` 생성

### Scenario B. 자동 검증 실패
- 입력
  - 국세청 응답 불일치
- 흐름
  - `NOT_STARTED -> AUTO_VERIFICATION_PENDING -> AUTO_VERIFICATION_FAILED`
  - map verification은 수행될 수 있지만 승인 조건 미달
- 기대 결과
  - request status: `UNDER_REVIEW`
  - 승인 API는 `409` 또는 `400`으로 차단

### Scenario C. 자동 검증 불가 + 수동 검증 성공 + 지도 검증 성공
- 입력
  - 국세청 장애 또는 설정 누락
- 흐름
  - `NOT_STARTED -> AUTO_VERIFICATION_PENDING -> AUTO_VERIFICATION_UNAVAILABLE -> MANUAL_VERIFIED`
  - `NOT_STARTED -> SEARCH_PENDING -> VERIFIED`
  - 승인 API 호출 가능
- 기대 결과
  - request status: `APPROVED`

### Scenario D. 지도 검증 실패
- 입력
  - 사업자 검증 성공 또는 수동 검증 완료
  - 카카오 검색 결과 없음 또는 저장 실패
- 흐름
  - `NOT_STARTED -> SEARCH_PENDING -> FAILED`
- 기대 결과
  - 승인 불가
  - request status: `UNDER_REVIEW`

### Scenario E. 승인 전 수정
- 입력
  - OWNER가 `PENDING`, `UNDER_REVIEW` 신청 수정
- 흐름
  - 최신 business verification status 초기화
  - 최신 map verification status 초기화
  - 기존 history는 보존
- 기대 결과
  - 재검증 필수

### Scenario F. 관리자 반려
- 입력
  - 관리자가 부적합 판단
- 흐름
  - request status -> `REJECTED`
  - reject reason 저장
  - admin review log 저장
- 기대 결과
  - OWNER는 반려 사유 확인 가능

## 3. State Design

### 3.1 StoreRegistrationRequestStatus
- `PENDING`
  - 신청 직후
- `UNDER_REVIEW`
  - 검증이 진행 중이거나 관리자 검토 중
- `APPROVED`
  - 최종 승인 완료
- `REJECTED`
  - 최종 반려

### 3.2 BusinessVerificationStatus
- `NOT_STARTED`
- `AUTO_VERIFICATION_PENDING`
- `AUTO_VERIFIED`
- `AUTO_VERIFICATION_UNAVAILABLE`
- `AUTO_VERIFICATION_FAILED`
- `MANUAL_VERIFIED`
- `MANUAL_VERIFICATION_FAILED`

### 3.3 MapVerificationStatus
- `NOT_STARTED`
- `SEARCH_PENDING`
- `VERIFIED`
- `FAILED`

### 3.4 Recommendation
- 등록 요청 상태와 검증 상태를 분리하는 현재 방향이 맞다.
- 승인 가능 여부는 단일 boolean 필드보다 상태 조합으로 계산하는 것이 낫다.
- 예시
  - `canApprove = businessVerified && mapVerified && requestStatus != REJECTED`

## 4. Entity / ERD Draft

### 4.1 users
- 기존 유지
- `id`
- `email`
- `password`
- `nickname`
- `role`
- `status`

### 4.2 store_registration_requests
- 점주의 매장 등록 신청 본체
- 필드
  - `id`
  - `owner_user_id`
  - `store_name`
  - `business_registration_number`
  - `representative_name`
  - `business_open_date`
  - `address_raw`
  - `address_normalized`
  - `is_seoul_address`
  - `request_status`
  - `business_verification_status`
  - `map_verification_status`
  - `business_license_stored_path`
  - `business_license_original_name`
  - `business_license_content_type`
  - `verified_store_id` nullable
  - `final_reviewed_by_admin_id` nullable
  - `final_reviewed_at` nullable
  - `reject_reason` nullable
  - `created_at`
  - `updated_at`
- 책임
  - 최종 신청 상태와 현재 검증 상태를 들고 있는 aggregate root

### 4.3 business_verification_histories
- 사업자 검증 이력 테이블
- 필드
  - `id`
  - `request_id`
  - `verification_type` (`AUTO_NTS`, `MANUAL_ADMIN`)
  - `status`
  - `request_payload_json`
  - `response_payload_json`
  - `matched_business_number`
  - `matched_representative_name`
  - `matched_open_date`
  - `matched_address`
  - `failure_code`
  - `failure_message`
  - `verified_by_admin_id` nullable
  - `verified_at`
  - `created_at`
- 책임
  - 자동/수동 검증 이력과 감사 로그

### 4.4 map_verification_histories
- 카카오맵 검증 이력 테이블
- 필드
  - `id`
  - `request_id`
  - `query_text`
  - `query_type` (`NAME_AND_ADDRESS`, `ADDRESS_ONLY`)
  - `status`
  - `candidate_count`
  - `selected_external_place_id` nullable
  - `selected_place_name` nullable
  - `selected_road_address` nullable
  - `selected_jibun_address` nullable
  - `selected_phone` nullable
  - `selected_category_name` nullable
  - `selected_latitude` nullable
  - `selected_longitude` nullable
  - `response_payload_json`
  - `linked_store_id` nullable
  - `failure_code`
  - `failure_message`
  - `verified_at`
  - `created_at`
- 책임
  - 카카오 검색/선택/저장 결과 추적

### 4.5 stores
- 실제 검증된 장소 데이터 저장소
- 필드
  - `id`
  - `external_source`
  - `external_place_id`
  - `name`
  - `road_address`
  - `jibun_address`
  - `address_normalized`
  - `latitude`
  - `longitude`
  - `phone`
  - `category_name`
  - `verified_at`
  - `raw_source_payload_json`
  - `live_business_status`
  - `live_status_source`
  - `created_at`
  - `updated_at`

### 4.6 owner_store_links
- 승인된 점주와 store의 최종 연결
- 필드
  - `id`
  - `owner_user_id`
  - `store_id`
  - `request_id`
  - `link_status` (`ACTIVE`, `REVOKED`)
  - `approved_by_admin_id`
  - `approved_at`
  - `created_at`
  - `updated_at`

### 4.7 admin_review_logs
- 관리자 액션 로그
- 필드
  - `id`
  - `request_id`
  - `admin_user_id`
  - `action_type` (`MARK_MANUAL_VERIFIED`, `MARK_MANUAL_FAILED`, `APPROVE`, `REJECT`)
  - `reason`
  - `metadata_json`
  - `created_at`

## 5. API Draft

### 5.1 OWNER 매장 등록 신청
- `POST /api/v1/owner/store-registration-requests`
- 권한: `OWNER`
- 요청
```json
{
  "storeName": "토글 대치점",
  "businessRegistrationNumber": "1234567890",
  "representativeName": "홍길동",
  "businessOpenDate": "2021-03-15",
  "address": "서울특별시 강남구 테헤란로 123",
  "businessLicenseFileId": "temp-file-id"
}
```
- 응답
```json
{
  "requestId": 101,
  "requestStatus": "PENDING",
  "businessVerificationStatus": "NOT_STARTED",
  "mapVerificationStatus": "NOT_STARTED"
}
```

### 5.2 OWNER 신청 목록 조회
- `GET /api/v1/owner/store-registration-requests`
- 권한: `OWNER`

### 5.3 OWNER 신청 수정
- `PATCH /api/v1/owner/store-registration-requests/{requestId}`
- 권한: `OWNER`
- 제약
  - `APPROVED`, `REJECTED` 이후 수정 불가
  - 검증 이력이 있으면 재검증 상태 초기화 필요

### 5.4 ADMIN 신청 목록 조회
- `GET /api/v1/admin/store-registration-requests`
- 권한: `ADMIN`
- 필터
  - `requestStatus`
  - `businessVerificationStatus`
  - `mapVerificationStatus`

### 5.5 ADMIN 신청 상세 조회
- `GET /api/v1/admin/store-registration-requests/{requestId}`
- 권한: `ADMIN`
- 응답 포함
  - 신청 원문
  - 사업자 검증 최신 결과
  - 카카오맵 검증 최신 결과
  - 관리자 액션 로그

### 5.6 시스템/관리자 사업자 검증 실행
- `POST /api/v1/admin/store-registration-requests/{requestId}/business-verifications/execute`
- 권한: `ADMIN`
- 동작
  - 전국 주소에 대해 국세청 자동 검증 재실행

### 5.7 ADMIN 수동 사업자 검증 처리
- `POST /api/v1/admin/store-registration-requests/{requestId}/business-verifications/manual`
- 권한: `ADMIN`
- 요청
```json
{
  "verified": true,
  "reason": "사업자등록정보 직접 확인 완료"
}
```

### 5.8 카카오맵 검증 실행
- `POST /api/v1/admin/store-registration-requests/{requestId}/map-verifications/execute`
- 권한: `ADMIN`
- 요청
```json
{
  "forceRefresh": true
}
```

### 5.9 관리자 최종 승인
- `POST /api/v1/admin/store-registration-requests/{requestId}/approve`
- 권한: `ADMIN`
- 요청
```json
{
  "reason": "사업자 검증 및 위치 검증 완료"
}
```
- 성공 조건
  - business verification status in (`AUTO_VERIFIED`, `MANUAL_VERIFIED`)
  - map verification status = `VERIFIED`

### 5.10 관리자 반려
- `POST /api/v1/admin/store-registration-requests/{requestId}/reject`
- 권한: `ADMIN`
- 요청
```json
{
  "reason": "사업자 정보 불일치"
}
```

## 6. Service / Class Structure

### 6.1 StoreRegistrationService
- 신청 생성
- 신청 수정
- OWNER 본인 신청 조회
- 신청 수정 시 검증 상태 초기화 orchestration

### 6.2 BusinessVerificationService
- 전국 자동 검증 실행
- 자동 검증 불가 여부 판단
- 사업자 검증 상태 업데이트
- 수동 검증 가능 여부 판단

### 6.3 NationalTaxServiceClient
- 국세청 API HTTP 호출
- 요청 DTO/응답 DTO 매핑
- 타임아웃/실패/응답 코드 처리
- 공공데이터포털 `국세청_사업자등록정보 진위확인 및 상태조회 서비스`를 기준 구현 대상으로 삼는다.

### 6.4 KakaoMapVerificationService
- 카카오 검색 전략 실행
- 후보 스코어링
- 최적 후보 선정
- `stores` 저장
- map verification history 저장

### 6.5 StoreResolutionService
- 카카오 결과를 `stores`에 upsert
- 외부 place id 기반 중복 제거

### 6.6 AdminStoreApprovalService
- 최종 승인 가능 여부 검증
- 승인 시 `owner_store_links` 생성
- 반려 처리
- 관리자 액션 로그 생성

### 6.7 AdminVerificationService
- 수동 사업자 검증 처리
- 검증 로그 기록

## 7. External API Integration

### 7.1 국세청 API
- 사용 API
  - 공공데이터포털 `국세청_사업자등록정보 진위확인 및 상태조회 서비스`
- 호출 대상
  - 전국 주소
- 입력 파라미터
  - 사업자등록번호
  - 대표자명
  - 개업일자
  - 주소
- 성공 기준
  - 국세청 응답과 신청 정보가 내부 비교 규칙상 일치
- 실패 기준
  - 불일치
  - API business failure
  - malformed response
- 운영 전략
  - timeout 짧게 설정
  - 1회 짧은 재시도만 허용
  - 결과/응답 요약은 history에 저장
  - raw 민감정보 로그는 마스킹

### 7.2 카카오맵 API
- 검색 전략
  - `매장명 + 실영업주소`
  - 결과가 약하면 `실영업주소`
- 성공 기준
  - 정규화한 실영업주소 exact match
  - exact match가 정확히 1건으로 확정
  - `stores` 저장 성공
- 보조 기준
  - 같은 exact address 결과가 여러 건이면 전화번호 일치 여부로만 단일 결과 확정을 시도
- 저장 정책
  - 확정된 exact match 1건만 `stores`에 upsert
  - 외부 식별자와 raw payload 일부 저장
- 실패 기준
  - exact address 결과 없음
  - exact address 결과 다수
  - 저장 실패

## 8. Exception Strategy

### 잘못된 주소 입력
- 신청 생성 시 기본 주소 형식 검증
- 지도 검증 실패 시 `FAILED`
- OWNER 수정 후 재검증 유도

### 국세청 성공, 카카오 실패
- 승인 불가
- request status는 `UNDER_REVIEW`
- map verification status는 `FAILED`

### 카카오 성공, 사업자 불일치
- 승인 불가
- business verification status는 failed 유지

### 동일 매장 중복 등록
- `stores.external_source + external_place_id` unique
- `APPROVED/UNDER_REVIEW` 상태의 동일 사업자번호+주소 조합 중복 제한 검토

### 승인 전 수정
- `PENDING`, `UNDER_REVIEW`까지만 허용
- 수정 시 기존 검증 이력은 남기되 최신 상태는 재검증 필요로 전환

### 승인 후 정합성 문제
- 관리자 revoke 기능 별도 고려
- `owner_store_links.link_status`로 soft revoke 가능하게 설계

### 외부 API 장애
- business/map verification history에 장애 코드 기록
- request status는 `UNDER_REVIEW`
- 서울 자동 검증은 사업자 불일치와 외부 장애를 구분해야 한다.
- 국세청 키 누락/타임아웃/5xx는 `AUTO_VERIFICATION_UNAVAILABLE`로 저장하고 관리자 재실행 대상으로 남긴다.
- 운영자 재실행 API 제공

## 9. Recommended Implementation Order
1. enum / entity / repository 정리
2. 신청 생성 API
3. 서울 판별 + 사업자 검증 상태 모델링
4. 국세청 client + auto verification history 저장
5. 카카오 client + store resolution + map verification history 저장
6. 관리자 수동 사업자 검증 API
7. 관리자 승인/반려 API
8. 관리자 상세 조회 API
9. OWNER 수정 시 재검증 흐름
10. QA, 시드, 운영 로그 보강

## 10. Package Structure Example
```text
com.toggle
  controller
    OwnerStoreRegistrationController
    AdminStoreRegistrationController
  dto
    storeapproval
      CreateStoreRegistrationRequest.java
      UpdateStoreRegistrationRequest.java
      StoreRegistrationResponse.java
      AdminApproveStoreRequest.java
      AdminRejectStoreRequest.java
      ManualBusinessVerificationRequest.java
      ExecuteMapVerificationRequest.java
  entity
    StoreRegistrationRequest.java
    BusinessVerificationHistory.java
    MapVerificationHistory.java
    AdminReviewLog.java
    Store.java
    OwnerStoreLink.java
  repository
    StoreRegistrationRequestRepository.java
    BusinessVerificationHistoryRepository.java
    MapVerificationHistoryRepository.java
    AdminReviewLogRepository.java
  service
    StoreRegistrationService.java
    BusinessVerificationService.java
    AdminVerificationService.java
    KakaoMapVerificationService.java
    StoreResolutionService.java
    AdminStoreApprovalService.java
  client
    NationalTaxServiceClient.java
    KakaoLocalClient.java
```

## 11. Why This Design
- 신청 본체와 검증 이력을 분리해야 운영 추적이 된다.
- 검증 상태를 세분화해야 자동 검증 성공/실패/불가와 수동 보정을 자연스럽게 표현할 수 있다.
- 카카오 결과를 `stores`에 저장한 뒤 승인하는 구조여야 "검증 성공 = DB 저장 완료" 규칙을 만족한다.
- 승인 API에서 상태 조합을 엄격히 검사해야 요구사항을 깨지 않는다.

## 12. Additional Policy Decisions
- 카카오 검증은 후보 선택 UI를 두지 않는다. 실영업주소 exact match 결과가 정확히 1건일 때만 성공이다.
- 도로명주소와 지번주소를 모두 정규화해서 비교하되, 둘 중 하나라도 점주 입력 실영업주소와 정확히 일치해야 한다.
- exact address가 2건 이상이면 전화번호가 일부 일치하더라도 자동 확정하지 않고 `FAILED`로 남긴다.
- 점수 기반 후보 API는 정책과 어긋나므로 더 이상 노출하지 않는다.
- 승인 요청은 검증 결과를 받는 API가 아니라, 관리자의 최종 확인을 기록하는 API로 본다. request field도 `adminConfirmed` 의미로 유지한다.
- 전국 자동 검증 정책으로 통일됐으므로 `seoulAddress` 같은 지역 분기용 도메인 필드는 제거한다.
- 개발 시드도 최신 운영 흐름과 같은 상태(`UNDER_REVIEW`, `AUTO_VERIFICATION_UNAVAILABLE`, `FAILED`)로 보여야 한다.
