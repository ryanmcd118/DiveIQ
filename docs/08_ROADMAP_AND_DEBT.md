# Roadmap and Technical Debt

Last updated: 2026-03-14 (DIV-42 data model audit session)

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

### In Progress

- **DIV-42** — Data model audit (schema gaps, indexes, migrations). **Blocks:** DIV-9, DIV-13, DIV-14, DIV-17.

### Group 1 — Schema foundation

- **DIV-42** — Data model audit _(in progress)_

### Group 2 — Production infra (parallel with DIV-42)

- **DIV-41** — Production DB provisioning + migration (SQLite → PostgreSQL)
- **DIV-45** — CI/CD pipeline audit + hardening
- **DIV-46** — Auth hardening + additional OAuth providers

### Group 3 — Testing + code health (after DIV-42)

- **DIV-9** — Testing suite baseline coverage
- **DIV-10** — Codebase health sprint: error handling, boundary violations, N+1 queries
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

## Known Technical Debt

### High priority (address during DIV-10 codebase health sprint)

**Profile normalization logic in route handler**
`src/app/api/profile/route.ts` PATCH handler contains 400+ lines of normalization logic (string trimming, URL normalization, JSON array parsing). Should be extracted to `src/features/profile/utils/normalizeProfile.ts`. Makes route handler untestable in its current state.

**Duplicated unit system determination logic**
Identical logic duplicated in `src/app/api/dive-plans/route.ts:45-52` and `src/app/api/dive-plans/preview/route.ts:29-36`. Extract to `preferencesToUnitSystem()` in `src/lib/units.ts`.

**Direct Prisma usage bypassing repository pattern**
`src/app/api/profile/route.ts` and `src/app/api/certifications/route.ts` query Prisma directly. Auth routes (`signup`) are an acceptable exception and should not be refactored. The others should be migrated to repositories as part of DIV-10.

### Medium priority

**Duplicate AppShell components with confusing naming**

- `src/features/auth/components/AppShell.tsx` — public/auth routing logic
- `src/features/app/components/AppShell.tsx` — full authenticated sidebar layout
  Same name, completely different purpose. Rename auth version to `AuthShell.tsx` or consolidate routing into Next.js layout files.

**Duplicate unit toggle components**
`NavbarUnitToggle.tsx` (uses global context) and `NavbarUnitToggleLocal.tsx` (uses localStorage + custom events) share nearly identical JSX. Extract shared buttons to `UnitToggleButtons.tsx`.

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

## Schema Additions Pending (DIV-42)

The following fields are approved for addition via DIV-42 migrations. Not yet implemented — pending DIV-41 PostgreSQL migration completion.

**DiveLog:** `rating`, `placeId`, `latitude`, `longitude`, `country`, `isPublic`, `divePlanId`, `updatedAt`
**DivePlan:** `placeId`, `latitude`, `longitude`, `country`, `isPublic`, `updatedAt`
**GearItem:** `condition`, `imageUrl`, `serialNumber`, `purchaseShop`, `serviceIntervalDives`
**User:** `hasCompletedOnboarding`
**CertificationAgency enum:** NAUI, SDI_TDI, BSAC, CMAS, GUE, RAID
**Indexes:** composite `[userId, createdAt]` on DiveLog + DivePlan, `[userId, date]` on DiveLog, `[userId]` on Account + Session

**Deferred (add when feature is implemented):**
`DivePlan.plannedDate`, `DivePlan.shareToken`, `DiveLog.source`, `GearServiceLog` model, `BucketListItem`, `UserBadge`, `ConditionsCache`
