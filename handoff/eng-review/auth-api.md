# Auth API Contract

## Scope
- 일반 회원가입, 점주 계정 회원가입, 로그인, 로그아웃, 토큰 재발급, 현재 사용자 조회
- 로그인한 점주의 매장 등록 신청과 연결 매장 조회
- 관리자용 점주 매장 신청 조회, 후보 조회, 승인, 반려

## Roles
- `USER`: 일반 사용자
- `OWNER`: 점주 계정
- `ADMIN`: 관리자

## Auth Model
- `Authorization: Bearer <accessToken>`
- refresh token은 본문 기반 재발급
- 보호 API는 JWT 필수

## 1. Signup
- `POST /api/v1/auth/signup`

### Request
```json
{
  "email": "owner@toggle.com",
  "password": "password123!",
  "nickname": "토글 운영자",
  "role": "OWNER"
}
```

### Notes
- `role`이 없으면 기본값은 `USER`
- `ADMIN` 직접 가입은 불가
- `OWNER`도 가입 직후 `ACTIVE`

## 2. Login
- `POST /api/v1/auth/login`

### Request
```json
{
  "email": "owner@toggle.com",
  "password": "password123!"
}
```

### Response
```json
{
  "accessToken": "token",
  "refreshToken": "token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "owner@toggle.com",
    "nickname": "토글 운영자",
    "role": "OWNER",
    "status": "ACTIVE"
  }
}
```

## 3. Me
- `GET /api/v1/auth/me`

## 4. Refresh
- `POST /api/v1/auth/refresh`

## 5. Logout
- `POST /api/v1/auth/logout`

## 6. Create Owner Store Application
- `POST /api/v1/owner/store-applications`
- auth required: `OWNER`
- multipart/form-data

### Request part `request`
```json
{
  "businessName": "토글가게 대치점",
  "businessNumber": "123-45-67890",
  "businessAddress": "서울특별시 강남구 테헤란로 123 2층"
}
```

### Request part `businessLicenseFile`
- `image/jpeg | image/png | application/pdf`

### Response
```json
{
  "applicationId": 12,
  "ownerUserId": 9,
  "businessName": "토글가게 대치점",
  "reviewStatus": "PENDING",
  "submittedAt": "2026-04-08T15:10:00Z"
}
```

## 7. List My Owner Store Applications
- `GET /api/v1/owner/store-applications`
- auth required: `OWNER`

## 8. List My Linked Stores
- `GET /api/v1/owner/stores`
- auth required: `OWNER`

### Response Example
```json
[
  {
    "linkId": 1,
    "storeId": 21,
    "storeName": "토글가게 대치점",
    "storeAddress": "서울시 강남구 테헤란로 123",
    "liveBusinessStatus": "OPEN"
  }
]
```

## 9. Admin List Owner Store Applications
- `GET /api/v1/admin/owner-store-applications`
- auth required: `ADMIN`

## 10. Admin Match Candidates
- `GET /api/v1/admin/owner-store-applications/{applicationId}/match-candidates`
- auth required: `ADMIN`

## 11. Admin Approve Owner Store Application
- `POST /api/v1/admin/owner-store-applications/{applicationId}/approve`
- auth required: `ADMIN`

### Request
```json
{
  "storeId": 21
}
```

### Response
```json
{
  "applicationId": 12,
  "ownerUserId": 9,
  "reviewStatus": "APPROVED",
  "linkedStoreId": 21,
  "reviewedAt": "2026-04-08T15:30:00Z",
  "rejectReason": null
}
```

## 12. Admin Reject Owner Store Application
- `POST /api/v1/admin/owner-store-applications/{applicationId}/reject`
- auth required: `ADMIN`

### Request
```json
{
  "reason": "서류 식별 불가"
}
```

## Error Model
- `400`: validation error
- `401`: unauthenticated
- `403`: forbidden role
- `404`: resource not found
- `409`: duplicate email or already linked store
