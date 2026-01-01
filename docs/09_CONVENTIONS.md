# Conventions

This document defines the coding conventions currently followed (or should be followed) in this repository. All conventions are derived from existing code patterns.

## Folder/Module Structure Conventions

### Top-Level Structure

```
src/
├── app/                    # Next.js App Router (pages and API routes)
├── features/              # Feature-based modules
├── components/            # Shared/reusable UI components
├── lib/                   # Shared utilities and libraries
├── services/              # External services and data access
├── contexts/              # React context providers
├── hooks/                 # Shared React hooks
├── styles/                # CSS Modules and design system
└── types/                 # Global type definitions
```

**Cited from**: Repository structure (see `docs/00_OVERVIEW.md` for detailed map)

### Feature Module Structure

**Standard structure** (`src/features/{feature-name}/`):
```
features/{feature}/
├── components/           # Feature-specific components
├── hooks/               # Feature-specific hooks
├── types.ts             # Feature-specific types
├── services/            # Feature-specific business logic (optional)
├── lib/                 # Feature-specific utilities (optional)
└── utils/               # Feature-specific helpers (optional)
```

**Examples**:
- `src/features/dive-log/` - Has `components/`, `hooks/`, `types.ts`
- `src/features/dive-plan/` - Has `components/`, `hooks/`, `types.ts`, `services/`
- `src/features/profile/` - Has `components/`, `types.ts`, `utils/`

**Cited from**: Directory structure (`list_dir` results)

### When to Use Each Directory

**`src/features/{feature}/`**:
- Feature-specific code that belongs to a domain area (dive logs, dive plans, gear, etc.)

**`src/components/`**:
- Shared components used across 2+ features
- Examples: `Avatar`, `Toast`, `ConfirmModal`, `UnitToggle`

**`src/lib/`**:
- Shared utilities used across features
- Examples: `units.ts`, `prisma.ts`, `validation.ts`, `diveMath.ts`

**`src/services/`**:
- External service integrations (OpenAI, weather APIs, etc.)
- Database repositories (data access layer)

**Cited from**: Codebase structure and usage patterns

## Naming Conventions

### Components

**PascalCase**, descriptive names:
- `DiveLogForm.tsx`
- `PlanPageContent.tsx`
- `DashboardPageContent.tsx`
- `CertificationCard.tsx`

**Props interface**: `{ComponentName}Props`
```typescript
interface DiveLogFormProps {
  formKey: string;
  activeEntry: DiveLogEntry | null;
  // ...
}
```

**Cited from**: 
- `src/features/dive-log/components/DiveLogForm.tsx`
- `src/features/dive-plan/components/PlanPageContent.tsx`

### Hooks

**camelCase**, prefix with `use`:
- `useLogPageState.ts`
- `usePlanPageState.ts`
- `useAuth.ts`
- `useMe.ts`

**Cited from**: 
- `src/features/dive-log/hooks/useLogPageState.ts`
- `src/features/dive-plan/hooks/usePlanPageState.ts`
- `src/features/auth/hooks/useAuth.ts`

### Route Handlers

**HTTP method names** (Next.js App Router convention):
- `GET(req: NextRequest)`
- `POST(req: NextRequest)`
- `PATCH(req: NextRequest)`
- `PUT(req: NextRequest)`
- `DELETE(req: NextRequest)`

**File location**: `src/app/api/{resource}/route.ts`

**Cited from**: 
- `src/app/api/dive-logs/route.ts`
- `src/app/api/profile/route.ts`
- `src/app/api/certifications/route.ts`

### Types and Interfaces

**PascalCase**:
- `DiveLogEntry`
- `PlanInput`
- `PastPlan`
- `AIBriefing`

**Type files**: `types.ts` (co-located with feature)

**Input types**: Suffix with `Input` when representing API input
- `DiveLogInput`
- `PlanInput`
- `CreateUserCertificationInput`

**Response types**: Suffix with `Response` when representing API response
- `DiveLogApiResponse`
- `PlanApiResponse`

**Cited from**: 
- `src/features/dive-log/types.ts`
- `src/features/dive-plan/types.ts`
- `src/features/certifications/types.ts`

### Validation Schemas

**Zod schemas**: camelCase with `Schema` suffix
- `createUserCertificationSchema`
- `updateUserCertificationSchema`

**Location**: Feature `types.ts` file (when using Zod)

**Type inference**: `z.infer<typeof schema>` for TypeScript types
```typescript
export type CreateUserCertificationInput = z.infer<
  typeof createUserCertificationSchema
>;
```

**Cited from**: `src/features/certifications/types.ts:6-21`

### Repositories

**camelCase** with `Repository` suffix, export as const object:
```typescript
export const diveLogRepository = {
  async create(...) { ... },
  async findById(...) { ... },
  // ...
};
```

**Examples**:
- `diveLogRepository`
- `divePlanRepository`
- `gearRepository`
- `gearKitRepository`

**Location**: `src/services/database/repositories/{resource}Repository.ts`

**Cited from**: 
- `src/services/database/repositories/diveLogRepository.ts:9`
- `src/services/database/repositories/divePlanRepository.ts:13`

### Service Functions

**camelCase**, descriptive function names:
- `generateDivePlanBriefing()`
- `generateUpdatedDivePlanBriefing()`
- `calculateRiskLevel()`

**Location**: `src/services/{service}/` or `src/features/{feature}/services/`

**Cited from**: 
- `src/services/ai/openaiService.ts:332`
- `src/features/dive-plan/services/riskCalculator.ts`

## Where Validation Lives

### Current Patterns (Inconsistent)

**Pattern 1: Zod schemas in feature types** (2 routes use this):
- Location: `src/features/{feature}/types.ts`
- Example: `src/features/certifications/types.ts:6-17`
- Usage: `safeParse()` in route handlers
- Example route: `src/app/api/certifications/route.ts:73`

**Pattern 2: Manual validation in route handlers** (most routes):
- Location: Route handler file
- Example: `src/app/api/auth/signup/route.ts:10-36`
- Pattern: Type assertions + manual checks (regex, length, etc.)

**Recommendation**: **Standardize on Pattern 1 (Zod schemas in types.ts)**

**Cited from**: 
- Pattern 1: `src/features/certifications/types.ts:6-17`, `src/app/api/certifications/route.ts:73`
- Pattern 2: `src/app/api/auth/signup/route.ts:10-36`

### Validation Schema Location

**When using Zod** (recommended):
- Define schemas in feature `types.ts` file
- Export both schema and inferred type
- Import schema in route handler for validation

**Example**:
```typescript
// src/features/{feature}/types.ts
export const createSomethingSchema = z.object({ ... });
export type CreateSomethingInput = z.infer<typeof createSomethingSchema>;

// src/app/api/{resource}/route.ts
import { createSomethingSchema } from "@/features/{feature}/types";
const result = createSomethingSchema.safeParse(body);
```

**Cited from**: `src/features/certifications/types.ts` pattern

## Where Business Logic Lives (and Must NOT Live)

### ✅ Where Business Logic SHOULD Live

**1. Repositories** (`src/services/database/repositories/`):
- Data access operations (CRUD)
- Query construction
- Ownership/authorization checks

**Cited from**: `src/services/database/repositories/diveLogRepository.ts`

**2. Services** (`src/services/` or `src/features/{feature}/services/`):
- External API integrations
- Complex business logic calculations
- Feature-specific business rules

**Examples**:
- `src/services/ai/openaiService.ts` - OpenAI API calls
- `src/features/dive-plan/services/riskCalculator.ts` - Risk calculation

**Cited from**: Service file locations

**3. Utility Libraries** (`src/lib/`):
- Pure utility functions
- Unit conversions
- Math calculations

**Examples**:
- `src/lib/units.ts` - Unit conversion
- `src/lib/diveMath.ts` - Dive calculations

**Cited from**: `src/lib/` directory

### ❌ Where Business Logic MUST NOT Live

**1. Route Handlers** (`src/app/api/*/route.ts`):
- Should only orchestrate: auth → validate → service/repository → response
- Current violations:
  - `src/app/api/profile/route.ts:336-739` - 400+ lines of normalization logic
  - `src/app/api/certifications/route.ts:96-131` - Duplicate detection logic
  - `src/app/api/dive-plans/route.ts:45-52` - Unit conversion logic

**Recommendation**: Extract complex logic to services or utilities

**Cited from**: `docs/03_BACKEND.md:285-297` (boundary issues)

**2. Client Components**:
- Should only handle UI state and user interactions
- Business logic should be in hooks or services

## Error Handling Pattern

### API Route Error Handling

**Standard pattern**:
```typescript
try {
  // ... logic ...
  return NextResponse.json({ data }, { status: 200 });
} catch (err) {
  console.error("Route name error", err);
  return NextResponse.json(
    { error: "Human-readable error message" },
    { status: 400 | 401 | 404 | 409 | 500 }
  );
}
```

**Error response shape**:
```typescript
NextResponse.json(
  { error: "Human-readable error message" },
  { status: 400 | 401 | 404 | 409 | 500 }
);
```

**Status codes used**:
- `400` - Bad request (validation errors, missing fields)
- `401` - Unauthorized (no session or invalid session)
- `404` - Not found (resource doesn't exist)
- `409` - Conflict (duplicate resource, etc.)
- `500` - Internal server error

**With validation details** (Zod routes):
```typescript
if (!validationResult.success) {
  return NextResponse.json(
    { error: "Invalid input", details: validationResult.error.issues },
    { status: 400 }
  );
}
```

**Cited from**: 
- `src/app/api/dive-logs/route.ts:60-65`
- `src/app/api/certifications/route.ts:74-78`
- `docs/03_BACKEND.md:183-211` (error handling conventions)

### Error Logging

**Pattern**: Log with route name for context
```typescript
console.error("GET /api/dive-logs error", err);
```

**Cited from**: `src/app/api/dive-logs/route.ts:61`

### Generic Error Messages

**Current practice**: Catch blocks return generic messages (good for security, harder to debug)

**Example**:
```typescript
catch (err) {
  console.error("Signup error:", err);
  return NextResponse.json(
    { error: "Failed to create account" },
    { status: 500 }
  );
}
```

**Cited from**: `src/app/api/auth/signup/route.ts:74-79`

## Data Access Pattern (Prisma Usage Boundaries)

### Preferred Pattern: Repository Layer

**All data access should go through repositories** (`src/services/database/repositories/`)

**Repository interface**:
```typescript
export const resourceRepository = {
  async create(data: Input, userId?: string): Promise<Output> { ... },
  async findById(id: string, userId?: string): Promise<Output | null> { ... },
  async findMany(options?: { userId?: string; take?: number }): Promise<Output[]> { ... },
  async update(id: string, data: Input, userId?: string): Promise<Output> { ... },
  async delete(id: string, userId?: string): Promise<void> { ... },
};
```

**Authorization**: Repositories check `userId` ownership

**Cited from**: 
- `src/services/database/repositories/diveLogRepository.ts:9-145`
- `docs/03_BACKEND.md:215-252`

### Current Inconsistency: Direct Prisma Usage

**Some routes bypass repositories** (violation of pattern):
- `src/app/api/profile/route.ts:57-107` - Direct Prisma queries
- `src/app/api/certifications/route.ts:84-93, 134-159` - Direct Prisma
- `src/app/api/auth/signup/route.ts:39-61` - Direct Prisma (acceptable exception for auth)

**Recommendation**: Migrate to repositories where possible (except auth routes, which may stay direct)

**Cited from**: `docs/03_BACKEND.md:513-523` (direct Prisma usage)

### Prisma Client Access

**Singleton pattern**: `src/lib/prisma.ts`
```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ ... });
```

**Usage**: Import from `@/lib/prisma` (never instantiate new PrismaClient)

**Cited from**: `src/lib/prisma.ts:8-12`

## Testing Conventions

### Test File Location

**Tests live in**: `src/__tests__/`

**Naming**: `*.test.ts`

**Examples**:
- `src/__tests__/units.test.ts`
- `src/__tests__/auth-extract-names.test.ts`
- `src/__tests__/api-certifications-definitions.test.ts`

**Cited from**: Test file locations

### Test Naming

**Test structure**:
```typescript
describe("Feature/Function Name", () => {
  it("does something specific", () => {
    expect(actual).toBe(expected);
  });
});
```

**Cited from**: `src/__tests__/units.test.ts:20`

### What to Mock vs Not Mock

**Do NOT mock** (pure function tests):
- Unit conversion functions
- Math/calculation utilities
- Pure business logic functions

**Example**: `src/__tests__/units.test.ts` - No mocks, tests pure functions

**DO mock** (integration/API tests):
- Prisma client
- External services (OpenAI, etc.)
- Repository methods (if testing route handlers)

**Example**: `src/__tests__/api-certifications-definitions.test.ts`
```typescript
vi.mock("@/lib/prisma", () => ({
  prisma: {
    certificationDefinition: {
      findMany: vi.fn(),
    },
  },
}));
```

**Cited from**: 
- `src/__tests__/units.test.ts` (no mocks)
- `src/__tests__/api-certifications-definitions.test.ts:7-13` (mocked Prisma)

### Test Patterns

**1. Pure function tests** (no mocks):
- Test inputs → expected outputs
- Test edge cases

**2. Integration tests** (with mocks):
- Mock external dependencies (Prisma, APIs)
- Test function logic, not external dependencies

**Cited from**: `docs/06_TESTING_CI.md:240-280` (testing rules of thumb)

## Styling Conventions

### CSS Modules

**File naming**: `ComponentName.module.css` (co-located with component)

**Import pattern**:
```typescript
import styles from "./ComponentName.module.css";
```

**Usage in JSX**:
```typescript
<div className={styles.container}>
  <button className={styles.button}>Click</button>
</div>
```

**Cited from**: Component files (e.g., `src/features/dive-log/components/DiveLogForm.tsx`)

### Shared Styles

**Shared component styles**: `src/styles/components/`

**Import pattern**:
```typescript
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
```

**Usage**:
```typescript
<div className={cardStyles.card}>
  <form className={formStyles.form}>...</form>
</div>
```

**Cited from**: Component files using shared styles

### Design System

**Design tokens**: `src/styles/design-system/tokens.css`
- CSS custom properties (variables)
- Colors, spacing, typography scales

**Typography**: `src/styles/design-system/typography.css`

**Utilities**: `src/styles/design-system/utilities.css`

**Usage**: Reference tokens in component styles
```css
.container {
  padding: var(--space-4);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
}
```

**Cited from**: `docs/02_FRONTEND.md:171-189` (styling approach)

### CSS Composition

**Use `composes` for variants**:
```css
.primary {
  composes: base;
  background-color: var(--color-accent-primary);
}
```

**Cited from**: `docs/02_FRONTEND.md:180-188` (CSS composition)

### Global Styles

**Location**: `src/app/globals.css`

**Imported in**: Root layout (`src/app/layout.tsx:3`)

**Contains**: Base HTML/body styles, design system imports

**Cited from**: `src/app/layout.tsx:3`, `docs/02_FRONTEND.md:208-212`

## Inconsistencies and Recommendations

### 1. Validation Approach

**Current state**: Mix of Zod (2 routes) and manual validation (most routes)

**Recommendation**: **Standardize on Zod schemas** in feature `types.ts` files

**Migration priority**: High (improves type safety and consistency)

**Cited from**: Validation patterns documented above

### 2. Business Logic in Route Handlers

**Current state**: Some routes contain complex logic (profile normalization, duplicate detection)

**Recommendation**: Extract to service functions or utilities

**Examples to extract**:
- `src/app/api/profile/route.ts:336-739` → `src/features/profile/utils/normalizeProfile.ts`
- `src/app/api/certifications/route.ts:96-131` → Service function

**Cited from**: `docs/08_ROADMAP_AND_DEBT.md:119-162` (refactor candidates)

### 3. Direct Prisma Usage

**Current state**: Some routes use Prisma directly instead of repositories

**Recommendation**: Use repositories for consistency (except auth routes, acceptable exception)

**Cited from**: `docs/03_BACKEND.md:513-523`

## Cursor Rules

**Do's and Don'ts for future changes:**

### ✅ DO

1. **Follow feature-based structure**: Put feature code in `src/features/{feature}/`

2. **Use repositories for data access**: Always use repository pattern for database operations

3. **Define Zod schemas in types.ts**: Create validation schemas in feature `types.ts` files

4. **Extract business logic**: Put complex logic in services or utilities, not route handlers

5. **Name components PascalCase**: `DiveLogForm.tsx`, `PlanPageContent.tsx`

6. **Name hooks camelCase with `use` prefix**: `useLogPageState.ts`, `useAuth.ts`

7. **Use CSS Modules**: Co-locate `.module.css` files with components

8. **Use shared styles from `src/styles/components/`**: Reuse existing component styles

9. **Follow error handling pattern**: `NextResponse.json({ error: "..." }, { status: ... })`

10. **Log errors with context**: `console.error("Route name error", err)`

11. **Write tests in `src/__tests__/`**: Use `*.test.ts` naming

12. **Mock external dependencies in tests**: Mock Prisma, APIs, but not pure functions

### ❌ DON'T

1. **Don't put business logic in route handlers**: Extract to services/utilities

2. **Don't use Prisma directly in routes**: Use repositories (except auth routes)

3. **Don't create components in wrong location**: Shared components → `src/components/`, feature components → `src/features/{feature}/components/`

4. **Don't skip validation**: Always validate API input (prefer Zod schemas)

5. **Don't use manual type assertions for validation**: Use Zod `safeParse()` instead of `body as Type`

6. **Don't put styles in global CSS**: Use CSS Modules (except design system tokens)

7. **Don't create duplicate utilities**: Check `src/lib/` and feature directories first

8. **Don't bypass repositories**: Use repository pattern for all data access

9. **Don't mix validation approaches**: Stick to one pattern (Zod recommended)

10. **Don't expose sensitive data in errors**: Use generic error messages in responses (detailed logs only)

---

Last verified against commit:

