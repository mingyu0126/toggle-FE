# POS Store Selection And Request Accordion Design

## Scope
- 대상 화면: `/pos`
- 변경 범위:
  - `내 매장 연결 현황`의 매장 선택 UI를 드롭다운에서 카드 직접 선택 방식으로 변경
  - `내 신청 현황` 카드를 아코디언 토글 구조로 변경

## Goals
- 매장 카드 클릭만으로 현재 선택 매장이 즉시 바뀌어야 한다.
- 선택된 매장이 시각적으로 명확히 강조되어야 한다.
- 기존 `selectedStoreId -> selectedStore` 상태 흐름을 그대로 재사용해 상단 요약, 운영시간, 상태 관리, 사진, 코멘트가 자동 연동되어야 한다.
- 신청 카드가 기본적으로 접힌 상태에서 핵심 정보만 보여주고, 헤더 클릭 시 상세 정보가 자연스럽게 열리고 닫혀야 한다.

## Out Of Scope
- `/posweb` 변경
- 신청 데이터 구조 변경
- 신규 API 추가
- 페이지 전체 레이아웃 재설계

## UX Design

### 1. 매장 선택 카드
- 상단의 `select`는 제거한다.
- 각 매장은 클릭 가능한 `button` 카드로 렌더링한다.
- 카드에는 다음을 노출한다:
  - 매장명
  - 주소
  - 기존 영업 상태 배지
- 선택 상태 카드는 배경색, 보더, 그림자, 선택 표시를 통해 구분한다.
- 카드 전체를 터치 영역으로 확보해 모바일에서도 쉽게 누를 수 있게 한다.
- 접근성:
  - 실제 `button` 요소 사용
  - `aria-pressed`로 선택 상태 제공

### 2. 신청 현황 아코디언
- 각 신청 카드는 헤더 버튼 + 상세 영역으로 분리한다.
- 기본값은 모두 닫힘으로 둔다.
- 닫힘 상태 표시:
  - 상호명
  - 상태 배지
  - 한 줄 요약
  - chevron 아이콘
- 열림 상태 표시:
  - 진행 메시지
  - 진행바
  - 사업자번호
  - 주소
  - 사업자/지도 검증 상태
  - 반려 사유(있는 경우)
- 여러 카드 동시 열림을 허용한다.
- 접근성:
  - 헤더를 `button`
  - `aria-expanded`, `aria-controls`
  - 상세 영역에 `id`

## State Design

### 매장 선택
- 기존 `selectedStoreId`를 계속 단일 선택 상태로 사용한다.
- 카드 클릭 핸들러는 `setSelectedStoreId(store.storeId)`만 수행한다.
- 기존 `selectedStore` 계산 로직과 `useEffect([selectedStore])` 동기화 로직은 그대로 둔다.

### 신청 카드 토글
- 새 상태: `expandedRequestIds`
- 자료형: `number[]`
- 토글 방식:
  - 이미 열린 카드면 배열에서 제거
  - 닫힌 카드면 배열에 추가

## Verification
- `cd apps/frontend && npm run build`
- `cd apps/frontend && npx eslint src/pages/Pos.jsx`

## Workflow Notes
- 저장소 규칙상 worktree 및 서브에이전트 위임이 기본이지만, 현재 워크스페이스가 이미 같은 경로를 포함한 dirty 상태라 이번 변경은 로컬 예외 실행으로 기록한다.
- 프론트 테스트 러너가 아직 정식 도입되지 않아, 이번 UI 변경은 빌드 및 정적 검증 중심으로 확인한다.
