# Backend Owner Registration Duplication Design

**Context**

This change targets the backend authentication and owner store-registration flow.

- General user signup must reject duplicate nicknames.
- Owner signup may reuse store name and representative name.
- Owner store registration must reject a Kakao place that is already registered by another owner.

**Scope**

In scope:

- General signup nickname uniqueness
- Owner application map-verification duplicate blocking by Kakao place ID
- Test coverage for the new failure cases

Out of scope:

- Changes to owner signup fields beyond the existing flow
- New admin UI behavior beyond consuming the existing failed verification status
- Deduplication by store name, representative name, phone, or business number across different owners

**Design Summary**

The backend will enforce uniqueness at the domain key that actually identifies each resource.

- User uniqueness for this request is `nickname` for general signup.
- Store uniqueness for owner registration is `KAKAO + placeId`.

For signup, the service will pre-check nickname conflicts and the database will also enforce a unique constraint to close the race window.

For owner store registration, the service will continue using the National Tax Service and Kakao search flow, but after Kakao returns the best candidate and before the application is marked map-verified, the backend will check whether the resolved Kakao place already exists in our store table as a verified store linked to a different owner/application. If so, the map verification will fail immediately with a dedicated failure code and message.

**Architecture**

1. Signup uniqueness

- `AuthService.signup()` keeps the existing email uniqueness check.
- Add nickname conflict detection for general user signup only.
- Add a database-level unique constraint on `users.nickname`.
- Preserve owner signup behavior for store name and representative name: those values remain duplicate-allowed because they are not identity keys in the current model.

2. Store registration duplication

- Keep Kakao candidate selection logic as-is: exact address match first, then store-name narrowing.
- Keep persisting Kakao `place.id` into `stores.external_place_id`.
- Add a duplicate-registration guard in `OwnerApplicationService.runMapVerification()`.
- The guard runs after the best Kakao candidate is chosen and before `application.markMapVerified(verifiedStore)`.
- If the same `external_source + external_place_id` already resolves to a store owned or linked through another owner application, fail the map verification instead of allowing it to proceed to approval.

3. Re-verification rule

- Re-verifying the same application should not fail just because the application already points at the same store.
- The duplicate guard must therefore distinguish:
  - same application reusing the same resolved store: allow
  - different application trying to claim the same Kakao place: fail

**Detailed Behavior**

1. General signup nickname rule

- Apply only when the signup role is `USER`.
- If nickname already exists, return `409 CONFLICT`.
- Recommended error code: `NICKNAME_ALREADY_EXISTS`.
- The service check provides a stable API error.
- The database unique constraint protects concurrent requests.

2. Owner store registration duplicate rule

- National Tax verification still runs first.
- Kakao search still selects the most credible candidate by exact address and name narrowing.
- Once a single Kakao candidate is selected, read its `place.id`.
- Query the local store table by `ExternalSource.KAKAO` and that place ID.
- If no store exists, proceed normally and resolve/store it.
- If a store exists and it is the same store already attached to the current owner application, allow re-verification.
- If a store exists and it belongs to another application/owner link, mark map verification as failed.

Recommended failure contract:

- HTTP status remains success for the owner-application mutation itself, because the request created or updated the application successfully.
- `mapVerificationStatus = FAILED`
- `failureCode = KAKAO_PLACE_ALREADY_REGISTERED`
- failure message example: `이미 다른 점주가 등록한 매장입니다.`

This keeps the failure model aligned with the existing auto-verification pattern where application creation can succeed while verification state becomes failed.

**Persistence Impact**

Tables affected:

- `users`
  - add unique constraint on `nickname`
- `stores`
  - no new column required because `external_place_id` is already stored and uniquely constrained with `external_source`

Repositories likely affected:

- `UserRepository`
  - add nickname existence query
- `StoreRepository`
  - existing `findByExternalSourceAndExternalPlaceId(...)` is sufficient
- If ownership lookup is needed to distinguish same-application vs other-application conflicts, use the existing owner-application and owner-store-link associations rather than adding a new table

**Error Handling**

Signup:

- duplicate email: keep current behavior
- duplicate nickname: add explicit conflict response for general users

Owner application:

- Kakao exact-match not found: keep current behavior
- Kakao ambiguous match: keep current behavior
- Kakao place already registered by another owner: new failed-verification branch

The duplicate-store branch should also leave an audit trail in `MapVerificationHistory` so admins can see why the application was rejected by automation.

**Testing**

Add or update backend tests for:

1. General user signup with duplicate nickname returns `409` and `NICKNAME_ALREADY_EXISTS`.
2. Owner signup is not blocked by duplicate store name or representative name.
3. A second owner application targeting the same Kakao `place.id` results in:
   - application request succeeds
   - `mapVerificationStatus` is `FAILED`
   - error code recorded as `KAKAO_PLACE_ALREADY_REGISTERED`
4. Re-running verification for the same application does not fail on its own previously linked store.

**Implementation Notes**

- Follow the current pattern where verification outcomes are represented on the application aggregate plus history rows.
- Do not add duplicate prevention based on store name, representative name, or raw address text alone.
- Use place ID as the authoritative duplicate key for Kakao-mapped stores.
- Preserve current admin approval logic, but after this change it should almost never be the first place that detects duplicate owner-store claims.

**Acceptance Criteria**

- Two general users cannot sign up with the same nickname.
- Duplicate nickname conflicts are returned deterministically by the API.
- Two different owners cannot complete map verification against the same Kakao place ID.
- The duplicate-owner-store case is visible as a failed map verification in admin review history.
- Re-verifying the same owner application remains possible.
