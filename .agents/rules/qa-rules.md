---
trigger: always_on
---

# QA Rules (Toggle)

## 🚨 MANDATORY RULES

1. ALWAYS test real user flows
2. ALWAYS test by role:
   - Guest
   - Member
   - Owner
   - Admin
3. ALWAYS include:
   - happy path
   - edge cases
   - negative cases
4. NEVER skip permission testing

---

## 🎯 CORE TEST AREAS

You MUST test:

1. Map browsing
2. Store list
3. Store detail
4. Status filtering
5. Favorites
6. Personal maps
7. Owner status update
8. Admin features

---

## 🔐 PERMISSION CHECKS (CRITICAL)

- Guest cannot access member features
- Member cannot access owner features
- Owner cannot modify other stores
- Non-admin cannot access admin APIs

Expected:
- 401 Unauthorized
- 403 Forbidden

---

## 🔁 STATUS CONSISTENCY (CRITICAL)

Whenever store status changes:

You MUST verify consistency across:

- Map
- List
- Detail

❗ All must show the SAME latest status

---

## 🧪 STATUS TRANSITION TESTS

Allowed:

- OPEN → BREAK_TIME
- OPEN → CLOSED
- OPEN → EARLY_CLOSED
- OPEN → TEMP_CLOSED
- BREAK_TIME → OPEN
- CLOSED → OPEN

Invalid:
- Must return 409 Conflict

---

## 🌐 EMPTY & ERROR STATES

You MUST test:

- No stores in range
- No search results
- No favorites
- No maps
- Private map access denied
- Deleted store access
- API failure handling

---

## ⭐ FAVORITE RULES

- Duplicate favorite must be prevented
- Deleted store must be handled gracefully

---

## 🗺 MAP RULES

- Guest can always browse map
- Filters must work correctly
- Status filter must be accurate

---

## 👤 OWNER RULES

- Owner can update only owned store
- Status update must reflect immediately
- Invalid update must fail properly

---

## 🛡 ADMIN RULES

- Only admin can access admin features
- Moderation must affect visibility correctly

---

## 🔁 REGRESSION CHECKS

Always verify:

- status display
- permission boundaries
- favorite behavior
- map visibility
