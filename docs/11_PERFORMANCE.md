# Performance

## Rendering Strategy

### Server vs Client Components

**Default**: Server Components (no `"use client"` directive)

**Client Components** (marked with `"use client"`): 30+ files found, primarily:

- Form components (all forms need interactivity)
- Feature page content components (state management, hooks)
- Public homepage components (interactivity)
- Modal components
- Navigation/components with state

**Client boundary location**: Feature-level page content components

**Example pattern**:

- Server Component page: `src/app/(app)/dashboard/page.tsx` (fetches data, passes props)
- Client Component content: `src/features/dashboard/components/DashboardPageContent.tsx` (receives props, manages UI state)

**Cited from**:

- Grep search found 30+ files with `"use client"`
- `src/app/(app)/dashboard/page.tsx:12-47` (Server Component pattern)
- `src/features/dashboard/components/DashboardPageContent.tsx:1` (Client Component receiving props)

### Why Client Boundaries Are Where They Are

**Client components used for**:

- Form interactivity (form state, validation)
- State management (hooks: `useState`, `useEffect`)
- Context consumption (`useUnitSystem`, `useAuth`)
- Event handlers (onClick, onSubmit)

**Server components used for**:

- Data fetching (repository calls, database queries)
- Authentication checks (session validation)
- Route-level logic (redirects, layout)

**Cited from**: Component patterns across codebase (Server Components fetch, Client Components render)

## Data Fetching

### Server Component Fetching

**Pattern**: Server Components fetch data directly from repositories

**Example** (`src/app/(app)/dashboard/page.tsx:23-35`):

```typescript
const [recentDives, statistics, recentPlans] = await Promise.all([
  diveLogRepository.findMany({ orderBy: "date", take: 3, userId }),
  diveLogRepository.getStatistics(userId),
  divePlanRepository.findMany({ orderBy: "createdAt", take: 3, userId }),
]);
```

**Parallel fetching**: Uses `Promise.all()` for concurrent queries ✅

**Cited from**: `src/app/(app)/dashboard/page.tsx:23-35`

### Client Component Fetching

**Pattern**: Client Components use `fetch()` to API routes

**Example** (`src/features/dive-log/hooks/useLogPageState.ts:35`):

```typescript
const res = await fetch("/api/dive-logs");
```

**Cited from**: `src/features/dive-log/hooks/useLogPageState.ts:35`

### Caching Strategy

**No caching configured**: All pages use `export const dynamic = "force-dynamic"`

**Pages with `force-dynamic`**:

- `src/app/(app)/dashboard/page.tsx:10`
- `src/app/(app)/settings/page.tsx:11`
- `src/app/(app)/profile/page.tsx:11`
- `src/app/(app)/plan/page.tsx:12`
- `src/app/(public)/dive-plans/page.tsx:16`
- `src/app/page.tsx:7`

**Reason**: "Force dynamic rendering to ensure session is always checked" (`src/app/(app)/dashboard/page.tsx:9`)

**Impact**: No static generation, no ISR, all pages server-rendered on every request

**Cited from**: Grep search found 7 files with `export const dynamic = "force-dynamic"`

### Revalidation Settings

**No revalidation configured**: No `revalidate` exports found

**API routes**: No caching headers configured (UNVERIFIED - check `NextResponse` headers)

## Bundle Risks

### Large Dependencies

**Dependencies from `package.json`**:

- `next`: 16.0.7 (framework - expected large)
- `react`: 19.2.0 (core - expected)
- `react-dom`: 19.2.0 (core - expected)
- `@prisma/client`: 6.19.0 (ORM client - can be large, but tree-shakeable)
- `next-auth`: 4.24.13 (auth library - moderate size)
- `openai`: 6.9.1 (OpenAI SDK - moderate size)
- `lucide-react`: 0.454.0 (icon library - tree-shakeable)

**Cited from**: `package.json:23-37`

### Icon Library Usage

**lucide-react**: Used in 3 files (limited usage):

- `src/components/Avatar/Avatar.tsx:7` - `Pencil`
- `src/features/certifications/components/CertificationCard.tsx:8` - `ChevronDown, Star, Edit, Trash2`
- `src/features/profile/components/ProfilePageContent.new.tsx:6` - `ChevronDown`

**Tree-shaking**: ✅ Should be tree-shakeable (individual icon imports)

**Risk level**: Low (limited usage, tree-shakeable)

**Cited from**: Grep search found 3 files importing from `lucide-react`

### Shared UI Libraries

**No shared UI library**: Custom CSS Modules architecture

**CSS Modules**: Component-scoped styles (`.module.css` files)

**Design system**: `src/styles/design-system/` (tokens, typography, utilities)

**Risk level**: Low (no heavy UI library like Material-UI, Chakra, etc.)

**Cited from**: CSS Modules architecture (no UI library imports found)

### UploadThing

**@uploadthing/react**: 7.3.3 (`package.json:27`)

**Usage**: Avatar uploads only (UNVERIFIED - check usage)

**Risk level**: Moderate (includes upload functionality, but limited scope)

**Cited from**: `package.json:27, 37`

## Images/Fonts

### Font Handling

**Font**: Inter from Google Fonts (`src/app/layout.tsx:2, 7`)

**Implementation**:

```typescript
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
```

**Next.js font optimization**: ✅ Uses `next/font/google` (automatically optimizes)

**Preload**: ✅ Next.js handles font preloading automatically

**Cited from**: `src/app/layout.tsx:2, 7, 22`

### Image Handling

**next/image usage**: Found in 1 file (`src/features/public-home/components/FeatureTrio.tsx:3, 32`)

**Usage**:

```typescript
import Image from "next/image";
<Image src={feature.icon} alt="" width={64} height={64} />
```

**Image optimization**: ✅ Uses Next.js Image component (automatic optimization)

**Background images**: CSS background images (no `next/image` for backgrounds)

**Remote images**: Configured for Google profile images (`next.config.ts:7-15`):

```typescript
images: {
  remotePatterns: [{
    protocol: "https",
    hostname: "lh3.googleusercontent.com",
    pathname: "/**",
  }],
}
```

**Cited from**:

- `src/features/public-home/components/FeatureTrio.tsx:3, 32`
- `next.config.ts:7-15`

### Preload Strategy

**No explicit preload**: Next.js handles font preloading automatically

**Images**: No explicit preload configured (Next.js Image handles lazy loading)

## React Performance

### Heavy Components

**Large client components** (high line count):

- `src/features/dive-plan/components/AIDiveBriefing.tsx` - 409 lines (complex briefing display)
- `src/features/dive-plan/hooks/usePlanPageState.ts` - 407 lines (complex state management)
- `src/features/dive-log/hooks/useLogPageState.ts` - 256 lines (state management)
- `src/app/api/profile/route.ts:336-739` - 400+ lines (PATCH handler - not React, but note)

**Performance concern**: Large hooks/components may benefit from splitting

**Cited from**: File sizes observed during codebase review

### Unnecessary Re-renders

**Context usage**: `UnitSystemContext` wraps entire app (`src/app/layout.tsx:24`)

**Context provider**: `UnitSystemProvider` (`src/contexts/UnitSystemContext.tsx:24-63`)

**Re-render risk**: Any component using `useUnitSystem()` re-renders when `unitSystem` changes

**Mitigation**: Context value is stable object (created once), but state updates trigger re-renders

**Cited from**:

- `src/contexts/UnitSystemContext.tsx:24-63`
- `src/app/layout.tsx:24`

### Context Usage

**Contexts used**:

- `UnitSystemContext` - Global unit system state
- `SessionProvider` (NextAuth) - Session state

**Scope**: Both wrap entire app in root layout

**Risk level**: Low-Medium (unit system changes affect all consuming components)

**Cited from**:

- `src/app/layout.tsx:23-24`
- `src/contexts/UnitSystemContext.tsx`

### React Compiler

**React Compiler enabled**: `next.config.ts:4` - `reactCompiler: true`

**Benefit**: Automatic memoization and optimization

**Cited from**: `next.config.ts:4`

## Database Performance

### N+1 Query Risks

**Identified N+1 pattern**: `src/app/api/dive-logs/route.ts:46-57`

**Problem**:

```typescript
const entries = await diveLogRepository.findMany({ ... });

const entriesWithGear = await Promise.all(
  entries.map(async (entry) => {
    const gearItems = await diveGearRepository.getGearForDive(
      entry.id,
      session.user.id
    );
    return { ...entry, gearItems: ... };
  })
);
```

**Issue**: For N entries, makes N additional queries (1 query per entry for gear)

**Mitigation**: Uses `Promise.all()` (parallel queries, but still N queries)

**Better solution**: Single query with Prisma `include` or join

**Cited from**: `src/app/api/dive-logs/route.ts:40-57`

### Unbounded Queries

**Unbounded query**: `src/app/api/dive-logs/route.ts:40-43`

**Problem**:

```typescript
const entries = await diveLogRepository.findMany({
  orderBy: "date",
  userId: session.user.id,
  // No 'take' limit - loads ALL entries
});
```

**Risk**: As user accumulates dives, query returns more and more rows

**Impact**: Large JSON response, slow network transfer, memory usage

**Cited from**: `src/app/api/dive-logs/route.ts:40-43`

**Other unbounded queries** (UNVERIFIED - check other routes):

- `/api/gear` - may load all gear items
- `/api/dive-plans` - GET endpoint uses `take: 10` ✅ (limited)

**Cited from**: `src/app/api/dive-plans/route.ts:210-214` (has `take: 10`)

### Pagination

**Pagination support**: Repository methods support `take` parameter

**Usage**:

- Dashboard: Uses `take: 3` ✅ (`src/app/(app)/dashboard/page.tsx:26, 32`)
- Dive plans GET: Uses `take: 10` ✅ (`src/app/api/dive-plans/route.ts:212`)
- Dive logs GET: **No pagination** ❌ (loads all entries)

**Repository interface**: `findMany()` accepts `take?: number` parameter

**Implementation**: Prisma `take` option (`src/services/database/repositories/diveLogRepository.ts:48, 58`)

**Cited from**:

- `src/services/database/repositories/diveLogRepository.ts:46-60`
- `src/app/(app)/dashboard/page.tsx:26, 32`
- `src/app/api/dive-plans/route.ts:212`

### Missing Indexes

**Indexes present** (from schema):

- `DiveLog.userId` (`prisma/schema.prisma:121`)
- `DivePlan.userId` (`prisma/schema.prisma:139`)
- `GearItem.userId, isActive` (composite, `prisma/schema.prisma:163`)
- `GearKit.userId, isDefault` (composite, `prisma/schema.prisma:179`)

**Potential missing indexes**:

- No index on `DiveLog.date` (date-range queries)
- No index on `DivePlan.date` (date queries)

**Impact**: Date sorting/filtering may be slower as data grows

**Cited from**: `prisma/schema.prisma` (index definitions)

### Complex Queries

**Complex query with nested relations**: `src/app/api/profile/route.ts:57-107`

**Query includes**:

- User fields (many)
- `profileKits` → `kit` → `kitItems` → `gearItem` (nested includes)

**Impact**: Single query but loads deeply nested data

**Risk level**: Medium (works but may be slow with many kits/items)

**Cited from**: `src/app/api/profile/route.ts:57-107`

## CI/Performance Checks

### Current CI Setup

**CI workflow**: `.github/workflows/pr-checks.yml`

**Steps**:

- Lint
- Format check
- Type check
- Tests
- Build

**No performance checks**: ❌ No Lighthouse, bundle analyzer, or performance budgets

**Cited from**: `.github/workflows/pr-checks.yml`

### Bundle Analysis

**No bundle analyzer**: ❌ No `@next/bundle-analyzer` in dependencies

**No bundle size checks**: ❌ No bundle size limits in CI

**Cited from**: `package.json` (no bundle analyzer)

### Performance Monitoring

**No performance monitoring**: ❌ No tools like Web Vitals, Sentry performance, etc.

**No production metrics**: No logging/monitoring setup for performance

## Quick Wins (1-2 Hours)

### 1. Add Pagination to Dive Logs API

**Action**: Add `take` parameter with default limit (e.g., 50) to `/api/dive-logs` GET endpoint

**Files**: `src/app/api/dive-logs/route.ts:40-43`

**Change**:

```typescript
const entries = await diveLogRepository.findMany({
  orderBy: "date",
  take: 50, // Add limit
  userId: session.user.id,
});
```

**Impact**: Prevents unbounded query growth, faster responses for users with many dives

**Time**: 15 minutes

**Cited from**: `src/app/api/dive-logs/route.ts:40-43`

---

### 2. Fix N+1 Query in Dive Logs Gear Loading

**Action**: Use Prisma `include` to load gear in single query instead of N queries

**Files**: `src/app/api/dive-logs/route.ts:46-57`

**Current**:

```typescript
const entriesWithGear = await Promise.all(
  entries.map(async (entry) => {
    const gearItems = await diveGearRepository.getGearForDive(...);
    ...
  })
);
```

**Better**: Modify repository to support `include` option, or use Prisma directly with `include: { gearItems: { include: { gearItem: true } } }`

**Impact**: Reduces N queries to 1 query for gear loading

**Time**: 30-60 minutes (requires repository change or direct Prisma usage)

**Cited from**: `src/app/api/dive-logs/route.ts:46-57`

---

### 3. Add Bundle Analyzer to Build

**Action**: Install `@next/bundle-analyzer` and add build script

**Files**: `package.json`, `next.config.ts`

**Steps**:

1. `npm install --save-dev @next/bundle-analyzer`
2. Update `next.config.ts` to conditionally enable analyzer
3. Add `"analyze": "ANALYZE=true npm run build"` script

**Impact**: Identify large dependencies and bundle size issues

**Time**: 15 minutes

---

### 4. Add Date Indexes to Schema

**Action**: Add database indexes on `DiveLog.date` and `DivePlan.date`

**Files**: `prisma/schema.prisma`

**Change**:

```prisma
model DiveLog {
  ...
  @@index([date])
  @@index([userId])
}

model DivePlan {
  ...
  @@index([date])
  @@index([userId])
}
```

**Impact**: Faster date-based queries and sorting

**Time**: 15 minutes (add index, create migration, apply)

**Cited from**: `prisma/schema.prisma` (missing date indexes)

---

## Bigger Wins (1-2 Days)

### 1. Implement Proper Caching Strategy

**Action**: Remove `force-dynamic` where appropriate, add ISR/revalidation

**Files**: All page files with `export const dynamic = "force-dynamic"`

**Strategy**:

- Public pages: Static generation or ISR
- Authenticated pages: Short revalidation (e.g., 60 seconds) or on-demand revalidation
- Keep `force-dynamic` only where session check is critical

**Impact**: Reduces server load, faster page loads, better scalability

**Time**: 1-2 days (requires testing session behavior with caching)

**Cited from**: 7 files with `force-dynamic` (grep results)

---

### 2. Optimize Profile Query with Selective Fields

**Action**: Reduce fields selected in profile query, or split into multiple queries

**Files**: `src/app/api/profile/route.ts:57-107`

**Current**: Selects 20+ fields + nested relations in single query

**Options**:

- Split into user data + profile kits (separate queries)
- Lazy-load profile kits only when needed
- Use GraphQL-like field selection

**Impact**: Faster profile page loads, reduced data transfer

**Time**: 4-8 hours

**Cited from**: `src/app/api/profile/route.ts:57-107`

---

### 3. Add Bundle Size Monitoring to CI

**Action**: Add bundle size check to CI workflow

**Files**: `.github/workflows/pr-checks.yml`, `package.json`

**Steps**:

1. Install `bundlesize` or use `@next/bundle-analyzer`
2. Add CI step to check bundle sizes
3. Set size limits (fail PR if exceeded)

**Impact**: Prevents bundle size regressions

**Time**: 2-4 hours

**Cited from**: No bundle size checks in CI (`.github/workflows/pr-checks.yml`)

---

### 4. Optimize Context Re-renders

**Action**: Split `UnitSystemContext` or memoize context value

**Files**: `src/contexts/UnitSystemContext.tsx`

**Options**:

- Use `useMemo` for context value object
- Split into separate contexts (unit system vs preferences)
- Use selector pattern to reduce re-renders

**Impact**: Reduces unnecessary re-renders when unit system changes

**Time**: 2-4 hours (requires testing)

**Cited from**: `src/contexts/UnitSystemContext.tsx:24-63`

---

### 5. Add Database Query Logging/Monitoring

**Action**: Add query timing/logging to identify slow queries

**Files**: `src/lib/prisma.ts`, or middleware

**Implementation**:

- Enable Prisma query logging in development
- Add query timing middleware
- Log slow queries (>100ms) in production

**Impact**: Identifies performance bottlenecks

**Time**: 2-4 hours

**Cited from**: `src/lib/prisma.ts:8-12` (basic Prisma client setup)

---

## Measurement Plan

### Using Current Tools

**Next.js built-in metrics**:

1. **Build output analysis**:

   ```bash
   npm run build
   # Check .next/analyze/ directory if bundle analyzer added
   # Review build output for route sizes
   ```

2. **Development mode timing**:
   - Add `console.time()` / `console.timeEnd()` around queries
   - Example: `src/app/api/dive-logs/route.ts`

   ```typescript
   console.time('dive-logs-query');
   const entries = await diveLogRepository.findMany({...});
   console.timeEnd('dive-logs-query');
   ```

3. **Browser DevTools**:
   - Network tab: API response times, payload sizes
   - Performance tab: Component render times
   - Lighthouse: Run locally for Core Web Vitals

### What to Measure

**Server-side (add logging)**:

1. **Database query times**:
   - Repository method execution time
   - Prisma query duration
   - Log queries > 100ms

2. **API route response times**:
   - Total route handler time
   - Individual query times
   - Response payload size

3. **Page render times**:
   - Server Component render time
   - Total page generation time

**Client-side (browser DevTools)**:

1. **Time to First Byte (TTFB)**
2. **First Contentful Paint (FCP)**
3. **Largest Contentful Paint (LCP)**
4. **Time to Interactive (TTI)**
5. **API response times** (Network tab)
6. **Bundle sizes** (Network tab, filter by JS)

### Recommended Logging Additions

**Add to API routes** (`src/app/api/dive-logs/route.ts` example):

```typescript
const startTime = Date.now();
// ... query logic ...
const duration = Date.now() - startTime;
if (duration > 100) {
  console.warn(`[PERF] GET /api/dive-logs took ${duration}ms`);
}
```

**Add to repositories** (optional middleware):

```typescript
// Wrap Prisma queries with timing
const originalFindMany = prisma.diveLog.findMany;
prisma.diveLog.findMany = async function (...args) {
  const start = Date.now();
  const result = await originalFindMany.apply(this, args);
  const duration = Date.now() - start;
  if (duration > 50) console.warn(`[PERF] findMany took ${duration}ms`);
  return result;
};
```

**Production monitoring** (future):

- Add APM tool (Sentry, New Relic, etc.)
- Track Core Web Vitals
- Set up alerts for slow queries/pages

---

Last verified against commit:
