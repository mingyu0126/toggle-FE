# Map/List/Admin Web Fixes Design

**Date:** 2026-04-14

## Goal

수동 QA에서 확인된 웹/모바일 프론트 회귀 5건을 한 번에 정리한다.

- `/my-mapweb` 카드 액션 버튼 겹침 제거
- `/favoritesweb` 텍스트/탭 스타일 복구 및 액션 영역 정리
- `/listweb` 검색 기준 위치를 "마지막으로 사용자가 검색한 좌표" 기반으로 복원
- `/list` 페이지 미노출 런타임 오류 수정
- `/adminweb` 운영 콘솔에 불필요한 메인 소개 멘트 제거

## Scope

이번 변경은 프론트엔드 렌더링, 페이지 상태, CSS 정합성, 라우팅/런타임 오류 수정에 한정한다.

### In Scope

- `apps/frontend/src/pages/MyMapWeb.jsx`
- `apps/frontend/src/pages/MyMapWeb.module.css`
- `apps/frontend/src/pages/FavoritesWeb.jsx`
- `apps/frontend/src/pages/FavoritesWeb.module.css`
- `apps/frontend/src/pages/ListWeb.jsx`
- `apps/frontend/src/pages/List.module.css`
- `apps/frontend/src/pages/List.jsx`
- `apps/frontend/src/pages/AdminWeb.jsx`
- `apps/frontend/src/pages/AdminWeb.module.css`
- 필요 시 관련 공용 스타일/페이지 보조 CSS

### Out of Scope

- 백엔드 API 계약 변경
- 지도 검색 UX 전면 재설계
- 웹/모바일 공용 리스트 구조 대규모 통합
- 공용 카드 컴포넌트의 범용 액션 슬롯 재설계

## Current Problems

### 1. MyMapWeb 액션 버튼 겹침

`MyMapWeb`는 카드별 액션 세 개를 모두 `deleteBtn`으로 렌더링한다. 해당 클래스는 절대 위치 기반이어서 동일한 좌표에 버튼이 쌓인다. 현재 구조에서는 "지도", "상세", "삭제"가 시각적으로 겹치고 클릭 영역도 불안정하다.

### 2. FavoritesWeb CSS/레이아웃 불일치

`FavoritesWeb.jsx`는 `sidebarTitleWrap`, `sidebarTitle`, `sidebarSubtitle`, `tabBtn`, `activeTab`, `placeList` 같은 클래스를 사용하지만 실제 CSS 정의가 없다. 그래서 제목/탭/목록 영역이 의도된 스타일을 못 받고 일부 텍스트 가독성과 레이아웃이 무너진다. 또 "내 지도에 추가" 버튼이 카드 하단과 분리되어 붙어 보인다.

### 3. ListWeb 검색 기준 위치 회귀

`ListWeb`는 진입 시 브라우저 geolocation 성공 결과를 즉시 `mapCenter`에 반영하고 그 위치로 바로 목록을 조회한다. 하지만 실제 의도는 `/mapweb`와 동일하게 "현재 보고 있는 지도"와 "실제 검색 기준 좌표"를 분리하고, 사용자가 명시적으로 검색 액션을 눌렀을 때만 결과 기준 좌표를 갱신하는 것이다.

### 4. List 페이지 자체 비노출

`List.jsx`는 `useEffect`를 사용하지만 React import에 포함하지 않아 런타임 ReferenceError가 발생한다. 그 결과 `/list` 페이지가 렌더링되지 않는다.

### 5. AdminWeb 상단 hero 카피 과다

관리자 콘솔은 운영 작업이 목적이므로 설명형 hero 카피는 불필요하다. 현재 상단의 소개 문구가 세로 공간을 차지하고 실제 운영 정보 밀도를 떨어뜨린다.

## Proposed Design

### MyMapWeb

- 카드 본문 아래에 전용 액션 행을 만든다.
- `지도에서 보기`, `상세 보기`, `삭제`를 일반 문서 흐름 안의 버튼으로 렌더링한다.
- `삭제`만 danger style을 사용하고 나머지는 neutral/primary tone으로 구분한다.
- 카드 자체 클릭과 액션 버튼 클릭이 충돌하지 않도록 이벤트 분리를 유지한다.

### FavoritesWeb

- JSX에서 사용하는 누락 CSS 클래스를 실제로 정의한다.
- 제목 영역, 탭 그룹, 목록 스크롤 영역을 명시적으로 구성한다.
- "내 지도에 추가" 버튼은 카드와 하나의 액션 블록으로 보이게 spacing과 panel tone을 조정한다.
- 버튼이 카드 바깥에 떠 있는 인상보다 "이 카드에 대한 다음 액션"으로 읽히도록 구조를 바꾼다.

### ListWeb

- `mapCenter`와 `searchCenter`를 분리한다.
- 초기값은 동일한 기본 좌표를 사용하되, geolocation 성공 시에도 자동 검색 기준 갱신은 하지 않는다.
- 사용자가 "현 지도에서 검색" 또는 동등한 명시적 액션을 눌렀을 때만 `searchCenter = mapCenter`로 갱신한다.
- 마지막 검색 좌표는 `localStorage`에 저장하고, 다음 방문 시 그 좌표를 `searchCenter` 초기값으로 복원한다.
- 결과 리스트는 항상 `searchCenter`를 기준으로 조회한다.

### List

- `useEffect` import를 복구한다.
- 모바일 리스트도 최소한 페이지가 뜨도록 런타임 오류를 먼저 제거한다.
- 가능하면 `searchCenter` 분리 패턴도 함께 맞춰 웹/모바일 동작 차이를 줄인다.

### AdminWeb

- hero 카피 블록을 제거한다.
- 통계 카드만 남기되 상단 summary strip처럼 더 압축된 구조로 배치한다.
- 신청 목록과 상세 작업 패널이 첫 화면에서 바로 보이도록 정보 밀도를 높인다.

## Data Flow

### ListWeb / List 검색 흐름

1. 페이지 진입 시 `LAST_LIST_SEARCH_CENTER`를 읽는다.
2. 값이 있으면 `searchCenter` 초기값으로 사용한다.
3. `mapCenter`는 기본값 또는 사용자의 위치/지도 이동에 따라 따로 변한다.
4. 장소 조회 훅은 `searchCenter`만 입력받는다.
5. 사용자가 명시적 검색 액션을 누르면 현재 `mapCenter`를 `searchCenter`로 승격시키고 localStorage에 저장한다.

이 구조로 "지도를 움직이는 것"과 "그 위치로 실제 검색하는 것"을 분리한다.

## Error Handling

- localStorage 좌표 파싱 실패 시 기본 좌표로 폴백한다.
- geolocation 실패는 검색 기준을 강제로 바꾸지 않고 단순히 현 위치 보조 기능만 실패한 것으로 처리한다.
- 삭제/내 지도 추가 등 기존 alert 흐름은 유지하되 버튼 상태 및 spacing만 정리한다.

## Testing Strategy

- 빌드 검증: `cd apps/frontend && npm run build`
- 대상 lint 검증: 변경 파일 대상 `npx eslint ...`
- 수동 확인 포인트:
  - `/my-mapweb` 버튼 3개가 겹치지 않고 각각 동작
  - `/favoritesweb` 제목/탭/텍스트 표시 정상
  - `/favoritesweb`의 "내 지도에 추가"가 카드 액션처럼 보임
  - `/listweb` 첫 진입 시 마지막 검색 좌표를 읽고, 지도 이동만으로는 결과 기준이 바뀌지 않음
  - 검색 버튼 클릭 후 결과 기준 좌표가 갱신되고 재방문 시 유지됨
  - `/list` 페이지가 정상 렌더링됨
  - `/adminweb` 상단 hero 문구 제거 후 목록/상세 영역이 즉시 보임

## Success Criteria

- 제보된 5개 수동 QA 이슈가 모두 재현 불가 상태가 된다.
- 검색 기준 위치 규칙이 `/mapweb`과 `/listweb` 사이에서 일관된다.
- 변경은 프론트엔드 범위 안에서 끝나며 기존 API 계약은 유지된다.
