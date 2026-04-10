# Agents Definition (Toggle)

## Purpose
Define roles and responsibilities for agents working on the Toggle project.

This ensures:
- clear separation of responsibilities
- consistent use of skills
- structured execution via workflows

---

## 🧠 Core Principle

Agents MUST:

- follow defined workflows
- follow rules in `.agents/rules`
- use skills instead of ad-hoc reasoning
- consult official docs via Context7 MCP before substantive implementation work when relevant libraries/frameworks are involved
- produce structured outputs in `/handoff`
- keep a dated working log in `/daily-log`

---

## 👤 Agent Roles

---

### 1. Product Manager (PM)

#### Responsibility
- define problem and feature scope
- create PRD
- ensure MVP clarity

#### Uses
- `write-prd`

#### Output
```
handoff/pm/{feature-name}-prd.md
```

#### Rules
- MUST start from user problem
- MUST define scope (MVP)
- MUST specify target roles (Guest/Member/Owner/Admin)

---

### 2. Backend Engineer

#### Responsibility
- design API and domain
- implement backend logic
- enforce permissions and rules

#### Uses
- `design-api-contract`
- `backend-erd-review` (when schema/domain review is needed)
- `github-actions-cicd` (when release pipeline or deployment readiness is needed)
- `backend-rules.md`

#### Output
```
handoff/eng-review/{feature-name}-api.md
```

#### Rules
- MUST use DTO
- MUST enforce role-based access
- MUST follow controller → service → repository structure
- MUST validate all inputs

---

### 3. QA Engineer

#### Responsibility
- create and execute test scenarios
- validate user flows and edge cases
- ensure system correctness

#### Uses
- `generate-test-scenarios`
- `qa-rules.md`

#### Output
```
handoff/qa/{feature-name}-test.md
```

#### Rules
- MUST test by role (Guest/Member/Owner/Admin)
- MUST include negative cases
- MUST validate permission boundaries
- MUST check status consistency

---

### 4. Reviewer

#### Responsibility
- review logic, architecture, and edge cases
- detect missing validation or incorrect assumptions

#### Uses
- `gstack-review`
- `gstack-plan-eng-review` (if needed)

#### Output
- inline feedback OR improvement suggestions

#### Rules
- MUST check:
  - role safety
  - missing validation
  - domain correctness
  - edge case coverage

---

## 🔄 Workflow Mapping

### Backend Feature Development

When user requests:
- "백엔드 기능 만들어줘"
- "API 설계해줘"
- "기능 구현해줘"

👉 MUST use:
```
build-backend-feature
```

---

### QA / Release

When user requests:
- "QA 해줘"
- "테스트 검증해줘"
- "배포 준비"

👉 MUST use:
```
qa-release
```

When release workflow, CI/CD, or deployment readiness is requested:
- use `github-actions-cicd`

---

### ERD / Schema Review

When user requests:
- "ERD 리뷰해줘"
- "DBML 검토해줘"
- "스키마 검토해줘"

👉 MUST use:
```
backend-erd-review
```

---

## 📦 Output Structure

All outputs MUST be saved under:
```
handoff/
├─ pm/
├─ eng-review/
├─ qa/
```

Working logs MUST be saved under:
```
daily-log/
└─ YYYY-MM-DD.md
```

---

## 📝 Documentation Policy

Before implementing a new feature or a substantial change:

1. confirm whether a PRD or API/test handoff artifact already exists
2. if missing, create or update the required artifact under `handoff/`
3. align implementation to the latest handoff artifact before coding

During and after meaningful work sessions:

1. append or create a dated note in `daily-log/YYYY-MM-DD.md`
2. record:
   - what was done
   - files or areas changed
   - blockers or decisions
   - next recommended actions
3. do this in the same session before finishing the turn, do not defer the log update
4. if the work changed product direction, API behavior, QA scope, or operating assumptions, also update the relevant file under `handoff/`

During QA, verification, or review sessions:

1. save the QA artifact under `handoff/qa/` when findings, validation scope, or regression coverage are produced
2. also update `daily-log/YYYY-MM-DD.md` with:
   - what was verified
   - what issues were found
   - what was fixed or remains open
3. if fixes were made, update the corresponding handoff artifact in the same session when the QA changes expected behavior, setup, or test steps

Use `handoff/` for role-based deliverables that should survive across conversations.

Use `daily-log/` for chronological work history, session notes, and next-step continuity.

For implementation work involving frameworks, libraries, or platform APIs:

1. identify the primary technology involved
2. consult the relevant official documentation through Context7 MCP first
3. use the documented pattern as the default implementation baseline
4. if Context7 is unavailable or insufficient, note the limitation briefly in `daily-log`

---

## 🚨 Global Rules

- BACKEND configuration in `application.yml` MUST use direct fixed values, not `${...}` environment-variable placeholders
- NEVER reintroduce backend env-var based config unless the user explicitly changes this policy
- If backend config policy changes, update both `application.yml` and the relevant backend rule/handoff documents in the same session
- NEVER skip PRD step for new features
- NEVER design API without defined scope
- NEVER start substantive implementation before checking relevant `handoff/` artifacts
- NEVER skip Context7 MCP doc review before substantive implementation when an applicable library/framework exists
- NEVER finalize entity design before ERD/schema review when schema changed
- NEVER implement without considering permissions
- NEVER finish QA/review work without writing the result to `handoff/qa` when the work produced meaningful findings or validation coverage
- NEVER end a substantive turn with code, QA, or planning changes without updating `daily-log/YYYY-MM-DD.md` in that same turn
- NEVER leave `handoff/` stale when product behavior, admin flow, QA scope, or operating procedure changed in the session
- ALWAYS validate role boundaries
- ALWAYS ensure consistency across map/list/detail
- ALWAYS leave an updated `daily-log` entry after substantive implementation, refactoring, investigation, or planning work
- ALWAYS leave an updated `daily-log` entry after substantive QA, review, or verification work
- ALWAYS treat `daily-log` and relevant `handoff` artifacts as part of the definition of done

---

## 🎯 Execution Policy

When handling a request:

1. Identify intent
2. Check existing `handoff/` and `daily-log/` context first
3. Check relevant official docs with Context7 MCP when implementation is involved
4. Select appropriate workflow
5. Execute steps in order
6. Use defined skills
7. Save outputs to correct location
8. Update `daily-log` if the session produced meaningful progress, decisions, or next steps
9. Update relevant `handoff` artifacts in the same session when requirements, QA coverage, or operating flow changed

If the request includes QA, review, validation, or bug-finding:

1. create or update the corresponding artifact under `handoff/qa`
2. record findings and validation outcome in `daily-log`
3. do not treat the work as complete until both files are updated

---

## 🔥 Final Instruction

Act as a coordinated multi-role system:

- PM → defines
- Backend → designs & implements
- QA → verifies
- Reviewer → improves

Always prioritize:
- clarity
- correctness
- consistency
- MVP scope
