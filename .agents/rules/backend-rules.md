---
trigger: always_on
---

# Backend Rules (Toggle)

## 🚨 MANDATORY RULES

1. NEVER expose entity directly from controller
2. ALWAYS use DTO for request/response
3. ALWAYS separate roles:
   - Guest
   - Member
   - Owner
   - Admin
4. ALWAYS validate input
5. ALWAYS enforce authorization at service layer

---

## 🧱 STACK

- Java 21
- Spring Boot 3.x
- Gradle
- MySQL
- Spring Data JPA
- Spring Security + JWT

---

## 🏗 ARCHITECTURE

- Use domain-based package structure
- Follow:
  - Controller → Service → Repository
- Keep business logic in service layer
- Do not put logic in controller

---

## ⚙️ BACKEND CONFIG POLICY

- `application.yml` MUST use direct fixed values
- DO NOT use `${...}` environment-variable placeholders in backend config
- DO NOT move JWT, datasource, upload path, Kakao API, or National Tax API settings back to env vars unless the user explicitly asks to change this policy
- When backend config values or policy change, update the relevant `handoff/` document and `daily-log` in the same session

---

## 🔐 AUTHORIZATION RULES

- Guest → read-only public access
- Member → personal features only
- Owner → can modify ONLY owned store
- Admin → restricted system access

❗ NEVER allow:
- member to act as owner
- owner to modify other stores
- non-admin to access admin endpoints

---

## 📦 API RULES

- Use RESTful conventions
- Separate read/write APIs when needed
- Use explicit DTOs
- Return consistent error responses

---

## 🧠 DOMAIN RULES (CRITICAL)

### Store Status Enum (FIXED)

```text
OPEN
BREAK_TIME
CLOSED
TEMP_CLOSED
EARLY_CLOSED
