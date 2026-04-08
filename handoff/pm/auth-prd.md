# PRD: Login, Signup, And Owner Store Onboarding

## 1. Overview
- Toggle 사용자가 이메일/비밀번호로 회원가입하고 로그인할 수 있어야 한다.
- `USER`와 `OWNER`는 같은 auth 진입점을 쓰되, 점주는 로그인 후 별도로 매장 운영 권한을 신청해야 한다.
- `OWNER`는 계정 생성과 매장 등록 신청을 분리해, 한 점주 계정이 여러 매장을 가질 수 있는 구조를 지원해야 한다.

## 2. Goal
- 일반 사용자는 회원가입 후 바로 로그인할 수 있어야 한다.
- 점주도 계정 생성 후 바로 로그인할 수 있어야 한다.
- 점주는 로그인 후 점주 페이지에서 사업자 등록번호, 사업자 등록 주소, 사업자 등록증 파일을 제출해 매장 운영 권한을 신청할 수 있어야 한다.
- 관리자 승인 후 점주 계정과 실제 매장이 연결되어야 한다.
- 연결된 매장만 POS 상태를 변경할 수 있어야 한다.

## 3. Non-Goals
- 소셜 로그인
- 이메일 인증
- OCR 기반 사업자 등록증 자동 판독
- 관리자 백오피스 고도화

## 4. Roles
- Guest: 공개 탐색만 가능
- Member (`USER`): 개인화 기능 사용 가능
- Owner (`OWNER`): 점주 계정으로 로그인 가능, 로그인 후 매장 등록 신청 가능
- Admin (`ADMIN`): 점주 매장 신청 검토 및 승인/반려 가능

## 5. Core User Scenarios

### Scenario 1
- 일반 사용자가 이메일, 닉네임, 비밀번호로 회원가입하고 로그인한다.

### Scenario 2
- 점주가 `OWNER` 계정으로 회원가입하고 바로 로그인한다.
- 로그인 직후 POS나 점주 화면에서 아직 연결된 매장이 없으면 매장 등록 신청을 유도받는다.

### Scenario 3
- 점주가 로그인 후 사업자 등록번호, 사업자 등록 주소, 사업자 등록증 파일을 제출해 매장 등록 신청을 만든다.

### Scenario 4
- 관리자가 신청을 검토하고 지도 매장과 연결해 승인한다.

### Scenario 5
- 승인된 매장은 점주의 `내 매장 목록`에 나타나고, POS 상태 변경 대상이 된다.

## 6. Functional Requirements
1. `USER`와 `OWNER`는 같은 회원가입 API를 사용하되 `role`로 구분할 수 있어야 한다.
2. `OWNER` 계정은 회원가입 직후 로그인 가능해야 한다.
3. 로그인한 `OWNER`는 여러 개의 매장 등록 신청을 만들 수 있어야 한다.
4. 매장 등록 신청에는 상호명, 사업자 등록번호, 사업자 등록 주소, 사업자 등록증 파일이 포함되어야 한다.
5. 관리자는 매장 등록 신청 목록을 조회할 수 있어야 한다.
6. 관리자는 신청을 승인 또는 반려할 수 있어야 한다.
7. 승인 시 점주 계정과 실제 매장을 연결할 수 있어야 한다.
8. 한 점주는 여러 매장을 가질 수 있어야 한다.
9. 한 매장은 1차 정책상 하나의 대표 점주에게만 연결된다.
10. 보호 API는 JWT 기반 인증으로 동작해야 한다.
11. 프론트는 로그인 후 `/api/v1/auth/me`로 세션을 복원할 수 있어야 한다.

## 7. UX Notes
- 점주 회원가입 화면에서는 사업자 정보 입력을 받지 않는다.
- 점주 로그인 후 연결된 매장이 없으면 "매장 등록 신청" 화면을 바로 보여주는 편이 자연스럽다.
- 점주는 `내 신청 현황`과 `내 매장 목록`을 구분해서 볼 수 있어야 한다.
- 승인 전에는 POS 상태 변경이 비활성화되어야 한다.

## 8. Domain Considerations
- 인증의 중심은 `users`다.
- 점주 매장 신청은 별도 엔티티로 분리한다.
- 점주-매장 연결은 별도 엔티티로 관리한다.
- 점주 계정 상태와 매장 신청 상태는 분리해야 한다.

## 9. Backend Surface
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/owner/store-applications`
- `GET /api/v1/owner/store-applications`
- `GET /api/v1/owner/stores`
- `GET /api/v1/admin/owner-store-applications`
- `GET /api/v1/admin/owner-store-applications/{applicationId}/match-candidates`
- `POST /api/v1/admin/owner-store-applications/{applicationId}/approve`
- `POST /api/v1/admin/owner-store-applications/{applicationId}/reject`

## 10. Open Questions
- 다매장 점주가 기본 매장을 설정할 수 있게 할지
- 서브 매니저 권한을 나중에 지원할지
- 사업자 번호 중복 신청 정책을 얼마나 엄격하게 둘지
