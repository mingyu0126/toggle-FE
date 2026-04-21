# Documentation Rules (Toggle)

## 🚨 MANDATORY RULES

1. ALWAYS record today's work in the `daily-log/YYYY-MM-DD.md` file corresponding to the current date. Create it if it doesn't exist.
2. ALWAYS update `handoff/` documentation (e.g., `handoff/README.md`, or specific QA/API docs) to reflect architectural, API, or structural changes.
3. Treat the `daily-log` and `handoff` directories as the single source of truth for the project's state.
4. Record not just what was done, but *why* it was done and what should be done next.

---

## 📝 DAILY LOG STRUCTURE

Each daily log must contain:
- Date and brief summary of the session.
- What was accomplished (features, refactoring, bug fixes).
- Any open issues or TODOs left for the next session.
- Links to relevant updated handoff documents.

---

## 🤝 HANDOFF UPDATES

Whenever you modify:
- APIs or DTOs -> Update API documentation.
- Database / ERD -> Update ERD documents.
- State management / Core Hooks -> Update Frontend or Architecture Hand-off.
- QA Scenarios -> Update QA Hand-off.

NEVER skip documentation steps. Documentation must be committed together with code changes.
