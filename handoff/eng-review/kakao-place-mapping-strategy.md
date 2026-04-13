# Kakao Place Mapping Strategy

## 목적
- 카카오 장소 검색 결과를 Toggle 내부 `store` 엔티티와 안정적으로 연결한다.
- 즐겨찾기, 저장 장소, 개인 지도, 점주 상태 관리가 모두 동일한 `store.id`를 기준으로 동작하도록 한다.

## 기본 원칙
- 카카오 API는 장소 검색과 위치 정보의 외부 소스다.
- Toggle DB의 `stores`는 서비스 운영 기준 엔티티다.
- 사용자 기능은 카카오 장소 ID가 아니라 `stores.id`를 기준으로 저장한다.

## 권장 식별 전략

`stores`에 다음 컬럼을 둔다.
- `external_source`
- `external_place_id`

권장 제약조건:
- `unique(external_source, external_place_id)`

예시:
- `external_source = KAKAO`
- `external_place_id = 1234567890`

## 이유
- 같은 카카오 장소를 여러 사용자가 저장해도 하나의 `store`로 묶을 수 있다.
- 점주 소유, 실시간 영업 상태, 상태 로그, 신고를 같은 엔티티에 연결할 수 있다.
- 외부 공급자가 늘어나도 `external_source`만 확장하면 된다.

## 요청 흐름

### 1. 탐색
- 프론트는 카카오 API 또는 카카오 기반 검색 결과를 사용자에게 보여준다.

### 2. 매핑 확인
- 프론트 또는 백엔드는 `external_source + external_place_id`로 기존 `store`를 찾는다.

### 3. 내부 store 확보
- 있으면 기존 `store.id`를 사용한다.
- 없으면 정책에 따라:
  - 자동 생성
  - 제한적 생성
  - 관리자 승인 대기

### 4. 서비스 기능 수행
- 즐겨찾기, 저장 장소, 개인 지도, 상태 조회는 모두 `store.id` 기준으로 처리한다.

## MVP 권장안
- 자동 resolve 허용
- `store`가 없으면 최소 필드로 생성
- 이후 점주 연결, 검수, 상세 정보 보강은 별도 단계에서 수행

## 주의점
- 카카오 장소 정보가 바뀌더라도 내부 `store.id`는 변하지 않아야 한다.
- 동일 장소 중복 생성을 막기 위해 외부 식별자 유니크가 필수다.
- 즐겨찾기 API는 `storeId` 기준으로 고정하고, 외부 ID는 resolve 단계에서만 다룬다.

## 지도 검색 상태 표시 시나리오

### 배경
- 점주 승인까지 끝나 `owner_store_links`와 `stores`에 실제 매장이 연결돼 있어도, 지도 검색 화면은 여전히 카카오 검색 결과와 프론트 mock 데이터를 직접 렌더링하고 있다.
- 이 흐름에서는 `liveBusinessStatus`를 조회하지 못하고, 검색 결과 임시 카드에 `status = "검색결과"` 같은 UI 전용 값이 들어간다.
- 현재 상태 배지는 `OPEN`, `BREAK_TIME`, `CLOSED`, `TEMP_CLOSED`, `EARLY_CLOSED`만 이해하므로, 위 임시 값은 최종적으로 `상태 없음`으로 보인다.

### 해결 목표
- 카카오 검색 결과가 이미 Toggle 내부 `stores`에 매핑된 장소라면, 검색 카드에서도 내부 `store`의 실제 `liveBusinessStatus`를 보여준다.
- 내부 매핑이 없는 검색 결과는 `상태 없음` 대신 등록 전 안내 문구로 분리해 운영/사용자 혼란을 줄인다.
- 검색 자체만으로는 새 `store`를 만들지 않는다. 검색 화면 조회는 read-only여야 한다.

### 구현 시나리오
1. 프론트가 카카오 검색 결과의 `external_source = KAKAO`, `external_place_id` 목록을 백엔드에 조회한다.
2. 백엔드는 `stores`에서 같은 `external_source + external_place_id` 조합을 가진 레코드만 찾아 응답한다.
3. 응답에는 최소한 아래 정보를 포함한다.
   - `storeId`
   - `externalPlaceId`
   - `name`
   - `address`
   - `businessStatus`
   - `liveBusinessStatus`
   - `liveStatusSource`
   - `verified`
4. 프론트는 카카오 결과를 표시하기 전에 lookup 응답과 합친다.
5. 매칭된 장소는 `liveBusinessStatus`를 카드 상태값으로 사용한다.
6. 매칭되지 않은 장소는 별도 UI 상태(`UNREGISTERED`)로 다루고, 배지에는 `상태 정보 없음`으로 보인다.
7. 카드가 localStorage 상태 오버레이를 사용할 때는 카카오 외부 ID가 아니라 내부 `storeId`를 우선 키로 사용한다.

### 금지 시나리오
- 지도 검색 화면이 `resolve`를 호출해 검색만으로 `stores`를 자동 생성하는 방식은 쓰지 않는다.
- 검색 결과 상태를 mock 데이터 이름 매칭으로만 추정하지 않는다.
- `상태 없음`을 실제 영업 상태 부재와 미등록 장소를 동시에 뜻하는 값으로 계속 두지 않는다.

### 검증 시나리오
- 케이스 1: 이미 승인/연결된 `중찬미식`을 카카오 검색하면 `liveBusinessStatus`가 보인다.
- 케이스 2: 승인됐지만 점주가 상태를 바꾼 뒤 재검색해도 최신 `liveBusinessStatus`가 유지된다.
- 케이스 3: 아직 내부 `store`가 없는 카카오 장소는 `상태 정보 없음`으로 보인다.
- 케이스 4: 즐겨찾기/나만의지도/점주 POS 흐름은 기존처럼 `store.id` 기준 동작을 유지한다.

## 카카오 카테고리 매핑 시나리오 (프론트엔드 통합)
### 배경
- 클라이언트상 카테고리 필터('음식점', '카페', '편의점') 적용 시, 이름에 단순히 해당 텍스트를 포함하는 방식으로 검색하면 부정확한 결과가 섞이거나 카카오맵의 풍부한 카테고리 데이터를 온전히 활용할 수 없다.

### 해결 구현
- Toggle 내부 `CATEGORIES` 탭 명칭을 카카오 장소 검색 API의 `category_group_code`와 1:1로 직접 매핑한다.
- `음식점 -> FD6`, `카페 -> CE7`, `편의점 -> CS2`, `대형마트 -> MT1`, `약국 -> PM9`, `공공기관 -> PO3` 등.
- 툴 매핑 정보를 담은 훅(`useKakaoPlacesWithLookup.js`)에서 `kakao.maps.services.Places().keywordSearch` 혹은 `categorySearch` 호출 시 `searchOptions.category_group_code` 파라미터를 강제 점유시켜 API 요청 차원에서 정확도를 보장한다.
