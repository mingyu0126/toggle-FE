# Map/List/Admin Web Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 웹/모바일 지도/리스트/관리자 화면의 수동 QA 이슈 5건을 프론트엔드 정합성 수정으로 해결한다.

**Architecture:** 페이지별로 깨진 상태 관리와 CSS 구조를 바로잡고, 리스트 검색 기준 좌표는 `mapCenter`와 `searchCenter` 분리 + localStorage 복원 방식으로 맞춘다. 공용 백엔드 계약은 유지하면서 페이지 단위 회귀만 수정한다.

**Tech Stack:** React 19, react-router-dom, CSS Modules, Vite 7

---

### Task 1: List / ListWeb 검색 기준 위치 규칙 복원

**Files:**
- Modify: `apps/frontend/src/pages/ListWeb.jsx`
- Modify: `apps/frontend/src/pages/ListWeb.module.css`
- Modify: `apps/frontend/src/pages/List.jsx`

- [ ] **Step 1: Write the failing test scenario as a verification note**

Manual behavior to reproduce:

```text
1. Visit /listweb
2. Confirm page immediately loads results around browser geolocation instead of last explicit search center
3. Move map and observe there is no explicit "현 지도에서 검색" step gating result refresh
4. Visit /list and confirm page crashes before render due to missing useEffect import
```

- [ ] **Step 2: Run the current frontend build to capture the baseline**

Run: `cd apps/frontend && npm run build`
Expected: PASS or existing unrelated warnings only

- [ ] **Step 3: Add search-center persistence and explicit refresh behavior**

Implementation requirements:

```jsx
const LAST_LIST_SEARCH_CENTER_KEY = 'toggle:last-list-search-center';

function readStoredSearchCenter() {
  try {
    const raw = window.localStorage.getItem(LAST_LIST_SEARCH_CENTER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat !== 'number' || typeof parsed?.lng !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistSearchCenter(center) {
  window.localStorage.setItem(LAST_LIST_SEARCH_CENTER_KEY, JSON.stringify(center));
}
```

- `ListWeb` keeps separate `mapCenter` and `searchCenter`
- `useKakaoPlacesWithLookup` receives `searchCenter`
- explicit button updates `searchCenter` and persists it
- `List` imports `useEffect` and mirrors the same separation pattern where feasible

- [ ] **Step 4: Re-run the build after the list behavior changes**

Run: `cd apps/frontend && npm run build`
Expected: PASS

- [ ] **Step 5: Run targeted lint for the list files**

Run: `cd apps/frontend && npx eslint src/pages/List.jsx src/pages/ListWeb.jsx`
Expected: PASS

### Task 2: MyMapWeb card action overlap fix

**Files:**
- Modify: `apps/frontend/src/pages/MyMapWeb.jsx`
- Modify: `apps/frontend/src/pages/MyMapWeb.module.css`

- [ ] **Step 1: Capture the failing UI behavior as a verification note**

```text
In /my-mapweb each card renders 지도에서 보기, 상세 보기, 삭제 with the same absolute-positioned deleteBtn class, so buttons overlap.
```

- [ ] **Step 2: Replace absolute overlay actions with a dedicated action row**

Implementation requirements:

```jsx
<div className={styles.cardActions}>
  <button className={styles.secondaryActionBtn}>지도에서 보기</button>
  <button className={styles.secondaryActionBtn}>상세 보기</button>
  <button className={styles.dangerActionBtn}>삭제</button>
</div>
```

```css
.cardActions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}
```

- [ ] **Step 3: Run targeted lint for MyMapWeb**

Run: `cd apps/frontend && npx eslint src/pages/MyMapWeb.jsx`
Expected: PASS

### Task 3: FavoritesWeb visual recovery and add-to-my-map action layout

**Files:**
- Modify: `apps/frontend/src/pages/FavoritesWeb.jsx`
- Modify: `apps/frontend/src/pages/FavoritesWeb.module.css`

- [ ] **Step 1: Capture the failing UI behavior as a verification note**

```text
FavoritesWeb uses CSS classes that do not exist, causing title/tab/list styling regressions and poor text contrast. The add-to-my-map button looks detached from the card.
```

- [ ] **Step 2: Add the missing CSS classes and align the JSX structure**

Implementation requirements:

```css
.sidebarTitleWrap {}
.sidebarTitle {}
.sidebarSubtitle {}
.tabBtn {}
.activeTab {}
.placeList {}
```

- ensure text is readable on the dark sidebar
- ensure tab buttons have active/inactive states
- ensure list area scrolls correctly

- [ ] **Step 3: Make the add-to-my-map CTA read as part of the card action block**

Implementation requirements:

```css
.cardActionBlock {
  padding: 0.85rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.03);
}
```

- preserve current behavior while improving grouping and spacing

- [ ] **Step 4: Run targeted lint for FavoritesWeb**

Run: `cd apps/frontend && npx eslint src/pages/FavoritesWeb.jsx`
Expected: PASS

### Task 4: AdminWeb hero removal and summary compaction

**Files:**
- Modify: `apps/frontend/src/pages/AdminWeb.jsx`
- Modify: `apps/frontend/src/pages/AdminWeb.module.css`

- [ ] **Step 1: Capture the failing UX behavior as a verification note**

```text
AdminWeb shows a marketing-style hero intro that wastes vertical space in an operations console.
```

- [ ] **Step 2: Remove the hero copy block and keep only compact summary stats**

Implementation requirements:

```jsx
<section className={styles.summaryStrip}>
  <article className={styles.statCard}>...</article>
</section>
```

- list/detail workspace should appear higher on first paint

- [ ] **Step 3: Run targeted lint for AdminWeb**

Run: `cd apps/frontend && npx eslint src/pages/AdminWeb.jsx`
Expected: PASS

### Task 5: Final verification

**Files:**
- Modify: `daily-log/2026-04-14.md`

- [ ] **Step 1: Record execution and local-implementation exception**

Add note covering:

```text
- worktree exception reason
- subagent delegation exception reason
- files changed
- verification commands run
```

- [ ] **Step 2: Run the full frontend build**

Run: `cd apps/frontend && npm run build`
Expected: PASS

- [ ] **Step 3: Run targeted lint across all changed frontend files**

Run: `cd apps/frontend && npx eslint src/pages/List.jsx src/pages/ListWeb.jsx src/pages/MyMapWeb.jsx src/pages/FavoritesWeb.jsx src/pages/AdminWeb.jsx`
Expected: PASS

- [ ] **Step 4: Manual smoke-check summary**

```text
/listweb search center persists from the last explicit search
/list renders
/my-mapweb actions no longer overlap
/favoritesweb text and action layout look correct
/adminweb intro hero is removed
```
