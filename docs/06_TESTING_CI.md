# Testing and CI/CD

## npm run check - Complete Quality Check

**Script location**: `package.json:20`

**Command**: `npm run check`

**What it does**: Runs all quality checks in sequence (stops on first failure):

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build
```

**Steps in order**:

1. **Lint** (`npm run lint`) - Runs ESLint (`package.json:12`)
   - Command: `eslint`
   - Checks code style and potential errors
   - Config: `eslint.config.mjs`

2. **Format Check** (`npm run format:check`) - Checks Prettier formatting (`package.json:15`)
   - Command: `prettier --check .`
   - Verifies code is formatted (doesn't fix)
   - Config: `.prettierrc`

3. **Type Check** (`npm run typecheck`) - TypeScript type checking (`package.json:17`)
   - Command: `tsc --noEmit`
   - Validates types without emitting files
   - Config: `tsconfig.json`

4. **Tests** (`npm run test`) - Runs test suite (`package.json:18`)
   - Command: `vitest run`
   - Runs all tests once (not watch mode)
   - Config: `vitest.config.ts`

5. **Build** (`npm run build`) - Next.js production build (`package.json:9`)
   - Command: `next build`
   - Ensures code compiles and builds successfully

**Use case**: Run before committing to verify all checks pass locally.

## Local vs CI Checks

### Local Development Commands

**Available in `package.json` scripts**:

- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Auto-fix linting errors (`package.json:13`)
- `npm run format:check` - Check Prettier formatting
- `npm run format` or `npm run format:write` - Auto-format code (`package.json:14, 16`)
- `npm run typecheck` - Type check only
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode (`package.json:19`)
- `npm run build` - Production build
- `npm run check` - Run all checks (lint, format, typecheck, test, build)

### CI Workflow

**Workflow file**: `.github/workflows/pr-checks.yml`

**Triggers**:

- Pull requests to `main` or `master` (line 4-5)
- Pushes to `main` or `master` (line 6-7)

**CI steps** (`.github/workflows/pr-checks.yml:18-46`):

1. **Checkout** (line 19)
2. **Setup Node.js 20** (line 21-25)
3. **Install dependencies** - `npm ci` (line 27-28)
4. **Generate Prisma client** - `npx prisma generate` (line 30-31)
5. **Run linter** - `npm run lint` (line 33-34)
6. **Check formatting** - `npm run format:check` (line 36-37)
7. **Type check** - `npm run typecheck` (line 39-40)
8. **Run tests** - `npm run test` (line 42-43)
9. **Build** - `npm run build` (line 45-46)

**CI environment variables** (line 12-17):

- `DATABASE_URL: "file:./prisma/dev.db"` (placeholder)
- `NEXTAUTH_SECRET: "placeholder-secret-for-build-check-only"`
- `NEXTAUTH_URL: "http://localhost:3000"`
- `OPENAI_API_KEY: "sk-placeholder"`

**Note**: CI uses placeholder values - tests don't need real credentials, just need code to compile/build.

### Differences

**Same checks**: Local `npm run check` and CI run identical commands.

**CI adds**:

- `npm ci` (clean install)
- `npx prisma generate` (generates Prisma client)

**CI uses**: Placeholder environment variables (no real secrets needed for build/typecheck).

## Canary Tests

### Test Location

**Test directory**: `src/__tests__/`

**Test files** (3 total):

1. **`units.test.ts`** - Unit conversion utility tests
2. **`auth-extract-names.test.ts`** - Google OAuth name extraction tests
3. **`api-certifications-definitions.test.ts`** - API route integration test

### Test Framework

**Vitest** (`package.json:53`) - Vite-based test runner

**Config**: `vitest.config.ts`

- Environment: `node` (line 6)
- Path alias: `@` → `./src` (line 9-10)

### Test Coverage

**1. Unit Conversion Tests** (`src/__tests__/units.test.ts`)

**What it covers**:

- Depth/distance conversions (metric: meters ↔ cm, imperial: feet ↔ cm)
- Temperature conversions (metric: Celsius ↔ C×10, imperial: Fahrenheit ↔ C×10)
- Input conversion helpers (`depthInputToCm`, `tempInputToCx10`)
- Display formatting (`displayDepth`, `displayTemperature`)
- Unit system consistency (`unitSystemToPreferences`, `preferencesToUnitSystem`)

**Test pattern**: Pure function tests - no mocks, no side effects.

**Example**:

```typescript
it("converts meters to centimeters correctly", () => {
  expect(metersToCm(10)).toBe(1000);
  expect(metersToCm(1.5)).toBe(150);
});
```

**2. Auth Helper Tests** (`src/__tests__/auth-extract-names.test.ts`)

**What it covers**:

- Google OAuth profile name extraction
- Handles `given_name`/`family_name` fields
- Falls back to splitting `name` field
- Edge cases: single names, compound last names, empty strings, whitespace trimming

**Test pattern**: Pure function tests (function duplicated in test file - cannot import from `auth.ts` due to `server-only` dependency).

**Note**: Test duplicates the function implementation (`src/__tests__/auth-extract-names.test.ts:5-43`) because `src/features/auth/lib/auth.ts` has `server-only` import.

**3. API Route Test** (`src/__tests__/api-certifications-definitions.test.ts`)

**What it covers**:

- GET `/api/certifications/definitions` endpoint
- Response shape validation
- Sorting logic (by category, levelRank, name)
- Agency filtering via query params
- Error handling

**Test pattern**: Integration test with mocked Prisma client.

**Mocking**:

```typescript
vi.mock("@/lib/prisma", () => ({
  prisma: {
    certificationDefinition: {
      findMany: vi.fn(),
    },
  },
}));
```

### How to Add the Next 5 Tests

**Recommended test additions** (based on existing patterns):

**1. Risk Calculator Test** (`src/features/dive-plan/services/riskCalculator.ts`)

- **Location**: `src/__tests__/risk-calculator.test.ts`
- **Pattern**: Pure function test (like `units.test.ts`)
- **Cover**: `calculateRiskLevel()` function with various depth/time combinations
- **Example**:

```typescript
import { calculateRiskLevel } from "@/features/dive-plan/services/riskCalculator";

describe("Risk Calculator", () => {
  it("returns High for deep/long dives", () => {
    expect(calculateRiskLevel(45, 60)).toBe("High");
  });
  // ... more cases
});
```

**2. Validation Utilities Test** (`src/lib/validation.ts`)

- **Location**: `src/__tests__/validation.test.ts`
- **Pattern**: Pure function test
- **Cover**: Validation helper functions (if they exist)

**3. Dive Math Test** (`src/lib/diveMath.ts`)

- **Location**: `src/__tests__/dive-math.test.ts`
- **Pattern**: Pure function test
- **Cover**: Dive calculation functions (NDL, etc.)

**4. API Route Test - Dive Logs GET** (`src/app/api/dive-logs/route.ts`)

- **Location**: `src/__tests__/api-dive-logs-get.test.ts`
- **Pattern**: Integration test with mocked Prisma (like `api-certifications-definitions.test.ts`)
- **Cover**: GET endpoint, filtering, error handling
- **Mock**: `diveLogRepository`, `diveGearRepository`

**5. Repository Test - DiveLogRepository** (`src/services/database/repositories/diveLogRepository.ts`)

- **Location**: `src/__tests__/dive-log-repository.test.ts`
- **Pattern**: Unit test with mocked Prisma client
- **Cover**: Repository methods (create, findById, findMany, update, delete, getStatistics)
- **Mock**: `prisma.diveLog` methods

**Test file naming convention**: `*.test.ts` (matches existing files).

**Test structure**:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Feature/Function Name", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // For tests with mocks
  });

  it("does something specific", () => {
    expect(actual).toBe(expected);
  });
});
```

## Debugging Common CI Failures

### Prettier Failures

**Error**: `npm run format:check` fails with formatting errors

**Debug locally**:

```bash
# Check what's wrong
npm run format:check

# Auto-fix
npm run format:write
# or
npm run format
```

**Common causes**:

- Trailing commas
- Quote style (single vs double)
- Line length (80 chars - `.prettierrc:7`)
- Missing semicolons

**Fix**: Run `npm run format:write` and commit the changes.

**Prettier config**: `.prettierrc` (uses `prettier-plugin-tailwindcss`)

### TypeScript (tsc) Failures

**Error**: `npm run typecheck` fails with type errors

**Debug locally**:

```bash
# Run typecheck
npm run typecheck

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

**Common causes**:

- Missing type definitions
- Type mismatches
- Strict mode violations (`tsconfig.json:7` - `strict: true`)
- Missing imports

**Fix**: Address type errors shown in output. TypeScript config is strict mode.

### ESLint Failures

**Error**: `npm run lint` fails with linting errors

**Debug locally**:

```bash
# Check errors
npm run lint

# Auto-fix what can be fixed
npm run lint:fix
```

**Common causes**:

- Unused variables
- Missing dependencies in useEffect
- React hooks violations
- TypeScript `any` usage (disabled for test files - `eslint.config.mjs:22-24`)

**ESLint config**: `eslint.config.mjs`

- Uses `eslint-config-next` (core-web-vitals + TypeScript)
- Prettier integration (disables conflicting rules)
- Test files: `@typescript-eslint/no-explicit-any` disabled
- Scripts: `@typescript-eslint/no-explicit-any` disabled

**Fix**: Address errors manually if `lint:fix` doesn't resolve them.

### Test Failures

**Error**: `npm run test` fails

**Debug locally**:

```bash
# Run tests once
npm run test

# Run in watch mode (reruns on file changes)
npm run test:watch

# Run specific test file
npx vitest run src/__tests__/units.test.ts
```

**Common causes**:

- Test assertions failing (logic errors)
- Mock setup incorrect
- Import path issues (check `@/` alias)
- Missing test data

**Vitest config**: `vitest.config.ts`

- Node environment (not jsdom - no DOM APIs)
- Path alias `@` resolves to `./src`

**Fix**:

1. Check test output for specific failing assertions
2. Verify mocks are set up correctly (for API/repository tests)
3. Run in watch mode to iterate faster

### Build Failures

**Error**: `npm run build` fails

**Debug locally**:

```bash
# Try building
npm run build

# Check for specific errors in output
```

**Common causes**:

- Type errors (should be caught by `typecheck`)
- Missing environment variables (check `.env` or `.env.local`)
- Next.js build errors (missing pages, invalid routes)
- Prisma client not generated (`npx prisma generate`)

**Fix**:

1. Run `npm run typecheck` first (catches type errors)
2. Ensure Prisma client is generated: `npx prisma generate`
3. Check Next.js build output for specific errors

## Testing Rules of Thumb

### Unit Tests (Pure Functions)

**When to use**: Test pure functions with no side effects

**Examples**:

- `src/lib/units.ts` - Unit conversion functions ✅ (tested in `units.test.ts`)
- `src/features/dive-plan/services/riskCalculator.ts` - Risk calculation ✅ (not tested yet)
- `src/lib/diveMath.ts` - Dive math calculations ✅ (not tested yet)
- `src/lib/validation.ts` - Validation helpers ✅ (not tested yet)

**Pattern**:

- No mocks needed
- Test inputs → expected outputs
- Test edge cases (null, 0, negative numbers, etc.)

**Location**: `src/__tests__/feature-name.test.ts`

### Unit Tests (Functions with Dependencies)

**When to use**: Test functions that use external dependencies (Prisma, APIs)

**Examples**:

- Repository methods (`diveLogRepository`, `divePlanRepository`) ✅ (not tested yet)
- Service functions with database access

**Pattern**:

- Mock external dependencies (`vi.mock()`)
- Test function logic, not external dependencies
- Example: `api-certifications-definitions.test.ts` mocks Prisma

**Location**: `src/__tests__/repository-name.test.ts` or `src/__tests__/service-name.test.ts`

### Integration Tests (API Routes)

**When to use**: Test API route handlers end-to-end

**Examples**:

- API route handlers (`src/app/api/**/route.ts`) ✅ (one example: `api-certifications-definitions.test.ts`)

**Pattern**:

- Mock database/Prisma
- Test request → response flow
- Test error cases
- Test authorization (if applicable)

**Location**: `src/__tests__/api-route-name.test.ts`

**Current example**: `src/__tests__/api-certifications-definitions.test.ts`

- Mocks Prisma client
- Tests GET endpoint
- Tests query params, sorting, error handling

### What NOT to Test (Current Approach)

**Not tested** (and likely shouldn't be):

- React components (no React Testing Library setup)
- Client-side hooks (would need jsdom environment)
- E2E flows (no Playwright/Cypress setup)
- Database migrations (tested via Prisma)
- Next.js pages (tested via build step)

**Focus areas** (based on existing tests):

- ✅ Pure utility functions (units, calculations)
- ✅ API routes (with mocked dependencies)
- ✅ Repository methods (with mocked Prisma)
- ❌ React components (no setup)
- ❌ Client hooks (no jsdom)
- ❌ E2E flows (no framework)

### Test Coverage Strategy

**Current state**: 3 test files covering:

- Unit conversions (comprehensive)
- Auth helper function (comprehensive)
- One API route (certifications definitions)

**Gaps** (based on codebase):

- Repository methods (none tested)
- Most API routes (only 1 of ~15 tested)
- Business logic services (risk calculator, dive math)
- Validation utilities

**Recommendation**: Add tests incrementally for:

1. Critical business logic (risk calculator, unit conversions - ✅ done)
2. API routes that handle user data (dive logs, dive plans, profile)
3. Repository methods (data access layer)

---

Last verified against commit:
