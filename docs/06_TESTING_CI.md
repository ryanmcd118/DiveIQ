# Testing and CI/CD

## Testing Framework

**Runner:** Vitest 3.2.4 (`vitest` in devDependencies)
**Coverage:** @vitest/coverage-v8 3.2.4 (`@vitest/coverage-v8` in devDependencies)
**Environment:** Node (no DOM — server-side only)
**Config:** `vitest.config.ts`

No jsdom, no React Testing Library, no Playwright/Cypress. Tests target server-side code: API route handlers, repositories, services, and pure utility functions.

## Dependencies

From `package.json` devDependencies:

| Package               | Version | Purpose              |
| --------------------- | ------- | -------------------- |
| `vitest`              | ^3.2.4  | Test runner          |
| `@vitest/coverage-v8` | ^3.2.4  | V8 coverage provider |

No other testing-specific dependencies. Tests use `vi.mock()` for all mocking — no external mock libraries.

## Vitest Configuration

`vitest.config.ts` — full breakdown:

```typescript
export default defineConfig({
  test: {
    environment: "node", // No DOM APIs — tests run in Node
    include: ["src/__tests__/**/*.test.ts"], // Only *.test.ts files in __tests__/
    setupFiles: ["src/__tests__/setup.ts"], // Global setup — runs before every test file
    coverage: {
      provider: "v8", // Built-in V8 coverage (no extra binary)
      reporter: ["text", "json-summary", "lcov"], // Terminal + CI artifact + dashboard-ready
      include: [
        // Only measure server-side source files
        "src/app/api/**/*.ts",
        "src/services/**/*.ts",
        "src/features/**/services/**/*.ts",
        "src/features/**/lib/**/*.ts",
        "src/lib/**/*.ts",
      ],
      exclude: [
        "src/lib/prisma.ts", // Singleton — always mocked, never executed
        "src/**/*.test.ts", // Don't count test files as covered source
      ],
      thresholds: {
        // Floor values — fail if coverage drops below
        statements: 30,
        branches: 25,
        functions: 30,
        lines: 30,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Matches tsconfig paths
    },
  },
});
```

**Coverage thresholds** are floors, not targets. They prevent regression — if a commit drops coverage below these values, `vitest run` fails. Thresholds will be ratcheted up after each testing phase as coverage improves.

Note: Coverage thresholds are only enforced when running `vitest run --coverage`. The default `npm run test` (`vitest run`) does NOT enforce thresholds. To run with coverage locally: `npx vitest run --coverage`.

## Current Test Suite: 20 files, 514 tests

## Test File Organization

```
src/__tests__/
├── setup.ts                                # Global setup (runs before every test file)
├── helpers/
│   ├── mockAuth.ts                         # NextAuth session mock utilities
│   └── mockPrisma.ts                       # Full Prisma client mock
├── units.test.ts                           # 69 tests — all exported functions from src/lib/units.ts
├── auth-extract-names.test.ts              # 10 tests — imports real function from auth.ts
├── riskCalculator.test.ts                  # 40 tests — all score functions + interpolateNdl + integration
├── parseAIBriefing.test.ts                 # 20 tests — AI briefing JSON parser
├── openaiService.test.ts                   # 65 tests — deterministic AI service functions
├── api-signup.test.ts                      # 17 tests — POST /api/auth/signup
├── api-dive-logs.test.ts                   # 29 tests — GET/POST /api/dive-logs (CRUD + gear)
├── api-dive-plans.test.ts                  # 33 tests — GET/POST/PUT/DELETE /api/dive-plans + preview
├── api-profile.test.ts                     # 25 tests — GET/PATCH /api/profile
├── api-certifications.test.ts              # 22 tests — GET/POST + PATCH/DELETE /api/certifications
├── api-account.test.ts                     # 14 tests — DELETE /api/account + PUT /api/account/password
├── api-gear.test.ts                        # 21 tests — GET/POST/PUT/DELETE /api/gear
├── api-gear-kits.test.ts                   # 22 tests — GET/POST/PUT/DELETE /api/gear-kits
├── api-me.test.ts                          # 13 tests — GET /api/me + PATCH /api/me/avatar
├── api-user-preferences.test.ts            # 13 tests — GET/PATCH /api/user/preferences
├── repo-diveLog.test.ts                    # 24 tests — diveLogRepository userId scoping + ownership
├── repo-divePlan.test.ts                   # 17 tests — divePlanRepository userId scoping + ownership
├── repo-gear.test.ts                       # 36 tests — gear/gearKit/diveGear repositories
├── auth-callbacks.test.ts                  # 20 tests — credentials authorize + JWT/session callbacks
└── api-certifications-definitions.test.ts  # 4 tests  — GET /api/certifications/definitions
```

### What each test file covers

**units.test.ts** (69 tests): depth/distance conversions (metric + imperial), temperature conversions, pressure conversions (psi/bar + input/display), weight conversions (lb/kg + input/display), safety stop display, canonical-to-UI helpers, getUnitLabel, formatting helpers, legacy conversion functions, string parsing (parseTemperatureString, parseDistanceString), and range formatting (formatTemperatureRange, formatDistanceRange).

**riskCalculator.test.ts** (40 tests): resolveHighestCert (cert tier matching), scoreDepthVsCert (depth vs cert limit ratios), scoreEnvironment (keyword detection), scoreExperienceGap (date-based and string-based), scoreDiveCount (count-based and range-based), interpolateNdl (exact boundaries, interpolation, clamping), scoreNdlProximity, and calculateRiskLevel integration scenarios.

**auth-extract-names.test.ts** (10 tests): imports the real `extractNamesFromGoogleProfile` function from `src/features/auth/lib/auth.ts` (no longer duplicated). Tests given_name/family_name extraction, full name splitting, compound names, fallbacks, and edge cases.

**openaiService.test.ts** (65 tests): deterministic functions exported from `src/services/ai/openaiService.ts` — `parseTempToFahrenheit` (Celsius/Fahrenheit parsing, ranges, averages, edge cases), `computeGearNotes` (exposure protection recommendations by temperature threshold, site-specific gear like dive lights and SMBs, gear adequacy comparison against logged gear, cold water regulator warning), `getFallbackBriefing` (shape validation, metric/imperial depth display, site/month inclusion), `humanReadableDuration` (days/weeks/months/years formatting, future dates, null handling), `buildSystemPrompt` (unit system instructions, JSON schema, cert rules), `buildUserPrompt` (plan data inclusion, profile/manual experience sections, gear formatting, update flag), and `buildGearList` (nickname/manufacturer/model/type-only formatting). Does NOT test `generateDivePlanBriefing` or other async functions that call OpenAI.

**parseAIBriefing.test.ts** (20 tests): AI briefing JSON parser — valid complete briefings, missing/empty sections, condition card parsing (badge validation, non-object inputs), old schema detection (conditionsSnapshot/quickLook/sections/whatMattersMost), markdown code fence stripping, error cases (malformed JSON, empty string, empty object). Covers all code paths in the parser including the `.slice(0, 3)` cap on keyConsiderations and non-string-to-string coercion.

**api-certifications-definitions.test.ts** (4 tests): GET route with mocked Prisma — response shape, sorting, agency filtering, error handling.

### Naming convention

- Pure function tests: `{module}.test.ts` (e.g., `units.test.ts`, `riskCalculator.test.ts`)
- API route tests: `api-{resource}.test.ts` (e.g., `api-dive-logs.test.ts`)
- Repository tests: `repo-{name}.test.ts` (e.g., `repo-diveLog.test.ts`)

## Infrastructure Files

### setup.ts

```typescript
vi.mock("server-only", () => ({}));
```

**Why it exists:** `src/lib/prisma.ts` imports `server-only`, a Next.js package that throws `"This module cannot be imported from a Client Component module"` at import time outside of a server context. Every file that imports `prisma` (directly or transitively) would fail to load in tests without this stub. The global setup ensures all test files get this mock automatically.

### helpers/mockAuth.ts

Provides `mockAuthenticated()` and `mockUnauthenticated()` helpers for API route tests. Mocks `"next-auth"` so that `getServerSession()` returns a controlled session object or null. All API routes import `getServerSession` from `"next-auth"` (not `"next-auth/next"`), so the mock must target that module path.

**Usage in a test file:**

```typescript
import { mockAuthenticated, mockUnauthenticated } from "./helpers/mockAuth";

beforeEach(() => {
  vi.clearAllMocks();
});

it("returns 401 when not authenticated", async () => {
  await mockUnauthenticated();
  const response = await GET(new NextRequest("http://localhost/api/resource"));
  expect(response.status).toBe(401);
});

it("returns data when authenticated", async () => {
  await mockAuthenticated("user-123");
  // ... test logic
});
```

The mock uses `vi.mock("next-auth/next")` at the module level and dynamic `import()` inside the helper functions. This pattern works because Vitest hoists `vi.mock()` calls to the top of the file regardless of where they appear.

### helpers/mockPrisma.ts

Provides a complete mock of the Prisma client (`@/lib/prisma`) with `vi.fn()` stubs for every model method used in the codebase. Tests import this file to activate the mock, then use `vi.mocked()` to set return values for specific methods.

**Why `$transaction` passes a full mock object:** Several routes and repositories use Prisma interactive transactions:

```typescript
await prisma.$transaction(async (tx) => {
  await tx.gearKit.updateMany({ ... });
  return tx.gearKit.update({ ... });
});
```

If `$transaction` passed an empty `{}` as the `tx` argument, `tx.gearKit.updateMany` would throw `TypeError: Cannot read properties of undefined`. The mock passes a prisma-shaped object with `vi.fn()` stubs so transaction callbacks execute without errors.

For batch transactions (array of promises), the mock calls `Promise.all(fn)`.

**Usage in a test file:**

```typescript
import "./helpers/mockPrisma";
import { prisma } from "@/lib/prisma";

vi.mocked(prisma.diveLog.findMany).mockResolvedValue([mockDiveLog]);
```

Note: Tests that already define their own `vi.mock("@/lib/prisma")` (like `api-certifications-definitions.test.ts`) will use their local mock, not the helper. Vitest scopes `vi.mock()` per test file — the last call wins within a file.

## Running Tests

```bash
npm run test                                    # Run all tests once (vitest run)
npm run test:watch                              # Watch mode (vitest)
npx vitest run src/__tests__/units.test.ts      # Single test file
npx vitest run --coverage                       # Run with coverage report + threshold enforcement
npm run check                                   # Full quality gate: lint → format → typecheck → test → build
```

## CI Workflow

**File:** `.github/workflows/pr-checks.yml`

**Triggers:** Pull requests and pushes to `main`/`master`

**Steps:**

1. Checkout → Setup Node 20 → `npm ci` → `npx prisma generate`
2. `npm run lint`
3. `npm run format:check`
4. `npm run typecheck`
5. `npm run test` (runs `vitest run` — all tests must pass)
6. `npm run build`

**Environment:** Placeholder values for `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `OPENAI_API_KEY`. No real credentials needed — all external dependencies are mocked in tests.

**Coverage in CI:** `npm run test` runs `vitest run` without the `--coverage` flag, so coverage thresholds are NOT enforced in CI currently. This is intentional during the baseline phase — thresholds will be wired into CI after Phase 2 when coverage is high enough to be meaningful.

## What Is Explicitly Out of Scope

| Tool/Approach                     | Why excluded                                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **jsdom / happy-dom**             | Hooks and components are deeply coupled to React lifecycle. The pure logic worth testing is extracted into utilities and services that run in Node. Adding a DOM environment adds complexity without proportional value. |
| **React Testing Library**         | Same reasoning. No component-level tests.                                                                                                                                                                                |
| **Playwright / Cypress**          | E2E deferred to after DIV-10 (codebase health sprint). Writing E2E now would create tests that break immediately during refactoring.                                                                                     |
| **Real test database**            | App is migrating from SQLite to PostgreSQL (DIV-41). Testing against SQLite tests the wrong engine. Repositories are thin wrappers — mock-based tests verify authorization and data shaping.                             |
| **prisma-mock / other mock libs** | `vi.mock()` with manual stubs is sufficient for the repository complexity. No library needed.                                                                                                                            |
| **MSW (Mock Service Worker)**     | Route handlers are importable functions — no need to intercept at the HTTP level. Direct function calls with mocked dependencies are faster and more precise.                                                            |

## Phased Implementation Plan

### Phase 1 — Infrastructure + Pure Functions (current)

- Install `@vitest/coverage-v8`
- Create `vitest.config.ts` with coverage, setup, includes
- Create `setup.ts`, `helpers/mockAuth.ts`, `helpers/mockPrisma.ts`
- Expand `units.test.ts` (pressure, weight, parse/format functions)
- Expand `riskCalculator.test.ts` (interpolateNdl boundaries)
- Fix `auth-extract-names.test.ts` (import real function via server-only mock)
- Add `parseAIBriefing.test.ts`
- Add `openaiService.test.ts` (deterministic functions only)

### Phase 2 — P1 API Route Tests

- `api-signup.test.ts` (validation, uniqueness, happy path)
- `api-dive-logs.test.ts` (CRUD actions, auth, gear associations)
- `api-dive-plans.test.ts` (create with AI, update, delete, depth conversion)
- `api-profile.test.ts` (GET fallbacks, PATCH validation/normalization)
- `api-certifications.test.ts` (POST duplicate detection, GET ordering)
- `api-account-password.test.ts` (bcrypt flow, sessionVersion increment)
- `api-account-delete.test.ts` (cascade transaction)

### Phase 3 — Repositories + Auth Callbacks

- `repo-diveLog.test.ts` (CRUD, authorization, recomputeDiveNumbers, getStatistics)
- `repo-divePlan.test.ts` (CRUD, authorization, type casting)
- `repo-gear.test.ts` (gear + kit + dive-gear repositories)
- `auth-callbacks.test.ts` (JWT callback sessionVersion, session callback)

### Phase 4 — P2 Routes

- Remaining route tests: gear, gear-kits, me, user/preferences, certifications/[id]
- Ratchet coverage thresholds up to reflect actual coverage
- Wire `--coverage` into CI

## Debugging Common Failures

### Prettier

```bash
npm run format:check    # See what's wrong
npm run format          # Auto-fix
```

### TypeScript

```bash
npm run typecheck       # Full type check
```

### ESLint

```bash
npm run lint            # Check
npm run lint:fix        # Auto-fix
```

Config: `eslint.config.mjs`. `@typescript-eslint/no-explicit-any` disabled for test files and scripts.

### Tests

```bash
npm run test                                  # Run all
npx vitest run src/__tests__/units.test.ts    # Single file
npm run test:watch                            # Watch mode
```

Common issues: mock setup incorrect, `@/` alias not resolving (check vitest.config.ts alias), missing `vi.clearAllMocks()` in `beforeEach`.

### Build

```bash
npm run build
```

If build fails after typecheck passes, likely causes: missing env vars, Prisma client not generated (`npx prisma generate`).
