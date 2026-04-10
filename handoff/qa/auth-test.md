# Auth QA Report

## Scope
- JWT + Spring Security 기반 로그인/회원가입 백엔드 구현 검증
- 인증 API와 보호 API(`favorites`) 접근 제어 확인
- 입력 정규화, 토큰 검증, 상태 기반 접근 제어, 중복/무결성 예외 처리 확인

## Test Summary
- 대상: `signup`, `login`, `refresh`, `logout`, `me`, `favorites`, `stores/resolve`
- 방식: Spring Boot 통합 테스트 + QA 관점 코드 리뷰
- 결과: 주요 문제를 7건 식별했고 모두 리팩터링 및 테스트 반영 완료

## Findings

### 1. 차단/비활성 사용자도 기존 JWT로 보호 API 접근 가능
- 문제: 토큰이 유효하면 사용자 상태 변경 이후에도 인증이 유지될 수 있었다.
- 영향: 차단된 계정이 계속 즐겨찾기 등 보호 기능에 접근 가능했다.
- 조치: 인증 사용자 조회 시 DB의 최신 `UserStatus`를 다시 검사하도록 수정했다.
- 상태: fixed

### 2. `logout`이 유효하지 않은 refresh token도 성공 처리
- 문제: 임의 문자열을 보내도 `loggedOut: true`가 반환될 수 있었다.
- 영향: 프론트/운영 측에서 실제 세션 종료 여부를 오인할 수 있었다.
- 조치: refresh token 유효성 검사를 통과해야만 성공 응답을 주도록 수정했다.
- 상태: fixed

### 3. JWT secret 설정 정책 이력
- 문제: 과거에는 JWT secret 기본값 하드코딩 리스크를 줄이기 위해 환경변수 기반 설정으로 전환했었다.
- 영향: 당시에는 설정 누락 시 기본 비밀키 구동 위험을 줄이는 데 도움이 됐다.
- 조치: 이후 프로젝트 운영 정책이 변경되어, 현재는 백엔드 `application.yml`에 직접 고정값을 두고 환경변수 참조를 사용하지 않는다.
- 상태: superseded by current backend config policy

### 4. 이메일 정규화 누락으로 중복 계정 생성 가능성
- 문제: 공백, 대소문자가 섞인 이메일 입력이 그대로 처리됐다.
- 영향: 같은 이메일 계정이 중복 생성되거나 로그인 일관성이 깨질 수 있었다.
- 조치: 요청 문자열 trim + 서비스 단계 소문자 정규화를 적용했다.
- 상태: fixed

### 5. 외부 장소 식별자 정규화 누락으로 같은 매장 중복 생성 가능성
- 문제: `externalSource`, `externalPlaceId`에 공백/표기 차이가 있으면 다른 매장처럼 저장될 수 있었다.
- 영향: 동일 카카오 장소가 중복 `store`로 쌓일 수 있었다.
- 조치: source/placeId trim 및 표준화 후 동일 매장을 재사용하도록 수정했다.
- 상태: fixed

### 6. `stores/resolve` 재호출 시 최신 매장 정보 미반영
- 문제: 이미 매핑된 매장을 찾으면 이름/전화번호/주소/좌표를 업데이트하지 않았다.
- 영향: 오래된 매장 메타데이터가 계속 노출될 수 있었다.
- 조치: resolve 재호출 시 최신 값으로 동기화하도록 수정했다.
- 상태: fixed

### 7. 즐겨찾기 중복 요청 레이스 시 500 가능성
- 문제: 사전 `exists` 체크를 통과한 동시 요청이 DB 유니크 제약에 걸리면 500이 날 수 있었다.
- 영향: 클라이언트 입장에서 중복 저장이 서버 오류처럼 보일 수 있었다.
- 조치: `DataIntegrityViolationException`을 `409 FAVORITE_ALREADY_EXISTS`로 매핑했다.
- 상태: fixed

## Added Regression Coverage
- 회원가입 후 로그인/내 정보 조회 성공
- 이메일 정규화 및 대소문자 중복 가입 방지
- 잘못된 로그인 정보 `401`
- 보호 API 인증 필요 `401`
- 점주 신청 multipart 업로드 성공
- 승인 대기 점주 로그인 차단
- 관리자 승인 후 `OWNER` 로그인 성공
- 관리자 반려 후 점주 로그인 차단
- 관리자 전용 승인 API 권한 체크
- 차단 사용자 토큰 접근 차단
- 유효하지 않은 refresh token logout 차단
- 외부 장소 식별자 정규화 및 동일 store 재사용

## Verification
- command: `./gradlew test`
- result: pass

## Playwright UI QA

### Scope
- 브라우저 기반 회원가입, 로그인, 즐겨찾기, 마이맵, POS 접근 제어 검증
- 프론트 인증 전환 이후 실제 세션 정리와 역할 기반 라우팅 확인

### Findings

### 8. 로컬 개발 환경에서 백엔드가 바로 기동되지 않음
- 문제: 런타임 datasource/H2 설정이 없어 `bootRun` 기준으로 서버가 뜨지 않았다.
- 영향: 프론트-백엔드 연동 QA 자체를 시작할 수 없었다.
- 조치: `H2` 런타임 의존성과 기본 datasource fallback 설정을 추가했다.
- 상태: fixed

### 9. 즐겨찾기 화면의 영업 상태가 실제 지도 상태와 다르게 표시됨
- 문제: POS에서 `영업중`으로 바뀐 매장이 즐겨찾기에서는 `영업종료`로 보였다.
- 영향: 사용자 입장에서 저장한 매장의 실시간 상태를 신뢰할 수 없었다.
- 조치: 즐겨찾기 매핑 시 로컬 live status를 우선 반영하도록 수정했다.
- 상태: fixed

### 10. 마이맵 프로필이 로그인 사용자와 무관한 하드코딩 값을 노출
- 문제: 로그인 후에도 `토글러님의 지도`, `@toggle_user_1` 같은 고정 값이 표시됐다.
- 영향: 실제 계정 기반 개인화가 깨지고 사용자 혼란을 유발했다.
- 조치: `currentUser.nickname`, `currentUser.email` 기반으로 프로필/지도 제목을 동기화했다.
- 상태: fixed

### 11. 일반 사용자도 `/pos`에 직접 접근 가능
- 문제: `USER` 계정으로도 점주 전용 POS 대시보드에 진입할 수 있었다.
- 영향: 역할 기반 접근 제어가 프론트에서 무너져 권한 분리가 되지 않았다.
- 조치: `ProtectedRoute`에 role 체크를 추가하고 `/pos`를 `OWNER` 전용으로 제한했다.
- 상태: fixed

### 12. POS 로그아웃 후 인증 토큰이 localStorage에 남음
- 문제: POS 화면에서 로그아웃해도 `accessToken`, `refreshToken`, `currentUser`가 그대로 남았다.
- 영향: 보호 라우트 재진입 또는 세션 오인식 가능성이 있었다.
- 조치: POS 로그아웃 시 backend logout 호출 후 `clearAuthSession()`으로 세션 키를 일괄 삭제하도록 수정했다.
- 상태: fixed

### 13. POS 상단 매장 정보가 실제 로그인 점주와 무관한 더미 값으로 표시됨
- 문제: POS 헤더가 항상 샘플 매장명/ID를 노출했다.
- 영향: 점주 계정으로 로그인해도 본인 매장 화면처럼 보이지 않았다.
- 조치: POS 상단 표시값을 현재 로그인 사용자 정보 기반으로 교체했다.
- 상태: fixed

### Browser Verification
- backend: `./gradlew bootRun`
- frontend: `npm run dev -- --host 127.0.0.1 --port 4173`
- Playwright:
  - `USER` 회원가입/로그인 성공
  - `/favorites` 진입 및 즐겨찾기 매장 상태 `영업중` 반영 확인
  - `/my-map`에서 로그인 사용자 이름/이메일 반영 확인
  - `USER`의 `/pos` 접근 시 `/` 리다이렉트 확인
  - `OWNER` 회원가입/로그인 후 `/pos` 접근 성공
  - `OWNER` 로그아웃 후 localStorage 인증 키 제거 확인
  - 로그아웃 뒤 `/pos` 재접근 시 `/login` 리다이렉트 확인
  - 시드 점주 계정 `test@test.com / test` 로그인 성공
  - 인증된 상태에서 `/pos` 직접 진입 시 세션 복원 후 화면 유지 확인
  - `StoreDetail` 페이지 렌더링 및 실시간 상태 표시 확인

## Residual Risks
- refresh token은 아직 서버 저장소 없이 stateless로 동작한다.
- 강제 로그아웃, 토큰 회수, 멀티 디바이스 세션 제어가 필요해지면 별도 저장/폐기 전략이 필요하다.

## Next Recommended Actions
- 프론트 `Login/Signup`을 새 auth API에 연결한다.
- 프론트 `favorites` 요청을 `Authorization: Bearer` 기반으로 전환한다.
- refresh token 회수 전략이 필요한지 제품/보안 기준으로 결정한다.

## Owner Approval Flow Notes
- 일반 회원가입과 점주 가입 신청을 분리했다.
- 점주 신청은 `multipart/form-data`로 사업자 등록증 파일을 함께 받는다.
- `OWNER` 사용자는 관리자 승인 전 `PENDING_APPROVAL` 상태이며 로그인할 수 없다.
- 관리자 승인 API는 구현됐지만 관리자 웹 화면은 아직 mock 기반이라 후속 연결이 필요하다.
