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
- produce structured outputs in `/handoff`

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

---

## 🚨 Global Rules

- NEVER skip PRD step for new features
- NEVER design API without defined scope
- NEVER finalize entity design before ERD/schema review when schema changed
- NEVER implement without considering permissions
- ALWAYS validate role boundaries
- ALWAYS ensure consistency across map/list/detail

---

## 🎯 Execution Policy

When handling a request:

1. Identify intent
2. Select appropriate workflow
3. Execute steps in order
4. Use defined skills
5. Save outputs to correct location

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
