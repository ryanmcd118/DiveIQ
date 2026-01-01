# Roadmap and Technical Debt

## Current Status

UNVERIFIED - placeholder section for project status tracking.

## Known Issues

## Technical Debt

## Debt & Refactor Candidates

### 1. Over-Componentization: PublicHomePage Wrapper

**Issue**: `src/features/public-home/components/PublicHomePage.tsx` (13 lines) is a thin wrapper that only renders 7 child components in a div. No state, no logic, no props.

**Why it matters**:

- Adds unnecessary indirection (one more file to navigate)
- The page component in `src/app/page.tsx` could render these directly
- Component serves no abstraction purpose

**Suggested fix**:

- Move the JSX directly into `src/app/page.tsx` Server Component
- Remove `PublicHomePage.tsx` wrapper
- Keep child components (HeroSection, FeatureTrio, etc.) as-is

**Impact/risk**:

- **Impact**: Low - improves code clarity, reduces file count
- **Risk**: Very low - no behavior change, just moves JSX up one level
- **Files affected**: `src/app/page.tsx`, `src/features/public-home/components/PublicHomePage.tsx` (delete)

**Cited from**: `src/features/public-home/components/PublicHomePage.tsx:13-26`

---

### 2. Over-Componentization: Duplicate AppShell Components

**Issue**: Two different `AppShell` components with confusing naming:

- `src/features/auth/components/AppShell.tsx` - Handles public/auth routing logic, renders simple nav
- `src/features/app/components/AppShell.tsx` - Full sidebar/topbar layout for authenticated app

**Why it matters**:

- Same name, different purposes - confusing for developers
- `auth/components/AppShell.tsx` has routing logic that might belong in layout
- Creates ambiguity about which AppShell to use

**Suggested fix**:

- Rename `src/features/auth/components/AppShell.tsx` to `AuthAppShell.tsx` or `PublicAppShell.tsx`
- Or consolidate routing logic into Next.js layout files (recommended)
- Keep `src/features/app/components/AppShell.tsx` as the main authenticated shell

**Impact/risk**:

- **Impact**: Medium - improves naming clarity, reduces confusion
- **Risk**: Low - requires updating imports in layout files
- **Files affected**: `src/features/auth/components/AppShell.tsx` (rename), layout files that import it

**Cited from**:

- `src/features/auth/components/AppShell.tsx:15-74`
- `src/features/app/components/AppShell.tsx:12-74`
- Comparison shows different purposes (public/auth routing vs sidebar layout)

---

### 3. Over-Componentization: Duplicate Unit Toggle Components

**Issue**: Two nearly identical unit toggle components:

- `src/components/NavbarUnitToggle.tsx` - Uses global context (`useUnitSystem`)
- `src/components/NavbarUnitToggleLocal.tsx` - Uses local state + localStorage + custom events

**Why it matters**:

- 70 lines of near-duplicate code (only state management differs)
- Both render identical JSX (lines 14-35 vs 47-68)
- Maintains two code paths for same UI behavior

**Suggested fix**:

- Extract shared JSX into a `UnitToggleButtons` component
- Both components use the shared buttons, just pass different state handlers
- Or consolidate to single component that accepts state management as prop/context

**Impact/risk**:

- **Impact**: Medium - reduces duplication, easier to maintain styling/behavior
- **Risk**: Low - refactor maintains same behavior, just shared implementation
- **Files affected**: `src/components/NavbarUnitToggle.tsx`, `src/components/NavbarUnitToggleLocal.tsx`

**Cited from**:

- `src/components/NavbarUnitToggle.tsx:10-37` (uses context)
- `src/components/NavbarUnitToggleLocal.tsx:11-70` (uses local state, nearly identical JSX)

---

### 4. Under-Structure: Duplicated Unit System Determination Logic

**Issue**: Unit system determination logic duplicated in two route handlers:

- `src/app/api/dive-plans/route.ts:45-52` (POST handler)
- `src/app/api/dive-plans/preview/route.ts:29-36` (POST handler)

**Logic** (duplicated):

```typescript
const unitSystem: UnitSystem = body.unitPreferences
  ? body.unitPreferences.depth === "m" &&
    body.unitPreferences.temperature === "c" &&
    body.unitPreferences.pressure === "bar" &&
    body.unitPreferences.weight === "kg"
    ? "metric"
    : "imperial"
  : "metric";
```

**Why it matters**:

- Business logic duplicated across files
- Changes require updating two places (easy to miss one)
- Hard to test in isolation

**Suggested fix**:

- Extract to utility function: `src/lib/units.ts` → `preferencesToUnitSystem(preferences: UnitPreferences | undefined): UnitSystem`
- Both routes import and use the shared function
- Add unit test for the function

**Impact/risk**:

- **Impact**: Medium - eliminates duplication, improves testability
- **Risk**: Very low - pure function extraction, no behavior change
- **Files affected**: `src/lib/units.ts` (add function), `src/app/api/dive-plans/route.ts`, `src/app/api/dive-plans/preview/route.ts`

**Cited from**:

- `src/app/api/dive-plans/route.ts:45-52`
- `src/app/api/dive-plans/preview/route.ts:29-36`
- Identical logic in both files

---

### 5. Under-Structure: Profile Normalization Logic in Route Handler

**Issue**: `src/app/api/profile/route.ts` PATCH handler contains 400+ lines of normalization logic (lines 336-739):

- String normalization (trim, empty → null)
- Website URL normalization (prepend https://)
- JSON array parsing/validation
- Complex conditional updates

**Why it matters**:

- Route handler becomes hard to read and test
- Business logic mixed with HTTP handling
- Can't reuse normalization logic elsewhere

**Suggested fix**:

- Extract normalization functions to `src/features/profile/utils/normalizeProfile.ts` or `src/lib/profileValidation.ts`
- Functions: `normalizeProfileFields()`, `normalizeWebsiteUrl()`, etc.
- Route handler imports and calls normalization functions
- Add unit tests for normalization functions

**Impact/risk**:

- **Impact**: High - significantly improves route handler readability, enables testing
- **Risk**: Low - extract pure functions, route handler becomes orchestrator
- **Files affected**: `src/app/api/profile/route.ts` (reduce from 400+ to ~100 lines), new normalization utility file

**Cited from**: `src/app/api/profile/route.ts:336-739` (PATCH handler with extensive normalization)

---

### 6. Under-Structure: Duplicated Email Validation

**Issue**: Email validation regex duplicated:

- `src/app/api/auth/signup/route.ts:22-23` - Email regex validation
- Potential duplication in other routes (UNVERIFIED - check other auth-related routes)

**Why it matters**:

- Validation logic scattered
- Regex changes require finding all occurrences
- Inconsistent validation across routes

**Suggested fix**:

- Add email validation to `src/lib/validation.ts` (or create if minimal):
  - Function: `isValidEmail(email: string): boolean`
  - Or use Zod schema: `emailSchema = z.string().email()`
- Update routes to use shared validation
- Consider using Zod schemas consistently (only 2 routes currently use Zod)

**Impact/risk**:

- **Impact**: Low-Medium - improves consistency, easier to maintain
- **Risk**: Very low - simple function extraction
- **Files affected**: `src/lib/validation.ts`, `src/app/api/auth/signup/route.ts`

**Cited from**: `src/app/api/auth/signup/route.ts:22-28` (email regex validation)

---

### 7. Under-Structure: Direct Prisma Usage in Routes (Already Documented)

**Issue**: Some routes bypass repository pattern and query Prisma directly:

- `src/app/api/profile/route.ts:57-107` (GET handler)
- `src/app/api/certifications/route.ts:84-93, 134-159`
- `src/app/api/auth/signup/route.ts:39-61`

**Why it matters**:

- Inconsistent data access pattern (some use repositories, some don't)
- Harder to test (requires mocking Prisma vs repository)
- Business logic leaks into routes

**Suggested fix**:

- Create `userRepository` for user operations
- Create `certificationRepository` for certification operations (if not exists)
- Migrate routes to use repositories
- Keep signup route direct Prisma (auth concern, acceptable exception)

**Impact/risk**:

- **Impact**: Medium - improves consistency, testability
- **Risk**: Medium - requires creating repositories, migrating logic
- **Files affected**: New repository files, route handlers

**Cited from**: `docs/03_BACKEND.md:513-523` (already documented)

**Note**: Lower priority - repositories exist for core entities, these are edge cases.

---

## Proposed Refactor Plan (Incremental, Max 5 Steps)

### Step 1: Extract Unit System Determination Utility

**Action**: Create `preferencesToUnitSystem()` function in `src/lib/units.ts`

**Why first**: Smallest change, high value (eliminates duplication), pure function (easy to test)

**Files**:

- `src/lib/units.ts` - Add function
- `src/app/api/dive-plans/route.ts` - Use function
- `src/app/api/dive-plans/preview/route.ts` - Use function
- `src/__tests__/units.test.ts` - Add test

**Time estimate**: 30 minutes

---

### Step 2: Extract Email Validation Utility

**Action**: Add `isValidEmail()` to `src/lib/validation.ts` (or create file)

**Why second**: Quick win, establishes validation utility pattern

**Files**:

- `src/lib/validation.ts` - Add function (create if doesn't exist)
- `src/app/api/auth/signup/route.ts` - Use function

**Time estimate**: 15 minutes

---

### Step 3: Extract Profile Normalization Functions

**Action**: Extract normalization logic from profile route to `src/features/profile/utils/normalizeProfile.ts`

**Why third**: High impact (reduces route handler from 400+ to ~100 lines), but larger change

**Files**:

- `src/features/profile/utils/normalizeProfile.ts` - New file with functions
- `src/app/api/profile/route.ts` - Use functions, reduce to orchestration
- `src/__tests__/profile-normalize.test.ts` - Add tests (optional but recommended)

**Time estimate**: 1-2 hours

---

### Step 4: Consolidate Unit Toggle Components

**Action**: Extract shared JSX into `UnitToggleButtons` component, both toggle components use it

**Why fourth**: Reduces duplication, easier to maintain styling

**Files**:

- `src/components/UnitToggleButtons.tsx` - New shared component
- `src/components/NavbarUnitToggle.tsx` - Use shared component
- `src/components/NavbarUnitToggleLocal.tsx` - Use shared component

**Time estimate**: 45 minutes

---

### Step 5: Remove PublicHomePage Wrapper

**Action**: Move JSX from `PublicHomePage.tsx` directly into `src/app/page.tsx`

**Why last**: Simplest change, but requires verifying page.tsx usage

**Files**:

- `src/app/page.tsx` - Add JSX directly
- `src/features/public-home/components/PublicHomePage.tsx` - Delete file
- Update imports if any other files reference PublicHomePage

**Time estimate**: 15 minutes

---

**Total estimated time**: 2.5-4 hours

**Order rationale**: Start with smallest, highest-value changes (unit system utility), work up to larger refactors (profile normalization), end with simplest cleanup (remove wrapper).

## Planned Features

## Architecture Improvements

## Performance Optimizations

## Refactoring Opportunities

## Dependency Updates

## Documentation Gaps

---

Last verified against commit:
