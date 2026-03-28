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
