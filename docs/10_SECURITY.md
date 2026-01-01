# Security

## Auth/Session Security

### NextAuth Configuration

**Location**: `src/features/auth/lib/auth.ts:79-538`

**Session Strategy**: JWT-based (`src/features/auth/lib/auth.ts:127-129`)

```typescript
session: {
  strategy: "jwt",
}
```

**Secret**: Uses `process.env.NEXTAUTH_SECRET` (`src/features/auth/lib/auth.ts:537`)

**Cookie Settings**: NextAuth handles cookie settings automatically. Custom cookie settings in password change handler (`src/app/api/account/password/route.ts:145-151`):

- `httpOnly: true` ✅ (prevents XSS access)
- `secure: isProduction` ✅ (HTTPS-only in production)
- `sameSite: "lax"` ✅ (CSRF protection)
- `maxAge: 30 * 24 * 60 * 60` (30 days)

**Cookie naming**:

- Production: `__Secure-next-auth.session-token` (requires HTTPS)
- Development: `next-auth.session-token`

**Cited from**: `src/app/api/account/password/route.ts:134-151`

### Session Invalidation

**Strategy**: `sessionVersion` field on User model (`prisma/schema.prisma:28`)

**How it works**:

1. User model has `sessionVersion` integer (default: 0)
2. JWT callback checks token version vs database version on every request (`src/features/auth/lib/auth.ts:399-432`)
3. Password changes increment `sessionVersion` atomically (`src/app/api/account/password/route.ts:105-119`)
4. Mismatched versions invalidate session (`src/features/auth/lib/auth.ts:418-427`)

**Cited from**:

- `src/features/auth/lib/auth.ts:399-432` (JWT callback validation)
- `src/app/api/account/password/route.ts:105-119` (sessionVersion increment)

### Password Hashing

**Algorithm**: bcrypt with 10 rounds (`src/app/api/auth/signup/route.ts:51`, `src/app/api/account/password/route.ts:89`)

**Password requirements**: Minimum 8 characters (`src/app/api/auth/signup/route.ts:31-35`, `src/app/api/account/password/route.ts:35-39`)

**Security concern**: Weak password policy - only length requirement, no complexity requirements.

## Route Protection

### Page Protection

**Pattern**: Server Components check session and redirect if unauthorized

**Example**:

```typescript
// src/app/(app)/dashboard/page.tsx:12-20 (inferred pattern from docs)
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  redirect("/");
}
```

**Protection method**: Per-route checks in Server Components (no middleware - `src/proxy.ts` exists but unused).

**Cited from**: `docs/04_AUTH.md:142-150` (documented pattern)

### API Route Protection

**Pattern**: All protected API routes check `getServerSession(authOptions)` at start

**Example** (`src/app/api/dive-logs/route.ts:15-19`):

```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Strict validation** (some routes):

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

- `/api/auth/*` (NextAuth endpoints)
- `/api/dive-plans/preview` (guest plan preview)
- `/api/auth/signup` (public signup)

**Cited from**:

- `src/app/api/dive-logs/route.ts:15-19`
- `src/app/api/dive-plans/route.ts:20-27`
- `src/app/api/profile/route.ts:35-47`

## Input Validation & Sanitization

### Validation Approaches

**Zod validation** (2 routes use it):

- `/api/certifications` - Uses `createUserCertificationSchema` (`src/app/api/certifications/route.ts:73`)
- `/api/user/preferences` - Uses Zod schema (UNVERIFIED - check `src/app/api/user/preferences/route.ts`)

**Manual validation** (most routes):

- Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (`src/app/api/auth/signup/route.ts:22-23`)
- Password length: `password.length < 8` (`src/app/api/auth/signup/route.ts:31-35`)
- Type assertions: `body as { ... }` (most routes)

**Profile normalization** (`src/app/api/profile/route.ts:336-739`):

- String trimming and null conversion
- Website URL normalization (prepend https://)
- No validation schema - manual checks

**Security concerns**:

- **Inconsistent validation**: Most routes use type assertions (no runtime validation)
- **Missing validation**: Many routes accept JSON without validating structure
- **Weak email validation**: Simple regex, doesn't follow RFC standards

**Cited from**:

- `src/app/api/auth/signup/route.ts:22-28` (email validation)
- `src/app/api/certifications/route.ts:73-78` (Zod example)
- `src/app/api/profile/route.ts:394-418` (normalization helpers)

### Input Sanitization

**React default**: React escapes values by default (XSS protection)

**No `dangerouslySetInnerHTML` found**: ✅ Safe from XSS via innerHTML

**User input storage**: Stored as-is in database (trimmed, but not HTML-escaped at storage)

**Display**: React components render user input, which is escaped automatically

**Cited from**: Grep search found no `dangerouslySetInnerHTML` or `innerHTML` usage

## Data Access Controls

### Repository Pattern

**Authorization in repositories**: Repositories check `userId` parameter matches resource owner

**Example** (`src/services/database/repositories/diveLogRepository.ts:33-40`):

```typescript
async findById(id: string, userId?: string): Promise<DiveLogEntry | null> {
  const entry = await prisma.diveLog.findUnique({ where: { id } });
  if (userId && entry && entry.userId !== userId) {
    return null; // Return null if user doesn't own the resource
  }
  return entry;
}
```

**Update/Delete checks** (`src/services/database/repositories/diveLogRepository.ts:70-75`):

```typescript
if (userId) {
  const existing = await prisma.diveLog.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Dive log not found or unauthorized");
  }
}
```

**Gear repository** (`src/services/database/repositories/gearRepository.ts:88-94`):

```typescript
async findById(id: string, userId: string): Promise<GearItem | null> {
  return prisma.gearItem.findFirst({
    where: { id, userId }, // Filters by userId in query
  });
}
```

**Double protection**: Routes check session, repositories check ownership - defensive but redundant.

**Cited from**:

- `src/services/database/repositories/diveLogRepository.ts:33-40` (findById)
- `src/services/database/repositories/diveLogRepository.ts:70-75` (update)
- `src/services/database/repositories/gearRepository.ts:88-94` (gear findById)

### Direct Prisma Usage

**Some routes bypass repositories** (less consistent protection):

- `src/app/api/profile/route.ts:57-107` - Direct Prisma queries
- `src/app/api/certifications/route.ts:84-93, 134-159` - Direct Prisma
- `src/app/api/auth/signup/route.ts:39-61` - Direct Prisma (acceptable for auth)

**Security impact**: Routes that bypass repositories rely on route-level checks only (session validation).

**Cited from**: `docs/03_BACKEND.md:513-523` (documented pattern)

## Secrets Handling

### Environment Variables

**Secrets used**:

- `NEXTAUTH_SECRET` - NextAuth JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `OPENAI_API_KEY` - OpenAI API key
- `DATABASE_URL` - Database connection string

**Access patterns**:

- `process.env.NEXTAUTH_SECRET` (`src/features/auth/lib/auth.ts:537`)
- `process.env.GOOGLE_CLIENT_ID!` (`src/features/auth/lib/auth.ts:123`)
- `process.env.GOOGLE_CLIENT_SECRET!` (`src/features/auth/lib/auth.ts:124`)
- `process.env.OPENAI_API_KEY` (`src/services/ai/openaiService.ts:11`)

**No hardcoded secrets**: ✅ All secrets from environment variables

**No `.env` files in repo**: ✅ (checked - no `.env*` files found)

**CI environment**: Uses placeholder values for build checks (`.github/workflows/pr-checks.yml:14-17`)

**Cited from**:

- `src/features/auth/lib/auth.ts:123-124, 537`
- `src/services/ai/openaiService.ts:11`
- `.github/workflows/pr-checks.yml:14-17`

### Logging Concerns

**Development-only logging**: Some routes log session data in development (`src/app/api/profile/route.ts:16-24`):

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("[GET /api/profile] Session:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    userContents: session?.user,
  });
}
```

**Error logging**: Routes log errors with `console.error()` (`src/app/api/dive-logs/route.ts:61`, `src/app/api/auth/signup/route.ts:75`)

**Security concern**: Error logs may contain sensitive data in stack traces (but errors are generic in responses - good practice).

**No secret logging found**: ✅ No environment variables logged directly

**Cited from**:

- `src/app/api/profile/route.ts:16-24` (development logging)
- `src/app/api/dive-logs/route.ts:61` (error logging)

## CSRF/XSS Considerations

### CSRF Protection

**Next.js default**: Next.js API routes have built-in CSRF protection for same-origin requests

**NextAuth**: NextAuth handles CSRF tokens for OAuth flows automatically

**Cookie settings**: `sameSite: "lax"` prevents cross-site request forgery (`src/app/api/account/password/route.ts:148`)

**No additional CSRF middleware**: Relies on Next.js/NextAuth defaults

**Cited from**: `src/app/api/account/password/route.ts:148` (cookie sameSite setting)

### XSS Protection

**React default**: React escapes all values rendered in JSX (prevents XSS)

**No `dangerouslySetInnerHTML`**: ✅ No unsafe HTML rendering found

**User input storage**: User input stored as-is (trimmed) but displayed via React (auto-escaped)

**JSON fields**: JSON fields stored as strings (e.g., `primaryDiveTypes`, `typicalDivingEnvironment`) - if rendered, should be parsed and escaped (UNVERIFIED - check how JSON fields are displayed)

**Cited from**: Grep search found no `dangerouslySetInnerHTML` or `innerHTML` usage

## Dependencies

### Security Tooling

**No Dependabot configuration found**: ❌ No `.github/dependabot.yml` file

**No npm audit in CI**: ❌ `.github/workflows/pr-checks.yml` doesn't run `npm audit`

**No security scripts in package.json**: ❌ No `audit`, `audit:fix`, or security-related scripts

**Security gaps**:

- No automated dependency vulnerability scanning
- No automated security updates
- Manual dependency updates only

**Cited from**:

- `.github/workflows/pr-checks.yml` (no audit step)
- `package.json` (no audit scripts)
- No `.github/dependabot.yml` file found

### Dependency Versions

**Key dependencies** (from `package.json`):

- Next.js 16.0.7 (latest stable)
- NextAuth 4.24.13 (latest stable)
- Prisma 6.19.0 (latest stable)
- React 19.2.0 (latest)
- bcryptjs 3.0.3 (stable)

**Dependency health**: Appears to use recent versions, but no automated monitoring.

## Threat Model (Lite)

**Top 10 realistic threats for this application:**

### 1. Weak Password Policy (P1)

**Threat**: Users can set weak passwords (only 8 character minimum)

**Mitigation**: Current password policy only enforces length (`src/app/api/auth/signup/route.ts:31-35`)

**Recommendation**: Add password complexity requirements or use a password strength checker

**Cited from**: `src/app/api/auth/signup/route.ts:31-35`

---

### 2. Session Hijacking via XSS (P0)

**Threat**: XSS attack steals session cookies (even with httpOnly, JWT in cookies could be stolen)

**Mitigation**:

- ✅ Cookies are `httpOnly` (prevents JavaScript access)
- ✅ React escapes user input (prevents XSS)
- ✅ No `dangerouslySetInnerHTML` found

**Risk level**: Low (good protections in place)

**Cited from**: `src/app/api/account/password/route.ts:146` (httpOnly), React default escaping

---

### 3. Inconsistent Input Validation (P1)

**Threat**: Unvalidated input leads to data corruption, injection, or crashes

**Mitigation**:

- ❌ Most routes use type assertions (no runtime validation)
- ✅ 2 routes use Zod validation
- ❌ Profile route has 400+ lines of manual validation

**Recommendation**: Standardize on Zod schemas for all API routes

**Cited from**: `src/app/api/auth/signup/route.ts` (manual), `src/app/api/certifications/route.ts:73` (Zod)

---

### 4. SQL Injection (P0)

**Threat**: Malicious SQL input in queries

**Mitigation**:

- ✅ Uses Prisma ORM (parameterized queries)
- ✅ No raw SQL queries found
- ✅ Repository pattern uses Prisma client

**Risk level**: Very low (Prisma protects against SQL injection)

**Cited from**: All database access via Prisma (`src/services/database/repositories/*.ts`)

---

### 5. Unauthorized Data Access (P0)

**Threat**: Users access/modify other users' data

**Mitigation**:

- ✅ Routes check session
- ✅ Repositories check `userId` ownership
- ✅ Double protection (redundant but secure)

**Risk level**: Low (good access controls)

**Cited from**: `src/services/database/repositories/diveLogRepository.ts:33-40, 70-75`

---

### 6. Credential Stuffing / Brute Force (P1)

**Threat**: Attackers attempt to guess passwords

**Mitigation**:

- ❌ No rate limiting on sign-in endpoint
- ❌ No account lockout after failed attempts
- ✅ Passwords hashed with bcrypt (slows brute force)

**Recommendation**: Add rate limiting to `/api/auth/signin` (NextAuth endpoint)

**Cited from**: NextAuth handles sign-in, but no rate limiting configured

---

### 7. Dependency Vulnerabilities (P1)

**Threat**: Vulnerable dependencies with known CVEs

**Mitigation**:

- ❌ No automated vulnerability scanning (no Dependabot)
- ❌ No `npm audit` in CI
- ✅ Dependencies appear recent (but unverified)

**Recommendation**: Add Dependabot and `npm audit` to CI

**Cited from**: No security tooling found (`.github/workflows/pr-checks.yml`, `package.json`)

---

### 8. Session Fixation (P0)

**Threat**: Attacker forces user to use known session ID

**Mitigation**:

- ✅ NextAuth handles session creation securely
- ✅ Session invalidation on password change works correctly
- ✅ JWT-based sessions (not session IDs)

**Risk level**: Low (NextAuth protects against this)

**Cited from**: `src/features/auth/lib/auth.ts:127-129` (JWT strategy)

---

### 9. OAuth Account Linking Vulnerabilities (P1)

**Threat**: Attacker links malicious Google account to existing email/password account

**Mitigation**:

- ✅ Account linking requires email match (`src/features/auth/lib/auth.ts:224-298`)
- ✅ Existing accounts are updated, not overwritten
- ⚠️ No email verification step before linking

**Recommendation**: Require email verification before linking OAuth accounts

**Cited from**: `src/features/auth/lib/auth.ts:224-298` (OAuth account linking logic)

---

### 10. Information Disclosure via Error Messages (P1)

**Threat**: Error messages leak sensitive information (stack traces, database errors)

**Mitigation**:

- ✅ Generic error messages in responses (`src/app/api/dive-logs/route.ts:63`)
- ⚠️ Error details logged to console (may appear in logs)
- ✅ Development-only detailed logging (`src/app/api/profile/route.ts:16-24`)

**Recommendation**: Ensure production logs don't expose sensitive data

**Cited from**: `src/app/api/dive-logs/route.ts:61-64` (error handling)

---

## Security TODOs

### P0 (Critical - Fix Immediately)

**None identified** - Current security posture is acceptable for MVP/prototype stage.

**Note**: SQL injection, session hijacking, and unauthorized access are well-protected.

---

### P1 (High Priority - Address Soon)

1. **Add input validation to all API routes**
   - **Action**: Standardize on Zod schemas for all route handlers
   - **Files**: `src/app/api/*/route.ts` (most routes)
   - **Impact**: Prevents invalid data, reduces crash risk, improves security

2. **Add dependency vulnerability scanning**
   - **Action**: Add Dependabot (`.github/dependabot.yml`) and `npm audit` to CI
   - **Files**: `.github/dependabot.yml` (create), `.github/workflows/pr-checks.yml` (add audit step)
   - **Impact**: Detects vulnerable dependencies automatically

3. **Strengthen password policy**
   - **Action**: Add password complexity requirements or strength checker
   - **Files**: `src/app/api/auth/signup/route.ts`, `src/app/api/account/password/route.ts`
   - **Impact**: Reduces risk of weak passwords

4. **Add rate limiting to authentication endpoints**
   - **Action**: Add rate limiting middleware to NextAuth endpoints (or use Next.js middleware)
   - **Files**: `src/app/api/auth/[...nextauth]/route.ts` or middleware
   - **Impact**: Prevents brute force attacks

5. **Email verification for OAuth account linking**
   - **Action**: Require email verification before linking Google account to existing email/password account
   - **Files**: `src/features/auth/lib/auth.ts:224-298`
   - **Impact**: Prevents unauthorized account linking

---

### P2 (Medium Priority - Address When Possible)

1. **Audit error logging for sensitive data**
   - **Action**: Review all `console.error()` calls to ensure no secrets/sensitive data logged
   - **Files**: All `src/app/api/*/route.ts` files
   - **Impact**: Prevents information disclosure via logs

2. **Add Content Security Policy (CSP) headers**
   - **Action**: Configure CSP headers in Next.js middleware or `next.config.ts`
   - **Files**: `next.config.ts` or middleware
   - **Impact**: Additional XSS protection layer

3. **Add security headers (HSTS, X-Frame-Options, etc.)**
   - **Action**: Configure security headers in Next.js config
   - **Files**: `next.config.ts`
   - **Impact**: Defense in depth

4. **Review JSON field rendering for XSS**
   - **Action**: Verify JSON fields (e.g., `primaryDiveTypes`) are safely rendered
   - **Files**: Profile/display components (UNVERIFIED - check where JSON fields are rendered)
   - **Impact**: Ensures JSON fields don't introduce XSS

5. **Document secret rotation procedure**
   - **Action**: Create runbook for rotating `NEXTAUTH_SECRET`, OAuth secrets, API keys
   - **Files**: Documentation (new file or README)
   - **Impact**: Operational security

---

Last verified against commit:
