# Map Search Live Status QA

## Scope
- 모바일 지도 검색 화면 `Home.jsx`
- 웹 지도 검색 화면 `HomeWeb.jsx`
- 카카오 검색 결과와 내부 `stores` 매핑 lookup API
- 검색 결과 상태 배지 렌더링

## Root Cause
- 지도 검색 화면은 실제 `stores`를 조회하지 않고 `mockStores`와 카카오 검색 결과 임시 객체를 직접 렌더링하고 있었다.
- 카카오 검색 결과 임시 카드에는 `status = "검색결과"`가 들어갔다.
- 상태 배지는 이 값을 지원하지 않아 검색 카드가 `상태 없음`으로 보였다.
- 따라서 DB에 `owner_store_links`와 `stores`가 이미 연결돼 있어도 검색 결과 카드에는 실제 `liveBusinessStatus`가 반영되지 않았다.

## Fix Summary
- 백엔드에 `POST /api/v1/stores/lookup` read-only API를 추가했다.
- 조회 기준은 `external_source + external_place_id`이며, 검색만으로 `store`를 생성하지 않는다.
- 공개 지도 검색에서도 쓰도록 `lookup` API를 인증 없이 조회 가능하게 열었다.
- 프론트 `Home.jsx`, `HomeWeb.jsx`는 선택된 카카오 결과의 `external_place_id`로 lookup을 호출해 내부 `store`가 있으면 `liveBusinessStatus`를 카드에 주입하도록 수정했다.
- 내부 매칭이 없는 검색 결과는 `상태 없음` 대신 `상태 정보 없음` 배지로 분리했다.
- 카드의 localStorage 상태 오버레이는 가능하면 `internalStoreId`를 우선 사용하도록 보강했다.

## Additional QA Round
- 사용자 요청으로 변경 직후 QA를 다시 강하게 돌렸다.
- 결과적으로 검색 상태 노출 주변에서 총 6건의 추가 문제를 확인했고, 모두 같은 세션에서 수정했다.

### 1. lookup 응답 대기 중 검색 카드가 곧바로 `상태 정보 없음`으로 보이는 문제
- 문제: 실제 내부 매칭이 있는 장소도 lookup 완료 전 한 박자 동안 미등록처럼 보였다.
- 영향: 사용자 입장에서 상태 조회가 실패한 것처럼 오해할 수 있었다.
- 조치: `LOOKUP_PENDING` 상태를 추가해 조회 중에는 `상태 확인 중`으로 분리했다.
- 상태: fixed

### 2. 이름 기반 fallback 매칭이 잘못된 mock 매장을 붙일 수 있는 문제
- 문제: lookup이 아직 없거나 실패하면 `place_name`만으로 기존 mock 카드와 억지로 연결했다.
- 영향: 같은 이름의 다른 매장 상태를 잘못 보여줄 수 있었다.
- 조치: 이름 기반 fallback을 제거하고, 공개 상태는 lookup 결과만 신뢰하도록 바꿨다.
- 상태: fixed

### 3. 공개 lookup API가 미검증 store까지 반환하는 문제
- 문제: 내부 `stores`에 존재하기만 하면 아직 검증되지 않은 매장도 공개 검색에서 조회될 수 있었다.
- 영향: 운영 기준상 노출되면 안 되는 내부 장소 메타데이터가 새어 나갈 수 있었다.
- 조치: lookup 응답은 `isVerified = true`인 store만 반환하도록 제한했다.
- 상태: fixed

### 4. 웹 상세 페이지가 route id를 숫자/문자열 엄격 비교해 항상 첫 mock store로 떨어질 수 있는 문제
- 문제: `StoreWeb.jsx`가 `s.id === id`로 비교하고 있어 실제 route param이 문자열일 때 매칭이 깨졌다.
- 영향: 상세 화면에서 엉뚱한 매장 정보가 뜰 수 있었다.
- 조치: 문자열 기준 비교로 수정했다.
- 상태: fixed

### 5. 검색 카드 클릭 후 상세 페이지가 lookup 결과를 무시하고 mock store를 보여주는 문제
- 문제: 검색 카드에서 상태는 맞아도, 상세 이동 후에는 다시 mock 기반 상세로 떨어졌다.
- 영향: 사용자 입장에서 목록과 상세의 정보가 서로 달라지는 회귀가 생겼다.
- 조치: `PlaceCard`가 `placePreview`를 라우트 state로 넘기고, `StoreDetail.jsx`/`StoreWeb.jsx`가 이를 우선 사용하면서 lookup 결과로 병합하도록 수정했다.
- 상태: fixed

### 6. 모바일/웹 홈 화면의 lookup 로직이 중복되어 수정이 한쪽에만 들어갈 위험
- 문제: `Home.jsx`, `HomeWeb.jsx`가 같은 매핑 로직을 거의 복붙하고 있었다.
- 영향: 한쪽만 고치고 다른 쪽은 놓치는 회귀가 쉽게 생긴다.
- 조치: `useStoreLookupByExternalPlaceId`, `storePreview` 공통 모듈로 리팩터링했다.
- 상태: fixed

## Verification
- 백엔드 `./gradlew test` 통과
- 프론트 `npm run build` 통과
- 추가된 백엔드 테스트
  - `lookupStoresShouldReturnLiveStatusForMatchedExternalPlaceIds`
  - 내부 매칭된 `store`의 `liveBusinessStatus`, `liveStatusSource`가 lookup 응답으로 내려오는지 검증
  - `lookupStoresShouldExcludeUnverifiedStores`
  - 미검증 store가 공개 lookup 응답에 포함되지 않는지 검증

## Expected User-Facing Result
- `중찬미식`처럼 이미 승인/연결된 매장을 카카오 검색하면 검색 카드에서 실제 영업 상태가 보인다.
- 아직 내부 매핑되지 않은 검색 결과는 `상태 정보 없음`으로 보여, 실제 상태 데이터 부재와 미등록 상태를 구분할 수 있다.

## Remaining Manual Check
- 로컬 실행 환경에서 실제 `중찬미식` 카카오 검색 후 검색 카드 배지가 `상태 없음`이 아니라 DB 기준 상태로 보이는지 한 번 더 눈으로 확인한다.
- 이 세션에서는 Playwright 브라우저 세션 open 단계가 완료되지 않아, 자동 브라우저 스냅샷 재검증까지는 마치지 못했다.

## Follow-up UX Extension
- 상세 페이지는 검색/lookup 정보만이 아니라 점주 운영 정보까지 합쳐 보여주도록 확장했다.
- 점주별이 아니라 `storeId` 기준으로 사진/공지/운영시간을 저장하도록 수정했다.
- 모바일 점주 페이지의 신청 현황은 진행 상태 카드 UI로 정리했고, 웹 점주 페이지의 `APPLICATION` 탭도 실제 콘텐츠를 렌더링하도록 보강했다.

## Follow-up Verification
- `apps/frontend` `npm run build` 통과
- `apps/backend` `./gradlew test` 통과

## Owner Hours Follow-up
- 모바일 점주 페이지에서 운영시간 입력칸이 브레이크타임 패널 내부에만 있어 사용자가 쉽게 찾지 못하는 UX 문제를 확인했다.
- `Pos.jsx`에 별도 `매장별 운영시간 관리` 섹션을 추가해 입력칸을 항상 노출하도록 수정했다.
- 상세 페이지 운영시간 노출은 점주 저장 키(`storeId`)와 상세 route 키(`externalPlaceId`)가 어긋날 수 있는 문제를 함께 수정했다.
- 현재 운영시간/사진/공지 저장은 백엔드 영속 저장이 아니라 `localStorage` 기반이므로, 동일 브라우저/동일 기기 범위에서만 유지된다.

## Owner Profile Backend Connection
- 후속 작업으로 점주 운영정보를 실제 백엔드 저장으로 전환했다.
- 점주 대시보드는 `GET /api/v1/owner/stores`에서 내려온 `ownerNotice`, `openTime`, `closeTime`, `breakStart`, `breakEnd`, `imageUrls`를 표시한다.
- 점주가 저장 버튼을 누르면 `PUT /api/v1/owner/stores/{storeId}/profile`로 서버에 저장된다.
- 일반 사용자 상세 페이지는 공개 `POST /api/v1/stores/lookup` 응답에서 같은 운영정보를 받아 표시한다.

## Owner Profile Verification
- `ownerStoreProfileShouldPersistAndBeVisibleInOwnerAndLookupResponses` 테스트를 추가했다.
- 검증 범위
  - 점주 profile 저장 API 성공
  - `GET /api/v1/owner/stores`에서 저장값 반환
  - 공개 `POST /api/v1/stores/lookup`에서 동일 저장값 반환
- `apps/backend` `./gradlew test` 통과
- `apps/frontend` `npm run build` 통과

## fail to fetch Deep QA
- 증상: 점주 화면에서 저장 버튼 클릭 시 브라우저 알림이 `fail to fetch`만 표시됨
- 1차 원인: 새 owner profile 저장 API가 `PUT`인데 백엔드 CORS 허용 메서드에 `PUT`이 빠져 있었음
- 2차 원인: Spring Security 쪽 `http.cors()`가 빠져 있어 preflight가 보안 체인에서 막힐 여지가 있었음
- 3차 원인: 프론트 fetch 실패 메시지가 너무 원시적이라 실제 CORS/백엔드 문제를 구분하기 어려웠음

### 추가로 확인된 문제와 조치
- placeholder 이미지가 실제 점주 사진처럼 서버에 저장될 수 있음
  - 조치: 기본 샘플 이미지는 payload에서 제외
- 최대 10장 제한이 UI 문구에만 있고 실제 로직에는 없음
  - 조치: 업로드/전송 모두 10장으로 제한
- 저장 버튼 중복 클릭 시 동일 profile 요청 중복 전송 가능
  - 조치: 모바일/웹 점주 화면 모두 `isSavingProfile`로 보호

### 회귀 검증
- `ownerStoreProfilePreflightShouldAllowPutFromFrontendOrigin` 테스트 추가
- `apps/backend` `./gradlew test` 통과
- `apps/frontend` `npm run build` 통과

## Desktop Web Navigation Crash Fixes
- 증상 1: 데스크탑 지도(`HomeWeb`)의 카카오 검색 결과 마커(말풍선) 클릭 시 `StoreWeb` 상세 페이지가 무한 렌더링에 빠지면서 화면이 하얗게 뻗는 현상(Maximum update depth exceeded).
- 증상 2: URL로 직접 `StoreWeb` 접근 시 아무 UI 요소(글로벌 헤더 등) 없이 작은 텍스트 1줄만 보이며 사이트 시스템이 정지된 것처럼 연출됨.
- 조치 1: `HomeWeb.jsx`에서 `navigate` 호출 시 `location.state` 객체를 바인딩하여 렌더링에 필수적인 기초 정보를 정상 승계하도록 수정.
- 조치 2: `StoreWeb.jsx`에 존재하는 중앙 지도 동기화 `useEffect`의 의존성을 `[store]` 객체 파라미터에서 `[store?.lat, store?.lng]` 원시형 타겟 파라미터로 격하시켜 재렌더링 트리거를 영구적으로 제거 (무한 루프 방어 완료).
- 조치 3: `StoreWeb`, `PublicWeb` 빈 화면 예외 처리를 공통 Layout/Header가 보장된 전용 `EmptyState` 렌더링 함수로 교체하여 UX 저하 방지 완료.
