# Favorite Store Test Scenarios

## Feature
- favorite-store

## Preconditions
- 테스트용 회원 계정이 존재한다.
- 테스트용 매장 데이터가 존재한다.
- 비로그인 상태와 로그인 상태를 모두 재현할 수 있다.
- 카카오 장소 검색 결과를 Toggle `store`로 매핑하는 흐름을 재현할 수 있다.

## Guest Flow

### TC-01 Guest cannot add favorite
- Preconditions: 비로그인 상태
- Steps:
  1. 매장 카드 또는 상세에서 하트 버튼을 누른다.
- Expected:
  1. 즐겨찾기 관계는 생성되지 않는다.
  2. 로그인 유도 UI가 표시된다.
  3. 현재 탐색 화면은 유지된다.

### TC-02 Guest can continue browsing after login prompt
- Preconditions: 비로그인 상태
- Steps:
  1. 즐겨찾기 버튼을 눌러 로그인 유도를 띄운다.
  2. 로그인하지 않고 모달을 닫는다.
- Expected:
  1. 지도/리스트/상세 탐색 흐름이 끊기지 않는다.
  2. 오류 화면으로 이동하지 않는다.

## Member Flow

### TC-03 Member can add favorite
- Preconditions: 로그인 상태, 대상 매장이 즐겨찾기되지 않음
- Steps:
  1. 매장 카드에서 하트 버튼을 누른다.
- Expected:
  1. 즐겨찾기가 생성된다.
  2. 하트 UI가 활성화된다.
  3. 저장 목록에서 해당 매장이 보인다.

### TC-04 Member can add favorite from Kakao search result
- Preconditions: 로그인 상태, 카카오 검색 결과가 존재하고 해당 장소가 아직 즐겨찾기되지 않음
- Steps:
  1. 카카오 검색 결과 카드에서 하트 버튼을 누른다.
  2. 프론트가 resolve 과정을 거쳐 내부 `storeId`를 확보한다.
- Expected:
  1. 장소가 Toggle 내부 `store`로 정상 매핑된다.
  2. 이후 즐겨찾기가 정상 생성된다.
  3. 저장 목록에서는 내부 `store` 기준으로 조회된다.

### TC-05 Member can remove favorite
- Preconditions: 로그인 상태, 대상 매장이 이미 즐겨찾기됨
- Steps:
  1. 활성화된 하트 버튼을 다시 누른다.
- Expected:
  1. 즐겨찾기 관계가 삭제된다.
  2. 하트 UI가 비활성화된다.
  3. 저장 목록에서 해당 매장이 사라진다.

### TC-06 Favorite state stays consistent across screens
- Preconditions: 로그인 상태
- Steps:
  1. 리스트에서 매장을 즐겨찾기한다.
  2. 상세로 이동한다.
  3. 저장 목록으로 이동한다.
- Expected:
  1. 리스트/상세/저장 목록이 동일한 즐겨찾기 상태를 보여준다.

## Negative Cases

### TC-07 Duplicate favorite is blocked
- Preconditions: 로그인 상태, 이미 즐겨찾기된 매장
- Steps:
  1. 동일 매장에 대해 추가 API를 다시 호출한다.
- Expected:
  1. 서버는 `409 Conflict`
  2. 프론트는 중복 저장으로 인해 상태가 꼬이지 않는다.

### TC-08 Removing non-existing favorite is safe
- Preconditions: 로그인 상태, 해당 매장 즐겨찾기 없음
- Steps:
  1. 삭제 API를 호출한다.
- Expected:
  1. 서버는 `404 Not Found`
  2. 프론트는 비정상 종료하지 않는다.

### TC-09 Deleted or missing store is handled gracefully
- Preconditions: 로그인 상태, 저장 목록에 포함된 매장이 삭제되었거나 조회 불가
- Steps:
  1. 저장 목록을 조회한다.
- Expected:
  1. 목록이 깨지지 않는다.
  2. 정책에 따라 제외되거나 안전한 대체 표시를 제공한다.

### TC-10 Kakao result without store mapping is handled safely
- Preconditions: 로그인 상태, 카카오 검색 결과는 있으나 내부 매핑 생성 실패
- Steps:
  1. 즐겨찾기 추가를 시도한다.
- Expected:
  1. 프론트는 실패를 사용자에게 안내한다.
  2. 잘못된 즐겨찾기 관계가 생성되지 않는다.

## Owner Flow

### TC-11 Owner can use favorite as a personal feature only
- Preconditions: 점주 계정 로그인
- Steps:
  1. 일반 매장을 즐겨찾기한다.
- Expected:
  1. 본인 계정의 개인 즐겨찾기로 처리된다.
  2. 점주 전용 기능과 혼동되지 않는다.

## Admin Flow

### TC-12 Admin cannot manage another user's favorites
- Preconditions: 관리자 로그인
- Steps:
  1. 다른 사용자 기준의 즐겨찾기 리소스 접근을 시도한다.
- Expected:
  1. 본인 기준 이외의 즐겨찾기 조작은 불가하다.

## Regression Checks
- 로그인 유도 모달이 다른 카드 클릭 동작을 깨지 않는지 확인
- 저장 목록 빈 상태 화면이 정상 동작하는지 확인
- 즐겨찾기 후 내 지도 추가 흐름이 깨지지 않는지 확인
- 모바일 `/favorites`와 웹 `/favoritesweb` 흐름이 서로 크게 어긋나지 않는지 확인
- 카카오 검색 결과에서 즐겨찾기한 매장과 일반 목록에서 즐겨찾기한 매장이 동일 store로 합쳐지는지 확인
