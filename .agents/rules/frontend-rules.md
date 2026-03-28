---
trigger: manual
---

# Frontend Rules (Toggle)

## 🚨 MANDATORY RULES

1. ALWAYS prioritize usability over visual complexity
2. ALWAYS make store status visible at a glance
3. NEVER block guest browsing
4. ALWAYS separate UI and data logic
5. ALWAYS handle loading / empty / error states

---

## 🧱 STACK

- React
- TypeScript
- Vite
- Tailwind CSS

---

## 🏗 STRUCTURE

- Use layered or feature-based structure:
  - app
  - pages
  - widgets
  - features
  - entities
  - shared

- Do not mix business logic inside UI components

---

## 🎯 UX PRINCIPLES

- Mobile-first design
- Fast decision-making is the priority
- Show store status clearly:
  - OPEN
  - BREAK_TIME
  - CLOSED
  - TEMP_CLOSED
  - EARLY_CLOSED

---

## 🔐 AUTH UX RULES

- Guest must access:
  - map
  - search
  - filter
  - store detail

- Login required ONLY for:
  - favorite
  - personal map
  - owner features

- Always show login prompt instead of blocking UI

---

## 🧠 STATE MANAGEMENT

- Separate server state and UI state
- Avoid unnecessary global state
- Keep data flow predictable

---

## 📡 API USAGE

- Do not call API directly inside deeply nested components
- Centralize API logic when possible
- Handle API errors explicitly

---

## 🧼 CODE STYLE

- Prefer small reusable components
- Use explicit types
- Keep components simple and readable
