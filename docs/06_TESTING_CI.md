# Testing and CI/CD

## Test Suite Summary

**556 tests** across **22 test files**
**Coverage:** 75.84% statements | 86.62% branches | 88.6% functions | 75.84% lines
**All thresholds passing** (floors: 30% stmts / 25% branches / 30% funcs / 30% lines)

## Testing Framework

**Runner:** Vitest 3.2.4
**Coverage:** @vitest/coverage-v8 3.2.4
**Environment:** Node (no DOM)
**Config:** `vitest.config.ts`

No jsdom, no React Testing Library, no Playwright/Cypress, no external mock libraries. Tests target server-side code: API route handlers, repositories, services, and pure utility functions. All mocking uses Vitest's built-in `vi.mock()`.

## Test Files

```
src/__tests__/
├── setup.ts                                # Global setup (server-only stub)
├── helpers/
│   ├── mockAuth.ts                         # NextAuth session mock utilities
│   └── mockPrisma.ts                       # Full Prisma client mock
│
│ Pure function tests
├── units.test.ts                           # 69 tests — unit conversions, parsing, formatting
├── riskCalculator.test.ts                  # 40 tests — risk scoring, NDL interpolation, cert resolution
├── parseAIBriefing.test.ts                 # 20 tests — AI briefing JSON parser
├── openaiService.test.ts                   # 65 tests — deterministic AI service functions
├── auth-extract-names.test.ts              # 10 tests — Google OAuth name extraction
├── auth-name.test.ts                       # 20 tests — splitFullName, getDisplayName
├── maintenance.test.ts                     # 22 tests — gear maintenance status + sorting
│
│ API route tests
├── api-signup.test.ts                      # 17 tests — POST /api/auth/signup
├── api-dive-logs.test.ts                   # 29 tests — GET/POST /api/dive-logs (CRUD + gear)
├── api-dive-plans.test.ts                  # 33 tests — GET/POST/PUT/DELETE /api/dive-plans + preview
├── api-profile.test.ts                     # 25 tests — GET/PATCH /api/profile
├── api-certifications.test.ts              # 22 tests — GET/POST + PATCH/DELETE /api/certifications
├── api-certifications-definitions.test.ts  # 4 tests  — GET /api/certifications/definitions
├── api-account.test.ts                     # 14 tests — DELETE /api/account + PUT /api/account/password
├── api-gear.test.ts                        # 21 tests — GET/POST/PUT/DELETE /api/gear
├── api-gear-kits.test.ts                   # 22 tests — GET/POST/PUT/DELETE /api/gear-kits
├── api-me.test.ts                          # 13 tests — GET /api/me + PATCH /api/me/avatar
├── api-user-preferences.test.ts            # 13 tests — GET/PATCH /api/user/preferences
│
│ Repository tests
├── repo-diveLog.test.ts                    # 24 tests — userId scoping, ownership, recompute, stats
├── repo-divePlan.test.ts                   # 17 tests — userId scoping, ownership, type casting
├── repo-gear.test.ts                       # 36 tests — gear/gearKit/diveGear userId scoping
│
│ Auth callback tests
└── auth-callbacks.test.ts                  # 20 tests — credentials authorize, JWT, session callbacks
```

## Vitest Configuration

```typescript
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    setupFiles: ["src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "src/app/api/**/*.ts",
        "src/services/**/*.ts",
        "src/features/**/services/**/*.ts",
        "src/features/**/lib/**/*.ts",
        "src/lib/**/*.ts",
      ],
      exclude: ["src/lib/prisma.ts", "src/**/*.test.ts"],
      thresholds: {
        statements: 30,
        branches: 25,
        functions: 30,
        lines: 30,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

**Coverage thresholds** are floors, not targets. They prevent regression. Ratchet up after DIV-10 when refactoring stabilizes.

Coverage thresholds are only enforced when running `npx vitest run --coverage`. The default `npm run test` (`vitest run`) does NOT enforce thresholds.

## Infrastructure Files

### setup.ts

Stubs `server-only` to allow importing server modules (like `src/lib/prisma.ts`) in the test environment. Runs before every test file.

### helpers/mockAuth.ts

Mocks `"next-auth"` and provides `mockAuthenticated(userId?)` and `mockUnauthenticated()` helpers. All API routes import `getServerSession` from `"next-auth"` (not `"next-auth/next"`).

### helpers/mockPrisma.ts

Complete mock of the Prisma client with `vi.fn()` stubs for every model method used in the codebase. The `$transaction` mock passes a prisma-shaped object to interactive transaction callbacks so `tx.model.method()` calls work correctly inside transactions.

## Running Tests

```bash
npm run test                                    # Run all tests once
npm run test:watch                              # Watch mode
npx vitest run src/__tests__/units.test.ts      # Single file
npx vitest run --coverage                       # With coverage report
npm run check                                   # Full gate: lint → format → typecheck → test → build
```

## CI Workflow

**File:** `.github/workflows/pr-checks.yml`

Steps: checkout → Node 20 → `npm ci` → `npx prisma generate` → lint → format:check → typecheck → test → build

Uses placeholder env vars. No real credentials needed — all external dependencies are mocked.

## Documented Acceptable Gaps

| File/Area                                         | Coverage    | Why acceptable                                                                                                                         |
| ------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `openaiService.ts` async functions                | 58.8% stmts | Make real OpenAI API calls. All 7 deterministic pure functions tested (65 tests). Async wrappers are thin orchestration.               |
| `auth.ts` Google OAuth signIn callback            | 46.5% stmts | 200 lines of OAuth account linking. Complex mock setup, stable code. Credentials authorize + JWT + session callbacks are fully tested. |
| `auth.ts` JWT update trigger path                 | —           | Avatar URL propagation through 3 update shapes. Low-risk, rarely changes.                                                              |
| `profile/route.ts` email-fallback + user-creation | 67.5% stmts | Dev resilience code that creates users on GET. Flagged for removal in DIV-10.                                                          |
| `account/route.ts` transaction interior           | 35.9% stmts | 9-step cascade deletion inside `$transaction`. Auth + error paths tested. Interior runs inside mock boundary.                          |
| `dive-plans/profile-context/route.ts`             | 0%          | Data aggregation route, no mutations. P2 priority, deferred.                                                                           |
| `gear/default-kit/route.ts`                       | 0%          | 28-line simple GET. Low value.                                                                                                         |
| `uploadthing/`                                    | 0%          | SDK wrappers, no custom logic.                                                                                                         |
| `weatherService.ts`                               | 0%          | Unimplemented stub (TODO).                                                                                                             |
| `diveMath.ts`, `validation.ts`                    | 0%          | Empty files.                                                                                                                           |
| `auth/[...nextauth]/route.ts`                     | 0%          | NextAuth catch-all handler, just re-exports.                                                                                           |

## Out of Scope (by design)

| Tool/Approach             | Reason                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| **jsdom / happy-dom**     | Hooks/components deeply coupled to React lifecycle. Pure logic extracted to testable utilities. |
| **React Testing Library** | No component-level tests.                                                                       |
| **Playwright / Cypress**  | E2E deferred to after DIV-10.                                                                   |
| **Real test database**    | Migrating SQLite → PostgreSQL (DIV-41). Mock-based tests verify authorization and data shaping. |
| **MSW**                   | Route handlers are importable functions — direct calls are faster and more precise.             |
