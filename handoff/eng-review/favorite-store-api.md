# Favorite Store API Contract

## Scope
- 회원이 매장을 즐겨찾기 추가/삭제/조회하는 MVP API
- 대상 리소스는 `store`만 포함
- 카카오 장소 검색 결과는 내부적으로 Toggle `store`로 매핑한 뒤 즐겨찾기 대상으로 사용

## Roles
- Guest: 읽기 전용 탐색만 가능, 즐겨찾기 API 호출 불가
- Member: 본인 즐겨찾기만 관리 가능
- Owner: 본인 계정 기준 개인 즐겨찾기만 관리 가능
- Admin: 일반 사용자와 동일하게 본인 즐겨찾기만 관리 가능

## Endpoints

### 0. Resolve External Place To Store

- `POST /api/v1/stores/resolve`

#### Purpose
- 카카오 장소 검색 결과를 Toggle 내부 `store`로 매핑한다.
- 프론트는 카카오 `placeId` 기반 결과를 받았더라도, 즐겨찾기 전에 내부 `storeId`를 확보해야 한다.

#### Auth
- optional

#### Request Body
```json
{
  "externalSource": "KAKAO",
  "externalPlaceId": "1234567890",
  "name": "맛있는 덮밥집",
  "address": "서울시 강남구 테헤란로 123",
  "latitude": 37.498095,
  "longitude": 127.027610,
  "phone": "02-1234-5678"
}
```

#### Success Response
```json
{
  "storeId": 101,
  "externalSource": "KAKAO",
  "externalPlaceId": "1234567890",
  "resolved": true
}
```

#### Errors
- `400 Bad Request`: 필수 외부 식별자 누락
- `409 Conflict`: 동일 외부 식별자에 대해 비정상 충돌 발생

---

### 1. Add Favorite

- `POST /api/v1/favorites/stores/{storeId}`

#### Auth
- required

#### Path Params
- `storeId: string | long`

#### Request Body
- 없음

#### Success Response
```json
{
  "favoriteId": 1,
  "storeId": "store-1",
  "favorited": true,
  "createdAt": "2026-03-28T22:30:00Z"
}
```

#### Errors
- `401 Unauthorized`: 로그인 안 됨
- `404 Not Found`: 매장 없음
- `409 Conflict`: 이미 즐겨찾기됨

---

### 2. Remove Favorite

- `DELETE /api/v1/favorites/stores/{storeId}`

#### Auth
- required

#### Path Params
- `storeId: string | long`

#### Success Response
```json
{
  "storeId": "store-1",
  "favorited": false
}
```

#### Errors
- `401 Unauthorized`: 로그인 안 됨
- `404 Not Found`: 매장 또는 즐겨찾기 관계 없음

---

### 3. List Favorite Stores

- `GET /api/v1/favorites/stores`

#### Auth
- required

#### Query Params
- `page` optional
- `size` optional

#### Success Response
```json
{
  "content": [
    {
      "storeId": "store-1",
      "name": "맛있는 덮밥집",
      "category": "식당",
      "businessStatus": "OPEN",
      "address": "서울시 강남구 테헤란로 123",
      "favoritedAt": "2026-03-28T22:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

#### Errors
- `401 Unauthorized`: 로그인 안 됨

## DTO Notes

### FavoriteStoreResponse
- `favoriteId`
- `storeId`
- `favorited`
- `createdAt`

### FavoriteStoreListItemResponse
- `storeId`
- `name`
- `category`
- `businessStatus`
- `address`
- `favoritedAt`

## Domain Rules
- 즐겨찾기 관계는 사용자 본인 기준으로만 생성/삭제한다.
- 동일 `(user_id, store_id)`는 1건만 허용한다.
- 존재하지 않는 매장에 대한 즐겨찾기 생성은 불가하다.
- 삭제되었거나 비노출 상태 매장은 정책에 따라 목록에서 제외하거나 별도 상태로 내려준다.
- 카카오 장소 결과는 `external_source + external_place_id`로 먼저 `stores`에 매핑되어야 한다.
- 외부 장소 식별자는 `stores`에서 유니크해야 한다.

## Validation Rules
- `storeId`는 유효한 식별자여야 한다.
- 중복 추가는 `409 Conflict`
- 이미 삭제된 관계를 다시 삭제하려는 경우 `404 Not Found`
- `externalSource`, `externalPlaceId`는 resolve 단계에서 필수다.

## Persistence Rules
- 테이블: `favorites`
- 필수 컬럼: `id`, `user_id`, `store_id`, `created_at`
- 제약조건: `unique(user_id, store_id)`
- 권장 인덱스:
  - `unique(user_id, store_id)`
  - `index(store_id)`
- `stores`는 다음 컬럼을 가져야 한다:
  - `external_source`
  - `external_place_id`
- `stores` 제약조건:
  - `unique(external_source, external_place_id)`

## Service Layer Rules
- Controller는 인증 사용자 ID만 전달하고, 실제 권한/중복 검증은 service에서 수행
- Entity 직접 반환 금지
- DTO로 응답 통일

## Frontend Integration Notes
- 카드/상세/저장 목록에서 동일 응답 계약을 사용할 수 있어야 한다.
- 프론트는 optimistic update를 하더라도 `409`, `404`를 명시적으로 처리해야 한다.
- 카카오 검색 결과에서 바로 하트를 누르는 경우:
  1. 먼저 resolve API 또는 동일 역할의 백엔드 로직으로 `storeId` 확보
  2. 이후 favorite API 호출
