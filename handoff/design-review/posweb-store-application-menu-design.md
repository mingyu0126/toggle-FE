# POS Web Store Application Menu Design

## Scope
- 대상 화면: `/posweb`
- 목표:
  - 좌측 메뉴에 `매장 등록 신청` 진입점 추가
  - PC 전용 신청 폼 화면 추가
  - 기존 `입점 신청 내역`은 조회 화면으로 유지

## Goals
- `/posweb`에서도 점주가 별도 모바일 화면 없이 매장 등록 신청을 제출할 수 있어야 한다.
- 운영 대시보드와 신청 업무를 메뉴 단위로 분리해 정보구조를 명확히 해야 한다.
- 기존 백엔드 신청 생성 API와 신청 조회 API를 그대로 재사용해야 한다.

## IA
- 좌측 메뉴
  - `대시보드`
  - `매장 등록 신청`
  - `내 신청 현황`

## UX
- `매장 등록 신청` 탭은 넓은 폼 카드 1장으로 구성한다.
- 필드는 모바일 `/pos`와 동일하게 유지한다:
  - 상호명
  - 사업자 등록번호
  - 대표자명
  - 개업일자
  - 실영업주소
  - 실영업 전화번호
  - 사업자 등록증 파일
- 제출 성공 시:
  - 폼 초기화
  - 신청 목록 재조회
  - `내 신청 현황` 탭으로 전환
  - 성공 alert 노출

## Implementation Notes
- `PosWeb.jsx`의 `activeTab`에 새 탭 키를 추가한다.
- `createOwnerStoreApplication()`를 import해 폼 submit에 연결한다.
- 신청 폼 상태는 `/pos`와 동일한 shape로 두어 계약 차이를 만들지 않는다.
- 스타일은 `PosWeb.module.css`에 PC용 폼 카드와 입력 레이아웃만 추가한다.

## Verification
- `cd apps/frontend && npx eslint src/pages/PosWeb.jsx`
- `cd apps/frontend && npm run build`
