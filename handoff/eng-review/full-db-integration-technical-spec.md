# 전면 DB 통합 기술 명세 (Full DB Integration Technical Spec)

## 1. 개요
본 문서는 `toggle` 애플리케이션의 모든 로컬/목업 데이터를 실제 백엔드 DB 파이프라인으로 마이그레이션한 기술적 최종 상태를 정의합니다.

## 2. 백엔드 아키텍처 변경 사항

### 2.1. 엔티티 확장 및 신설
- **`Store` 엔티티**: `rating` (별점) 필드가 추가되어 점주가 설정하거나 시스템에서 계산된 평점을 영속화합니다.
- **`PublicInstitution` 엔티티**: 카카오 장소 ID(`externalPlaceId`)와 연동되는 공공기관 데이터를 관리합니다. `congestionLevel`, `waitTime`, `operatingHours`를 포함합니다.
- **`PublicFavorite` 엔티티**: 사용자와 공공기관 간의 즐겨찾기(N:M) 관계를 정의합니다.

### 2.2. API 엔드포인트
- **사용자 프로필 (`GET /api/v1/auth/me`)**:
    - 응답에 `favorites` 객체 포함 (`stores` ID 목록, `publics` ID 목록).
    - 프론트엔드가 로그인 직후 모든 즐겨찾기 상태를 동기화할 수 있도록 지원합니다.
- **스토어 조회 (`POST /api/v1/stores/lookup`)**:
    - 대량 조회 시 `rating`, `ownerNotice`, `imageUrls` 등 상세 메타데이터를 포함하도록 확장되었습니다.
- **공공기관 조회 (`POST /api/v1/public-institutions/lookup`)**:
    - 카카오 ID 목록을 받아 DB 내 엔티티로 해석하고 라이브 데이터를 반환합니다.
    - DB에 없는 경우 마이그레이션 전략에 따라 임시 데이터를 생성하여 즉시 연동합니다.
- **즐겨찾기 관리**:
    - `POST/DELETE /api/v1/favorites/publics/{id}`: 공공기관 즐겨찾기 추가/삭제.

## 3. 프론트엔드 리팩터링

### 3.1. 데이터 소스 통합
- `src/mocks/` 하위의 모든 파일이 삭제되었으며, 모든 데이터는 `lib/` 유틸리티를 통한 API 호출로 수행됩니다.
- **`useKakaoPlacesWithLookup` 훅**:
    - 카카오 검색 결과와 백엔드 DB 상태를 실시간으로 병합하는 핵심 로직입니다.
    - 카테고리가 '공공기관'인 경우 `PublicInstitution` lookup API를 호출하도록 분기 처리되었습니다.

### 3.2. 상태 관리 정책
- **Favorites**: 서버 데이터(`auth/me`)를 마스터로 사용하며, 변경 시 `favoritesChanged` 커스텀 이벤트를 통해 앱 전역의 UI(지도 마커, 리스트 배지 등)가 즉시 갱신됩니다.
- **Mappers**: `storeMappers.js` 및 `storePreview.js`가 백엔드 DTO 규격에 맞춰 정규화된 객체를 생성하도록 단일화되었습니다.

## 4. 보안 및 성능
- `SecurityConfig`에서 `/api/v1/public-institutions/lookup` 등 읽기 전용 API는 비로그인 사용자에게도 허용됩니다.
- 모든 즐겨찾기 변경 및 개인 프로필 조회는 JWT 기반 인증을 필수로 합니다.
- 대량의 카카오 검색 결과를 백엔드 DB와 병합할 때 bulk lookup 방식을 사용하여 네트워크 오버헤드를 최소화했습니다.
