# Roadmap and Technical Debt

Last updated: 2026-03-14 (DIV-10 codebase health sprint complete)

---

## Completed Work

### Dive Planning Overhaul (March 2026)

All tickets in the "Active Branch — Dive Planning Overhaul" project are done and merged to main.

- **DIV-49** — AI briefing redesign: specificity-enforced JSON schema, prompt constraints, full UI overhaul. Briefings now reason from actual diver inputs rather than generating generic advice.
- **DIV-51** — `calculateRiskLevel()` overhauled to 5-factor weighted scoring (depth, experience, water temp, environment, conditions). Produces Low/Moderate/High/Extreme levels. Lives in `src/features/dive-plan/services/riskCalculator.ts`.
- **DIV-52** — Replaced "Highest cert" single field with full cert chip display on plan form. `resolveHighestCert()` still exists for AI context but is no longer user-facing input.
- **DIV-53** — Temperature/depth-based gear recommendations injected into AI briefing context. `computeGearNotes()` and `parseTempToFahrenheit()` live in `src/services/ai/openaiService.ts`.
- **DIV-8** — Client-side depth/cert/NDL validation on plan form. NDL table and `interpolateNdl()` exported from `riskCalculator.ts`.
- **DIV-6** — Bug fix: highlights section not rendering in AI briefing.
- **DIV-61** — Homepage "Try the planner" stub replaced with sessionStorage redirect to `/dive-plans` (passes region, siteName, unitSystem). No inline briefing generation on homepage.

---

## Current Sprint — Pre-Launch

Tickets in the "Pre-Launch" project. Work through in the prioritized order below.

### Next Up

- **DIV-65** — Full codebase audit (can run in parallel with DIV-66)
- **DIV-66** — Error handling architecture (can run in parallel with DIV-65)
- **DIV-11** — Units system deep audit (after DIV-65/66)

### Group 1 — Schema foundation

- **DIV-42** — Data model audit ✅ **Complete** (migrations 18-21 applied)

### Group 2 — Production infra (parallel with DIV-42)

- **DIV-41** — Production DB provisioning + migration (SQLite → PostgreSQL)
- **DIV-45** — CI/CD pipeline audit + hardening
- **DIV-46** — Auth hardening + additional OAuth providers

### Group 3 — Testing + code health (after DIV-42)

- **DIV-9** — Testing suite baseline coverage ✅ **Complete** (556 tests, 75.84% coverage)
- **DIV-10** — Codebase health sprint ✅ **Complete** (588 tests — see summary below)
- **DIV-65** — Full codebase audit
- **DIV-66** — Error handling architecture
- **DIV-11** — Units system deep audit

### Group 4 — Page overhauls (after DIV-42, can overlap with Group 3)

- **DIV-14** — /certifications page overhaul
- **DIV-13** — /gear page overhaul (scope expanded during DIV-42 to include image upload, serial number, purchase shop, full maintenance history log — see ticket for details)
- **DIV-15** — Dashboard overhaul (blocked by DIV-13 + DIV-14)

### Group 5 — UI polish (after page overhauls)

- **DIV-12** — UI consistency normalization pass

### Group 6 — Marketing surface (after DIV-12 + DIV-42)

- **DIV-17** — Google Places autocomplete for dive plan form
- **DIV-16** — Landing page + /about (includes child DIV-62: homepage planner right panel)

### Group 7 — Right before launch

- **DIV-43** — Asset storage audit + fix
- **DIV-18** — PostHog analytics instrumentation
- **DIV-19** — In-app feedback form → Linear pipeline

---

## Post-Launch Feature Backlog

Features tracked in Linear but deferred until after launch. Reference ticket for full scope.

| Ticket | Feature                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------- |
| DIV-22 | Per-dive gear selection on plan form                                                                                        |
| DIV-23 | First-time user onboarding tour (Shepherd.js)                                                                               |
| DIV-24 | Lifetime gear usage stats                                                                                                   |
| DIV-27 | Export and share dive plans/logs (PDF + public link)                                                                        |
| DIV-29 | Interactive dive map (logged dives + plans as world map pins)                                                               |
| DIV-30 | Dive site bucket list                                                                                                       |
| DIV-31 | Achievement badge system                                                                                                    |
| DIV-32 | Gear maintenance and service tracking (GearServiceLog — schema deferred to DIV-13)                                          |
| DIV-38 | "Diving Soon?" dashboard widget — conditions check for upcoming plans                                                       |
| DIV-39 | Dive computer integration (Garmin/Shearwater/Subsurface import)                                                             |
| DIV-40 | Native mobile app (React Native / Expo)                                                                                     |
| DIV-48 | Dive stats and insights — full analytics experience                                                                         |
| DIV-63 | UI elements unlocked by DIV-42 data model additions (ratings, geo on logs, plan→log convert, isPublic toggles, gear fields) |

---

## DIV-9 Testing Sprint — Completed

556 tests added across 22 files. Coverage baseline: 75.84% statements, 86.62% branches, 88.6% functions. Infrastructure: Vitest 3.2.4, @vitest/coverage-v8, global `server-only` stub, reusable Prisma + NextAuth mock helpers.

**Critical security findings (feed into DIV-10):**

- `diveLogRepository` and `divePlanRepository` have optional `userId` on `findMany`, `update`, `delete` — omitting it returns/modifies ALL users' data with no ownership check
- `findById` on both repositories fetches by `id` only, checks ownership in application code after loading the full record — should use `userId` in WHERE clause like `gearRepository` does
- Session invalidation after password change has no enforcement mechanism — `proxy.ts` is not wired as middleware, so invalidated tokens continue working until JWT expires

**Auth bugs discovered:**

- `readAvatarUrlFromUnknown(user)` in JWT callback is called on the full user object (always an object, never a string) — always returns `undefined`, so credentials users' avatarUrl is never set on initial sign-in
- `authorize()` throws errors instead of returning null — works due to NextAuth's error handling, but differs from documented pattern

**API inconsistencies (feed into DIV-10):**

- Create endpoints return 200 (dive-logs, dive-plans, gear) vs 201 (signup, certifications) — inconsistent
- Signup returns 400 for duplicate email (should be 409 like certifications)
- Dive-plans POST accepts `cachedBriefing` from client without validation — trust boundary issue
- Profile GET creates user records on read (dev resilience code, remove for production)
- User preferences PATCH requires all 4 fields (no partial update), unlike profile PATCH
- Email not trimmed or lowercased in signup — will cause duplicate issues after PostgreSQL migration (DIV-41)
- Unit system detection logic duplicated across 3 route files

**Other findings:**

- N+1 query on GET /api/dive-logs (loads gear per entry via Promise.all)
- `parseDistanceString` regex doesn't match "100ft" (no word boundary between digit and `ft`)
- GET /api/dive-plans hardcoded to `take: 10` with no pagination
- Profile route `select` clause duplicated 4 times (should be a shared constant)

All findings tracked in DIV-10.

---

## DIV-10 Codebase Health Sprint — Completed

Test count: 549 → 588 tests (23 test files). Eight commits across 8 implementation prompts.

**Critical security fixes:**

- `diveLogRepository` and `divePlanRepository`: userId made required on all user-scoped methods (`findById`, `findMany`, `update`, `delete`, `count`, `getStatistics`). Ownership checks moved into Prisma WHERE clause (`findFirst({ where: { id, userId } })`) instead of post-fetch application-code checks.
- Session invalidation now enforced: `session.user` cleared when `token.invalidated` in JWT callback. Chose direct session clearing over wiring `proxy.ts` as middleware.
- Credentials user `avatarUrl` bug fixed: proper cast `(user as unknown as Record<string, unknown>).avatarUrl` in JWT callback.

**Auth performance items deferred to DIV-46:**

- `authorize()` throws errors instead of returning null — works due to NextAuth's error handling but differs from documented pattern. Low-risk, stable behavior. Reassess during DIV-46 auth hardening.

**API correctness:**

- All create endpoints standardized to 201 (dive-logs, dive-plans, gear, gear-kits)
- Signup: 400 → 409 for duplicate email, email normalization (`trim().toLowerCase()`), per-field validation errors
- Dive-plans: Zod schema validation on POST/PUT, `take: 10` → `take: 100`, `preferencesToUnitSystem()` extracted, `cachedBriefing` trust decision documented
- Profile GET: user-creation side effect removed, returns 404 when user not found
- Profile PATCH: normalization extracted to `src/features/profile/utils/normalizeProfile.ts`, `USER_PROFILE_SELECT` and `USER_PROFILE_WITH_KITS_SELECT` constants extracted, JSON array validation added for `primaryDiveTypes`/`typicalDivingEnvironment`/`lookingFor`, re-fetch consolidated into single update call with select
- `NotFoundError` class added (`src/lib/errors.ts`), gear routes use `instanceof NotFoundError` instead of string matching
- Certifications `[id]`: ownership 403 → 404 (resource-doesn't-exist-for-you pattern)

**Code quality:**

- Maintenance date drift fixed: month-end overflow clamped manually, `Math.ceil` → `Math.floor` in `computeMaintenanceStatus`
- `getDisplayName`: firstName/lastName trimmed before display
- `splitFullName`: consolidated — `extractNamesFromGoogleProfile` now delegates to `splitFullName`
- `recomputeDiveNumbersForUser`: updates batched in chunks of 100
- `diveLogRepository.create`/`update`: `n()` helper replaces 60+ `?? null` assignments
- JSDoc added to `parseTempToFahrenheit`, `computeGearNotes`, `humanReadableDuration`, `parseAIBriefing`, `isOldSchema`, account password handler (3 bcrypt calls), account deletion (cascade rationale)

---

## Known Technical Debt

### High priority — Resolved in DIV-10

~~**Profile normalization logic in route handler**~~ — Extracted to `src/features/profile/utils/normalizeProfile.ts`. Route handler now calls `normalizeProfileUpdate(body)` directly.

~~**Duplicated unit system determination logic**~~ — `preferencesToUnitSystem()` extracted to `src/lib/units.ts`, signature widened to accept `UnitPreferences | null | undefined`.

**Direct Prisma usage bypassing repository pattern**
`src/app/api/profile/route.ts` and `src/app/api/certifications/route.ts` query Prisma directly. Auth routes (`signup`) are an acceptable exception. Profile and certifications routes are documented acceptable exceptions per CLAUDE.md — repository migration deferred.

### Medium priority

**Duplicate AppShell components with confusing naming**

- `src/features/auth/components/AppShell.tsx` — public/auth routing logic
- `src/features/app/components/AppShell.tsx` — full authenticated sidebar layout
  Same name, completely different purpose. Rename auth version to `AuthShell.tsx` or consolidate routing into Next.js layout files.

**~~Duplicate unit toggle components~~ (RESOLVED — batch 6b)**
Consolidated: `UnitToggleButtons.tsx` presentational component, `NavbarUnitToggleLocal` deleted, custom `unitSystemChanged` event eliminated. All toggles now use `UnitSystemContext`.

### Low priority

**PublicHomePage wrapper component**
`src/features/public-home/components/PublicHomePage.tsx` is a 13-line wrapper with no logic. Move JSX directly into `src/app/page.tsx`, delete the file.

**Duplicated email validation**
Email regex duplicated across auth routes. Consolidate to `isValidEmail()` in `src/lib/validation.ts` or use Zod's `z.string().email()` consistently.

**`date` fields stored as String on DiveLog and DivePlan**
Both models store date as `String` (e.g. `"2024-06-15"`) rather than `DateTime`. Prevents DB-level date range queries. Tracked as tech debt — changing to `DateTime` is a significant migration. Address post-launch.

**Float pressure/weight fields**
`startPressureBar`, `endPressureBar`, `weightUsedKg` on DiveLog use `Float` while the rest of the schema uses fixed-point integer storage. Low practical impact. Address post-launch.

---

## Schema Additions — DIV-42 Complete

DIV-42 data model audit is complete. All migrations applied (migrations 18-21). The following fields and indexes are now live in the schema:

**DiveLog:** `rating`, `placeId`, `latitude`, `longitude`, `country`, `isPublic`, `divePlanId`, `updatedAt`, `source`
**DivePlan:** `placeId`, `latitude`, `longitude`, `country`, `isPublic`, `updatedAt`, `plannedDate`, `shareToken`
**GearItem:** `condition`, `imageUrl`, `serialNumber`, `purchaseShop`, `serviceIntervalDives`
**User:** `hasCompletedOnboarding`
**CertificationAgency enum:** NAUI, SDI_TDI, BSAC, CMAS, GUE, RAID
**Indexes:** composite `[userId, createdAt]` on DiveLog + DivePlan, `[userId, date]` on DiveLog, `[userId]` on Account + Session

**Deferred (add when feature is implemented):**
`GearServiceLog` model, `BucketListItem`, `UserBadge`, `ConditionsCache`
