# Backend

## What Constitutes the "Backend"

In this Next.js application, the "backend" consists of:

1. **API Route Handlers** (`src/app/api/**/route.ts`) - HTTP request handlers using Next.js App Router
   - Export named functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
   - No Server Actions found (no `"use server"` directives)
   - All server-side logic lives in API routes or Server Components

2. **Services Layer** (`src/services/`)
   - External integrations: `services/ai/openaiService.ts`
   - Data access: `services/database/repositories/` (Repository pattern)

3. **Business Logic** (feature-specific):
   - Feature services: `src/features/{feature}/services/` (e.g., `riskCalculator.ts`)
   - Utility libraries: `src/lib/` (unit conversion, validation helpers)

4. **Server Components** (pages that fetch data directly)
   - Example: `src/app/(app)/dashboard/page.tsx` fetches data via repositories
   - Covered in `docs/02_FRONTEND.md`

## API Endpoints Structure

### Naming Conventions

- **RESTful patterns**: Resource-based URLs (`/api/dive-logs`, `/api/dive-plans`, `/api/gear`)
- **Nested resources**: Dynamic segments (`/api/certifications/[id]/route.ts`)
- **Special endpoints**: Action-based (`/api/dive-plans/preview/route.ts`)
- **File structure**: Each route is a `route.ts` file in `src/app/api/{resource}/`

### Route Organization

```
src/app/api/
├── account/
│   └── password/route.ts      # PUT /api/account/password
├── auth/
│   ├── [...nextauth]/route.ts # NextAuth catch-all
│   └── signup/route.ts        # POST /api/auth/signup
├── certifications/
│   ├── [id]/route.ts          # GET/PUT/DELETE /api/certifications/:id
│   ├── definitions/route.ts   # GET /api/certifications/definitions
│   └── route.ts               # GET/POST /api/certifications
├── dive-logs/route.ts         # GET/POST /api/dive-logs
├── dive-plans/
│   ├── preview/route.ts       # POST /api/dive-plans/preview
│   └── route.ts               # GET/POST/PUT/DELETE /api/dive-plans
├── gear/
│   ├── default-kit/route.ts   # GET/PUT /api/gear/default-kit
│   └── route.ts               # GET/POST/PUT/DELETE /api/gear
├── gear-kits/route.ts         # GET/POST/PUT/DELETE /api/gear-kits
├── me/
│   ├── avatar/route.ts        # POST /api/me/avatar
│   └── route.ts               # GET /api/me
├── profile/route.ts           # GET/PATCH /api/profile
├── uploadthing/
│   └── route.ts               # UploadThing file upload handler
└── user/
    └── preferences/route.ts   # GET/PATCH /api/user/preferences
```

## Request Validation

### Validation Approaches (Mixed)

**1. Zod Schemas** (used in 2 endpoints):

- **Certifications**: `src/features/certifications/types.ts:6-34`

  ```typescript
  export const createUserCertificationSchema = z.object({
    certificationDefinitionId: z.string().min(1),
    earnedDate: z.string().optional().nullable(),
    // ...
  });
  ```

  Used in: `src/app/api/certifications/route.ts:73` (`safeParse()`)

- **User Preferences**: `src/app/api/user/preferences/route.ts:11-16`
  ```typescript
  const unitPreferencesSchema = z.object({
    depth: z.enum(["ft", "m"]),
    temperature: z.enum(["f", "c"]),
    // ...
  });
  ```
  Used in: `src/app/api/user/preferences/route.ts:90` (`safeParse()`)

**2. Manual Validation** (most endpoints):

- **Signup**: `src/app/api/auth/signup/route.ts:10-36`
  - Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Password length check: `password.length < 8`
  - Required field checks

- **Dive Logs**: `src/app/api/dive-logs/route.ts:89-103`
  - Type assertions: `body as { action, id?, payload? }`
  - Manual presence checks: `if (!payload)`
  - No schema validation

- **Dive Plans**: `src/app/api/dive-plans/route.ts:30-38`
  - Type assertions only: `body as { region: string, ... }`
  - No runtime validation

- **Gear**: `src/app/api/gear/route.ts:49-67`
  - Manual field checks: `if (!type || !manufacturer || !model)`

- **Profile**: `src/app/api/profile/route.ts:336-739`
  - Extensive manual normalization and validation (400+ lines)
  - Field whitelisting, string trimming, URL validation, date parsing

### Validation Issues

**Inconsistency**: Most endpoints use manual validation/type assertions, only 2 use Zod. This creates:

- **Type safety gaps**: Type assertions don't validate at runtime
- **Validation duplication**: Similar checks repeated across routes
- **Maintenance burden**: Validation logic scattered

**Recommendation**: Standardize on Zod schemas for all request validation.

## Error Handling Conventions

### Error Response Pattern

**Standard shape**:

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
- `409` - Conflict (duplicate resources, e.g., certifications)
- `500` - Internal server error (catch-all for exceptions)

### Error Handling Pattern

**Standard try/catch structure**:

```typescript
// src/app/api/dive-logs/route.ts:14-67
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ... business logic ...
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("GET /api/dive-logs error", err);
    return NextResponse.json(
      { error: "Failed to fetch dive logs" },
      { status: 500 }
    );
  }
}
```

**Error logging**:

- All errors logged with `console.error()` (route name + error)
- Development-only detailed logs in some routes (e.g., `src/app/api/profile/route.ts:16-24`)

### Error Response Variations

**With validation details** (Zod routes):

```typescript
// src/app/api/certifications/route.ts:74-78
if (!validationResult.success) {
  return NextResponse.json(
    { error: "Invalid input", details: validationResult.error.issues },
    { status: 400 }
  );
}
```

**With specific error messages**:

```typescript
// src/app/api/auth/signup/route.ts:14-18
if (!email || !password || !trimmedFirstName || !trimmedLastName) {
  return NextResponse.json(
    { error: "First and last name are required." },
    { status: 400 }
  );
}
```

**Generic errors** (most routes):

```typescript
// src/app/api/dive-plans/route.ts:94-99
catch (err) {
  console.error("Error in POST /api/dive-plans:", err);
  return NextResponse.json(
    { error: "Failed to generate plan advice." },
    { status: 500 }
  );
}
```

### Error Handling Issues

**Generic error messages**: Most catch blocks return generic messages, hiding actual errors from clients. This is good for security but makes debugging harder.

**No error tracking**: Errors only logged to console, no external error tracking service (Sentry, etc.)

**Inconsistent error detail**: Some routes return validation details, others don't.

## Business Logic Organization

### Repository Pattern

**Data access layer** (`src/services/database/repositories/`):

- **diveLogRepository.ts**: CRUD operations for dive logs
- **divePlanRepository.ts**: CRUD operations for dive plans
- **gearRepository.ts**: CRUD operations for gear items/kits

**Repository interface**:

```typescript
// src/services/database/repositories/diveLogRepository.ts:9-28
export const diveLogRepository = {
  async create(data: DiveLogInput, userId?: string): Promise<DiveLogEntry> {
    return prisma.diveLog.create({ data: { ...data, userId } });
  },
  async findById(id: string, userId?: string): Promise<DiveLogEntry | null> {
    // Authorization check included
    if (userId && entry && entry.userId !== userId) return null;
    return entry;
  },
  // ...
};
```

**Authorization in repositories**: Repositories check `userId` ownership on read/update/delete operations.

**For detailed database schema and query patterns, see `docs/05_DATABASE.md`.**

### Service Layer

**External services** (`src/services/`):

- **ai/openaiService.ts**: OpenAI API integration for dive plan briefings
  - Exports: `generateDivePlanBriefing()`, `generateUpdatedDivePlanBriefing()`
  - Handles unit system conversion for AI responses

- **database/repositories/**: Data access abstraction (see above)

**Feature services** (`src/features/{feature}/services/`):

- **dive-plan/services/riskCalculator.ts**: Risk level calculation logic
  - Pure function: `calculateRiskLevel(maxDepthMeters, bottomTime)`
  - Returns: `"Low" | "Moderate" | "High"`

### Utility Libraries (`src/lib/`)

- **prisma.ts**: Prisma client singleton
- **units.ts**: Unit conversion utilities (UI ↔ canonical)
- **validation.ts**: Validation helpers (UNVERIFIED - check actual exports)
- **diveMath.ts**: Dive calculations

### Boundary Clarity

**Clean boundaries**:

- ✅ Repositories handle all database access
- ✅ Services handle external API calls
- ✅ Route handlers orchestrate: auth → validate → service/repository → response

**Boundary issues**:

1. **Business logic in route handlers**: Some routes contain complex logic that could be extracted
   - Example: `src/app/api/profile/route.ts:336-739` (400+ lines of normalization/validation)
   - Example: `src/app/api/certifications/route.ts:96-131` (duplicate detection logic)

2. **Unit conversion in route handlers**: Conversion logic appears in routes instead of services
   - Example: `src/app/api/dive-plans/route.ts:41-52` (unit system determination)

3. **Authorization checks duplicated**: Repositories check ownership, but routes also check session
   - Both layers validate, which is defensive but creates duplication

**Recommendation**: Extract complex validation/normalization into service functions or validation utilities.

## Authentication Checks

### Standard Auth Pattern

**Every protected route** starts with:

```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**authOptions import**: `src/features/auth/lib/auth.ts`

### Auth Check Variations

**Basic check** (most routes):

```typescript
// src/app/api/dive-logs/route.ts:15-19
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Strict user.id check** (some routes):

```typescript
// src/app/api/profile/route.ts:35-47
if (
  !session.user.id ||
  typeof session.user.id !== "string" ||
  session.user.id.trim() === ""
) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Public endpoints** (no auth check):

- `/api/dive-plans/preview` - Guest users can preview plans
- `/api/auth/signup` - Public signup endpoint
- `/api/auth/[...nextauth]` - NextAuth endpoints

### Authorization (Resource Ownership)

**Two-layer authorization**:

1. **Route level**: Session check (above)
2. **Repository level**: User ownership check
   ```typescript
   // src/services/database/repositories/diveLogRepository.ts:70-75
   if (userId) {
     const existing = await prisma.diveLog.findUnique({ where: { id } });
     if (!existing || existing.userId !== userId) {
       throw new Error("Dive log not found or unauthorized");
     }
   }
   ```

**This is defensive** but creates duplication - routes pass `session.user.id`, repositories check again.

## Core Backend Flows

### Flow 1: Create Dive Log

**Request**: `POST /api/dive-logs` with `{ action: "create", payload: DiveLogInput }`

**File trace**:

1. **Route Handler**: `src/app/api/dive-logs/route.ts:81-197`
   - Auth check: `getServerSession(authOptions)` (line 82-86)
   - Parse body: `await req.json()` (line 89)
   - Manual validation: Check `action === "create"` and `payload` exists (line 97-103)
   - Extract gear IDs: `const { gearItemIds, ...diveLogData } = payload` (line 105-107)

2. **Repository**: `src/services/database/repositories/diveLogRepository.ts:13-28`
   - Create dive log: `prisma.diveLog.create({ data: { ...diveLogData, userId } })` (line 14-27)

3. **Gear Association**: `src/services/database/repositories/gearRepository.ts` (via `diveGearRepository`)
   - Called from route handler: `diveGearRepository.setGearForDive(created.id, gearItemIds, userId)` (line 116-120)

4. **Response**: `NextResponse.json({ entry: created, gearItems })` (line 129-132)

**Data flow**: Client → Route Handler → Repository → Prisma → SQLite → Response

### Flow 2: Create Dive Plan with AI Briefing

**Request**: `POST /api/dive-plans` with plan data

**File trace**:

1. **Route Handler**: `src/app/api/dive-plans/route.ts:19-101`
   - Auth check: `getServerSession(authOptions)` (line 20-27)
   - Parse body: `await req.json()` with type assertion (line 30-38)
   - Unit conversion: `cmToMeters(body.maxDepthCm)` (line 41)
   - Risk calculation: `calculateRiskLevel(maxDepthMeters, bottomTime)` (line 42)
     - Service: `src/features/dive-plan/services/riskCalculator.ts`

2. **AI Service**: `src/services/ai/openaiService.ts`
   - Generate briefing: `generateDivePlanBriefing({ region, siteName, ... })` (line 55-64)
   - OpenAI API call with structured prompt

3. **Repository**: `src/services/database/repositories/divePlanRepository.ts:17-35`
   - Create plan: `prisma.divePlan.create({ data: { ...planInput, userId } })` (line 18-30)

4. **Response**: `NextResponse.json({ aiAdvice, aiBriefing, plan: savedPlan })` (line 86-93)

**Data flow**: Client → Route Handler → Risk Calculator → AI Service → OpenAI API → Repository → Database → Response

### Flow 3: Get User Profile

**Request**: `GET /api/profile`

**File trace**:

1. **Route Handler**: `src/app/api/profile/route.ts:11-328`
   - Auth check: Strict `session.user.id` validation (line 35-47)
   - Direct Prisma query: `prisma.user.findUnique({ where: { id: userId } })` (line 57-107)
   - Complex select with nested relations (profileKits → kit → kitItems → gearItem)
   - Data transformation: Map profile kits to simpler structure (line 110-139)
   - Fallback logic: Try email if ID fails, create user if missing (dev-only, line 143-290)

2. **Response**: `NextResponse.json({ user })` (line 311)

**Note**: This route bypasses repository pattern and queries Prisma directly. Unusual pattern - most routes use repositories.

**Data flow**: Client → Route Handler → Prisma → Database → Transform → Response

### Flow 4: Create User Certification (with Zod validation)

**Request**: `POST /api/certifications` with certification data

**File trace**:

1. **Route Handler**: `src/app/api/certifications/route.ts:62-175`
   - Auth check: `getServerSession(authOptions)` (line 63-67)
   - Parse body: `await req.json()` (line 70)

2. **Validation**: `src/features/certifications/types.ts:6-17`
   - Zod schema: `createUserCertificationSchema.safeParse(body)` (line 73)
   - Error response with details if invalid (line 74-79)

3. **Business logic in route**:
   - Verify definition exists: `prisma.certificationDefinition.findUnique()` (line 84-93)
   - Duplicate detection: Check existing certs (line 98-131)
   - Compare earnedDate and certNumber for exact duplicates

4. **Create**: `prisma.userCertification.create()` (line 134-159)
   - Include certificationDefinition relation

5. **Response**: `NextResponse.json({ certification }, { status: 201 })` (line 161)

**Data flow**: Client → Route Handler → Zod Validation → Prisma (definition check) → Duplicate Check → Prisma (create) → Database → Response

### Flow 5: Change Password (with session invalidation)

**Request**: `PUT /api/account/password` with `{ currentPassword, newPassword }`

**File trace**:

1. **Route Handler**: `src/app/api/account/password/route.ts:15-161`
   - Auth check: `getServerSession(authOptions)` (line 16-20)
   - Manual validation: Check passwords present and length (line 28-40)

2. **Password verification**:
   - Fetch user: `prisma.user.findUnique({ select: { password } })` (line 43-49)
   - Check password exists (credentials account check, line 56-64)
   - Verify current: `bcrypt.compare(currentPassword, user.password)` (line 67-77)
   - Check not same: `bcrypt.compare(newPassword, user.password)` (line 80-86)

3. **Update with transaction**:
   - Hash new password: `bcrypt.hash(newPassword, 10)` (line 89)
   - Update in transaction: `prisma.$transaction()` (line 105-119)
     - Update password and increment `sessionVersion`

4. **Session management**:
   - Get current JWT: `getToken()` (line 92-95)
   - Create new token: `encode()` with updated `sessionVersion` (line 122-132)
   - Set cookie: `response.cookies.set()` (line 145-151)

5. **Response**: `NextResponse.json({ success: true })` (line 141)

**Data flow**: Client → Route Handler → Prisma (fetch user) → bcrypt (verify) → Prisma Transaction (update + sessionVersion) → JWT encode → Set cookie → Response

**Note**: This flow invalidates all other sessions by incrementing `sessionVersion`, then updates current session's JWT cookie.

## Messy/Duplicated Patterns

### 1. Validation Inconsistency

**Issue**: Mix of Zod schemas and manual validation

- Only 2 routes use Zod (`certifications`, `user/preferences`)
- Others use type assertions + manual checks
- Profile route has 400+ lines of manual validation/normalization

**Impact**: Type safety gaps, maintenance burden, validation logic scattered

**Location**: All route handlers

### 2. Authorization Duplication

**Issue**: Both routes and repositories check user ownership

- Routes check session
- Repositories check `userId` parameter matches resource owner

**Impact**: Defensive but redundant

**Location**: `src/app/api/*/route.ts` + `src/services/database/repositories/*.ts`

### 3. Direct Prisma Usage in Routes

**Issue**: Some routes query Prisma directly instead of using repositories

- Profile route: `src/app/api/profile/route.ts:57-107` (bypasses repository)
- Certifications route: `src/app/api/certifications/route.ts:84-93, 134-159` (direct Prisma)
- Signup route: `src/app/api/auth/signup/route.ts:39-61` (direct Prisma)

**Impact**: Inconsistent data access pattern, harder to test, business logic in routes

**Location**: `src/app/api/profile/route.ts`, `src/app/api/certifications/route.ts`, `src/app/api/auth/signup/route.ts`

### 4. Unit Conversion Logic in Routes

**Issue**: Unit system determination logic appears in route handlers

- `src/app/api/dive-plans/route.ts:45-52` (unit system determination)
- `src/app/api/dive-plans/preview/route.ts:29-36` (duplicated logic)

**Impact**: Duplication, business logic in routes

**Location**: `src/app/api/dive-plans/route.ts`, `src/app/api/dive-plans/preview/route.ts`

### 5. Complex Business Logic in Routes

**Issue**: Route handlers contain complex validation/normalization logic

- Profile route: 400+ lines of normalization (line 336-739)
- Certifications route: Duplicate detection logic (line 96-131)

**Impact**: Routes become hard to test and maintain

**Location**: `src/app/api/profile/route.ts`, `src/app/api/certifications/route.ts`

### 6. Error Message Inconsistency

**Issue**: Some routes return detailed validation errors, others return generic messages

- Zod routes return `details` field
- Manual validation routes return generic messages
- Catch blocks return generic messages (hides actual errors)

**Impact**: Inconsistent client experience, harder debugging

**Location**: All route handlers

---

Last verified against commit:
