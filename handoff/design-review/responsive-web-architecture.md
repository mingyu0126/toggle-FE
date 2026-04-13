# Responsive Web Architecture Design Review

## Overview
Toggle 프론트엔드는 모바일 스크린 비율(`MobileFrame`)에 맞춘 컴포넌트로 기획되었으나, 향후 B2B(점주 포털) 웹 및 일반 사용자 PC 검색 유입을 처리하기 위해 데스크탑 기반의 웹 페이지들(`*Web.jsx`)을 개발하였다. 초기 구현체는 고정된(Fixed) Layout Pixel 값을 사용하여 태블릿 및 모바일 기기 접속 시 UI가 화면 밖으로 넘치거나 잘리는 문제가 존재했다.

본 리뷰는 CSS Modules의 `@media` 쿼리를 활용해 Toggle 웹 컴포넌트 전반에 완전한 반응형(Responsive) 아키텍처를 적용한 결정과 그 구현 방향을 기록한다.

## Architecture Decisions

### 1. 2-Track 브рей크포인트(Breakpoint) 전략
Tailwind CSS의 기본 규약을 차용하되, Toggle의 레이아웃 한계점을 기준으로 다음 2단계 반응형 스텝을 적용한다.

- **Tablet (1024px 이하)**: `max-width: 1024px`
  - 좌측 사이드바(리스트/상세)와 우측 카카오 지도의 2단 레이아웃(Grid/Flex)을 유지하되, 고정된 Pixel을 `%` Base 가변 길이로 변경.
  - 검색창의 크기를 유동적으로 축소.

- **Mobile (768px 이하)**: `max-width: 768px`
  - 데스크탑 웹을 모바일로 열 경우, 가로 스크롤을 방지하기 위해 2단 좌우 배치를 **상하 스택(Stack) 구조로 전환**.
  - 지도가 상단(혹은 하단)으로 밀리고, 리스트 컴포넌트가 화면의 전체 width를 차지하도록 1단 Column 레이아웃 적용. 

### 2. 컴포넌트 UX 정책 분리
동일한 데이터를 다루지만 환경(모바일 앱 vs 와이드 웹)에 따라 사용자 클릭 기대치가 다르므로 다음과 같이 분할한다.

- **모바일 맵 바텀시트 (2-Step)**: 화면이 좁기 때문에, 리스트에서 카드를 클릭하면 일단 지도 마커로 이동하여 위치를 확인하는 단계(지도 포커스)를 거치고, 한 번 더 누르면 상세 페이지로 넘어가는 방식을 취한다.
- **웹 맵 사이드바 (1-Step)**: 화면이 넓고 지도를 상시 확인 가능하므로, 왼쪽 리스트를 한 번 클릭하면 즉각적으로 우측 상세 페이지(`StoreWeb`) 등으로 진입하도록 `onClick` 오버라이딩을 해제하였다.

## Implemented Modules

아래 컴포넌트들의 `*.module.css` 전역에 `media query`가 성공적으로 주입되었다.
- `HomeWeb.module.css`
- `StoreWeb.module.css`
- `LandingWeb.module.css`
- `ListWeb.module.css`

## Known Limitations and Follow-up
- 모든 반응형 처리를 순수 Vanilla CSS Modules 기반으로 작성했다. 만일 추후 Tailwind CSS 도입이 공식화될 경우, 본 `*.module.css`의 브레이크포인트 로직을 통째로 Tailwind Utility class (`md:`, `lg:`)로 마이그레이션 해야 한다.
- `StoreWeb`의 에러 상태(Empty State) 레이아웃 또한 반응형 컨테이너를 준수하도록 보강되었다.
