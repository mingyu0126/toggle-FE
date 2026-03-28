---
trigger: always_on
---

# Frontend Rules (Toggle)

## 🚨 MANDATORY RULES

1. ALWAYS preserve guest-first browsing for map, list, search, filter, and detail
2. ALWAYS make store status easy to recognize in map, list, and detail views
3. ALWAYS keep mobile routes and web routes behaviorally consistent
4. ALWAYS separate presentation, page composition, and reusable UI concerns
5. ALWAYS handle loading, empty, error, and login-required states explicitly
6. NEVER introduce a new UI pattern that breaks the current CSS Modules based structure without a strong reason

---

## 🧱 ACTUAL STACK

- React
- JavaScript (ES modules, JSX)
- Vite
- React Router
- CSS Modules
- `react-kakao-maps-sdk`
- mock data driven development during early MVP

❗ Current project is NOT using:
- TypeScript
- Tailwind CSS

Follow the existing codebase unless the user explicitly asks for a migration.

---

## 🏗 CURRENT PROJECT STRUCTURE

Current frontend structure is centered around:
- `src/pages`
- `src/components/common`
- `src/components/home`
- `src/constants`
- `src/mocks`
- `src/styles`

Rules:
- Put route-level screen composition in `src/pages`
- Put reusable UI pieces in `src/components/common`
- Put route-specific shared UI in route-focused component folders such as `src/components/home`
- Put enum-like UI mappings and shared constants in `src/constants`
- Put temporary local fixture data in `src/mocks`
- Keep global tokens and layout primitives in `src/styles/index.css`

---

## 📱 RESPONSIVE MODEL

Toggle currently uses two presentation modes:
- mobile app-like routes wrapped with `MobileFrame`
- desktop/web dedicated routes such as `HomeWeb`, `StoreWeb`, `LandingWeb`

Rules:
- When adding a major user-facing feature, decide whether it affects:
  - mobile only
  - web only
  - both
- If both are required, keep user flow and domain meaning aligned even if layout differs
- Do not ship a web-only interpretation that changes core permissions or status behavior from mobile
- Reuse shared components before duplicating page logic

---

## 🎯 UX PRINCIPLES

- Fast decision-making is the top priority
- Status must be scannable before secondary metadata
- Map, list, and detail must tell the same story
- Search and location actions should feel immediate
- Login should be prompted at the action boundary, not before exploration

For store status, use the standardized product values:
- `OPEN`
- `BREAK_TIME`
- `CLOSED`
- `TEMP_CLOSED`
- `EARLY_CLOSED`

If the frontend keeps legacy local names, do not expand them further. Prefer converging new code toward the standardized values.

---

## 🗺 MAP AND SEARCH RULES

- Never block map rendering behind authentication
- Keep Kakao Map interactions inside page/container logic, not deep inside low-level reusable components
- Search suggestions, selected place state, and current location state must be predictable and easy to trace
- Marker click, list click, and detail navigation should not disagree on selected place identity
- Do not scatter raw Kakao API access across unrelated files

---

## 🔐 AUTH UX RULES

Guest must be able to access:
- landing
- map
- search
- filter
- list
- store detail
- public map viewing

Login is required only for:
- favorite actions
- personal map creation or editing
- saved place actions
- owner tools
- admin tools

Rules:
- show login modal/prompt at action time
- avoid redirecting guests away from browse flows unless the page is truly protected
- keep role-specific UI hidden or disabled when role is unavailable

---

## 🧠 STATE MANAGEMENT RULES

- Keep transient UI state local to the page when possible
- Lift state only when multiple siblings need the same source of truth
- Do not create global state prematurely for temporary mock-driven flows
- Server data shape, UI display shape, and third-party map state should be conceptually separated
- Derived display values such as labels, badge colors, and category names should come from constants/helpers, not repeated inline literals

---

## 📡 DATA AND API RULES

- During MVP mock stage, isolate fake data under `src/mocks`
- When replacing mocks with API calls, keep page behavior stable first and swap data source second
- Centralize fetch logic before the number of API calls spreads across many pages
- Do not call APIs directly inside tiny presentational components like badges, buttons, or cards
- Normalize backend enum values before rendering if the frontend still contains older aliases

---

## 🎨 STYLING RULES

- Use CSS Modules for component and page styles
- Use `src/styles/index.css` for global tokens, resets, and layout primitives
- Reuse existing design tokens before inventing one-off values
- Preserve the current mobile-frame pattern unless the whole navigation model changes
- Favor consistent spacing, status colors, and card patterns over page-by-page reinvention

---

## 🧩 COMPONENT RULES

- Keep common components generic and reusable
- Keep page components focused on composition, routing, and state orchestration
- Do not embed large business rules directly inside purely visual components
- If mobile and web screens share the same domain action, prefer shared helpers or shared common components over copy-paste divergence

---

## 🧪 FRONTEND QA RULES

Every frontend feature should be checked for:
- guest access behavior
- mobile route behavior
- web route behavior when applicable
- status consistency across map, list, and detail
- empty state rendering
- login-required action prompts
- broken navigation paths

---

## 🧼 CODE STYLE

- Prefer small readable components over giant route files
- Use clear prop names tied to domain meaning
- Remove commented-out dead code when the final direction is clear
- Keep JSX readable and avoid deeply nested ternaries
- Add brief comments only when map/event logic is otherwise hard to follow