# Edge Runtime + Prisma Debug Report

**Date:** 2025-01-XX  
**Issues:**

1. Next.js warning: "middleware file convention is deprecated. Please use proxy instead."
2. Runtime error: `PrismaClientValidationError: In order to run Prisma Client on edge runtime...` triggered by `[Middleware] Error checking session`

---

## Middleware/Proxy Inventory

### Files Found

**`src/middleware.ts`** (137 lines)

- **Exports:** `middleware` function (deprecated Next.js convention)
- **Imports:**
  - `NextResponse`, `NextRequest` from `next/server`
  - `getToken` from `next-auth/jwt`
  - **`prisma` from `@/lib/prisma`** ⚠️ (This is the problem)
- **Purpose:** Enforces sessionVersion-based session invalidation for protected routes
- **Auth Logic:**
  - Gets JWT token from cookies using `getToken()`
  - Extracts `userId` and `sessionVersion` from token
  - **Calls `prisma.user.findUnique()` at line 76** to fetch current `sessionVersion` from database
  - Compares token `sessionVersion` with DB `sessionVersion`
  - Redirects to `/signin` if mismatch or missing
- **Protected Routes:** `/dashboard`, `/settings`, `/profile`, `/dive-logs`, `/plan`, `/gear`, `/certifications`, `/community`, `/insights`, `/sites`, `/trips`, `/logbook`

**No `proxy.ts` file found** - The codebase is still using the deprecated `middleware.ts` convention.

---

## Prisma Edge Error Trace

**Error Location:** `src/middleware.ts:115` - `console.error("[Middleware] Error checking session:", error);`

**Call Chain:**

```
src/middleware.ts (line 10)
  └─> middleware() function called by Next.js
      └─> Line 41: getToken() - JWT token extraction (edge-safe)
      └─> Line 76: await prisma.user.findUnique({ where: { id: userId }, select: { sessionVersion: true } })
          └─> src/lib/prisma.ts (line 8)
              └─> new PrismaClient() instantiation
                  └─> ❌ PrismaClientValidationError: Cannot run Prisma Client on edge runtime
```

**Root Cause:**

- Next.js middleware runs in **Edge Runtime** by default (no Node.js APIs)
- Prisma Client requires Node.js runtime (uses native bindings, file system, etc.)
- The middleware imports and calls Prisma directly at line 76 to validate `sessionVersion`

**Why This Happens:**
The middleware is performing **database-backed session validation** to check if the JWT token's `sessionVersion` matches the current database value. This is used to invalidate all sessions when a user changes their password or when `sessionVersion` is incremented.

---

## Runtime Signals

### Explicit Runtime Declarations

**No `runtime = "edge"` declaration in middleware.ts**

- Next.js 16.0.7 runs middleware in Edge Runtime by default
- No explicit runtime override found

**API Routes with `runtime = "nodejs"`:**

- `src/app/api/certifications/route.ts`
- `src/app/api/certifications/definitions/route.ts`
- `src/app/api/certifications/[id]/route.ts`

**Next.js Config:** `next.config.ts` has no runtime or experimental middleware/proxy settings.

### NextAuth Configuration

**Session Strategy:** JWT-based (not database sessions)

- `src/features/auth/lib/auth.ts:98` - `strategy: "jwt"`
- Session data is stored in JWT token, not database

**Prisma Adapter Usage:**

- `src/features/auth/lib/auth.ts:50` - `adapter: PrismaAdapter(prisma)`
- Used for: Account linking, OAuth provider storage, user creation
- **Not used for:** Session validation in middleware (sessions are JWT-based)

**JWT Callback Behavior:**

- `src/features/auth/lib/auth.ts:315-449` - JWT callback
- Lines 362-392: JWT callback **already checks sessionVersion** against database
- This happens during token refresh/validation, but runs in Node.js runtime (API route context)

**The Problem:**

- Middleware runs in Edge Runtime
- Middleware duplicates the sessionVersion check that already happens in JWT callback
- Middleware cannot use Prisma (Edge Runtime limitation)

---

## Auth Gating Map

### Middleware-Level Protection

**File:** `src/middleware.ts`

- **Routes Protected:** All routes matching the matcher config (except `/api/auth/*`, static files, etc.)
- **Logic:**
  - Checks JWT token presence
  - Validates `sessionVersion` against database (⚠️ causes Prisma error)
  - Redirects to `/signin?callbackUrl=...` if invalid
- **Protected Route Patterns:**
  - `/dashboard*`, `/settings*`, `/profile*`, `/dive-logs*`, `/plan*`, `/gear*`, `/certifications*`, `/community*`, `/insights*`, `/sites*`, `/trips*`, `/logbook*`

### Server Component-Level Protection

**Individual Pages with Auth Checks:**

- `src/app/(app)/profile/page.tsx` - `getServerSession()` + redirect
- `src/app/(app)/settings/page.tsx` - `getServerSession()` + redirect
- `src/app/(app)/gear/page.tsx` - `getServerSession()` + redirect
- `src/app/(app)/dashboard/page.tsx` - `getServerSession()` (no redirect, just checks)

**Layouts:**

- `src/app/(app)/layout.tsx` - No auth check (just UI wrapper with AppShell)
- `src/app/layout.tsx` - No auth check
- `src/app/(auth)/layout.tsx` - No auth check
- `src/app/(public)/layout.tsx` - No auth check

### API Route Protection

**All API routes use `getServerSession(authOptions)`:**

- `/api/dive-logs/*`
- `/api/dive-plans/*`
- `/api/profile/*`
- `/api/certifications/*`
- `/api/gear/*`
- `/api/user/*`
- `/api/account/*`
- `/api/me/*`

**Note:** API routes run in Node.js runtime, so Prisma works fine there.

---

## Fix Options

### Option A: Remove Prisma from Middleware (Recommended)

**What to Change:**

1. Remove `import { prisma } from "@/lib/prisma"` from `src/middleware.ts`
2. Remove the database query at line 76 (`await prisma.user.findUnique(...)`)
3. Rely on JWT token's `sessionVersion` field only (no DB validation in middleware)
4. Optionally rename `middleware.ts` to `proxy.ts` and export `proxy` function to fix deprecation warning

**Why It Works:**

- JWT callback (`src/features/auth/lib/auth.ts:362-392`) already validates `sessionVersion` against database during token refresh
- The JWT token already contains `sessionVersion` (set in JWT callback line 390)
- Middleware can read `sessionVersion` from token without database access
- If token is invalid/expired, `getToken()` will return null, triggering redirect
- If `sessionVersion` in token doesn't match DB, the JWT callback will mark token as invalidated on next refresh

**Trade-offs:**

- **Pro:** Middleware becomes edge-compatible, no Prisma dependency
- **Pro:** Fixes both warnings (deprecated convention + Prisma edge error)
- **Pro:** Simpler, faster middleware (no DB query on every request)
- **Con:** Session invalidation via `sessionVersion` bump won't be immediate (only on next token refresh)
- **Mitigation:** Token refresh happens frequently (on every request that calls `getServerSession()` or `useSession()`)

**Impact:** Low risk - JWT callback already handles sessionVersion validation in Node.js runtime.

---

### Option B: Move SessionVersion Check to Server Layout

**What to Change:**

1. Remove Prisma call from middleware
2. Add sessionVersion validation to `src/app/(app)/layout.tsx` (server component)
3. Use `getServerSession()` to get session, then query Prisma to validate sessionVersion
4. Redirect if mismatch

**Why It Works:**

- Server layouts run in Node.js runtime (can use Prisma)
- All protected routes are under `(app)` route group
- Single place to check instead of every page

**Trade-offs:**

- **Pro:** Keeps immediate sessionVersion invalidation
- **Pro:** Middleware becomes edge-compatible
- **Con:** Requires layout to be async server component
- **Con:** Still need to fix middleware deprecation warning separately
- **Con:** Duplicates some logic (JWT callback also checks this)

**Impact:** Medium risk - Requires refactoring layout, but keeps current behavior.

---

### Option C: Prisma Accelerate / Driver Adapters (Not Recommended)

**What to Change:**

- Add Prisma Accelerate or use Prisma's edge-compatible driver adapters
- Keep current middleware logic

**Why Not Recommended:**

- User explicitly said "Do not add Prisma Accelerate or Driver Adapters yet"
- Adds external dependency and cost
- Option A is simpler and sufficient

**Impact:** High cost, unnecessary complexity.

---

## Recommendation

**Choose Option A** - Remove Prisma from middleware and rely on JWT token validation only.

**Rationale:**

1. **JWT callback already validates sessionVersion** - The check at `src/features/auth/lib/auth.ts:362-392` runs in Node.js runtime and marks tokens as invalidated if sessionVersion mismatches
2. **Token refresh is frequent** - Any server component using `getServerSession()` or client component using `useSession()` will trigger token refresh, catching invalidated tokens quickly
3. **Simpler architecture** - Middleware should be lightweight and edge-compatible
4. **Fixes both issues** - Removes Prisma edge error AND allows migration to `proxy.ts` to fix deprecation warning
5. **Low risk** - The sessionVersion validation still happens, just in a different layer (JWT callback instead of middleware)

**Implementation Steps (when ready):**

1. Remove Prisma import and DB query from `src/middleware.ts`
2. Simplify middleware to only check token presence and basic validity
3. Rename `middleware.ts` → `proxy.ts` and change export to `export async function proxy(...)`
4. Update matcher config if needed for proxy convention
5. Test that session invalidation still works (bump sessionVersion, verify user gets logged out on next request)

---

## Additional Notes

- **Next.js Version:** 16.0.7
- **NextAuth Version:** 4.24.13
- **Prisma Version:** 6.19.0
- **Session Strategy:** JWT (not database sessions)
- **Current Behavior:** Middleware performs redundant sessionVersion check that JWT callback already handles
