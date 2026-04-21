# Map Category Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `/map` and `/mapweb` so `전체` no longer falls back to restaurants only, and make `기타` include beauty shops and uncategorized places.

**Architecture:** Extract shared category normalization/search configuration into a frontend utility, cover it with lightweight Node-based regression tests, then update the Kakao lookup hook to aggregate category searches for `전체` and keyword-based fallback searches for `기타`. Existing pages continue to use the same hook so behavior changes stay centralized.

**Tech Stack:** React 19, Vite 7, plain ESM utilities, Node built-in test runner

---

### Task 1: Lock category rules in a shared utility

**Files:**
- Create: `apps/frontend/src/lib/placeCategories.js`
- Test: `apps/frontend/tests/placeCategories.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUiCategory } from '../src/lib/placeCategories.js';

test('normalizeUiCategory maps unknown beauty categories to 기타', () => {
  assert.equal(normalizeUiCategory({ category: '미용실' }), '기타');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && node --test tests/placeCategories.test.js`
Expected: FAIL because `placeCategories.js` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
export function normalizeUiCategory(placeLike) {
  const raw = placeLike?.category || '';
  if (raw.includes('미용') || raw.includes('헤어') || raw.includes('네일')) {
    return '기타';
  }
  return raw;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && node --test tests/placeCategories.test.js`
Expected: PASS

### Task 2: Fix hook search routing for 전체 and 기타

**Files:**
- Modify: `apps/frontend/src/hooks/useKakaoPlacesWithLookup.js`
- Modify: `apps/frontend/src/lib/mappers.js`
- Modify: `apps/frontend/src/lib/placeCategories.js`
- Test: `apps/frontend/tests/placeCategories.test.js`

- [ ] **Step 1: Write failing tests for search strategy helpers**

```js
import { getSearchMode } from '../src/lib/placeCategories.js';

test('getSearchMode uses aggregate mode for 전체', () => {
  assert.equal(getSearchMode('전체', ''), 'aggregate-all');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/frontend && node --test tests/placeCategories.test.js`
Expected: FAIL because `getSearchMode` is undefined.

- [ ] **Step 3: Implement the shared helper and hook integration**

```js
if (!keyword && category === '전체') {
  // categorySearch for every known Kakao code + keyword fallback for 기타 seeds
}

if (!keyword && category === '기타') {
  // keywordSearch for beauty / uncategorized seed terms
}
```

- [ ] **Step 4: Run tests to verify helper behavior**

Run: `cd apps/frontend && node --test tests/placeCategories.test.js`
Expected: PASS

### Task 3: Verify the affected frontend surface

**Files:**
- Verify only

- [ ] **Step 1: Run regression tests**

Run: `cd apps/frontend && node --test tests/placeCategories.test.js`
Expected: PASS

- [ ] **Step 2: Run focused lint/build verification**

Run: `cd apps/frontend && npx eslint src/hooks/useKakaoPlacesWithLookup.js src/lib/mappers.js src/lib/placeCategories.js src/pages/Home.jsx src/pages/HomeWeb.jsx src/pages/List.jsx src/pages/ListWeb.jsx`
Expected: PASS

- [ ] **Step 3: Run frontend build**

Run: `cd apps/frontend && npm run build`
Expected: PASS
