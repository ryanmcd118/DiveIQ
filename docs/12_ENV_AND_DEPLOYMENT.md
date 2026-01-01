# Environment Variables and Deployment

## How to Run Locally

### Initial Setup

**1. Install dependencies**:
```bash
npm install
```

**2. Set up environment variables**:
Create `.env.local` file in project root (see "Environment Variables" section below)

**3. Generate Prisma client**:
```bash
npx prisma generate
```

**4. Run database migrations**:
```bash
npx prisma migrate dev
```

**5. (Optional) Seed certification definitions**:
```bash
npx prisma db seed
```

**6. Start development server**:
```bash
npm run dev
```

**Development server**: Runs on `http://localhost:3000` (Next.js default)

**Cited from**: `package.json:8` (dev script)

### Development Commands

**Start dev server**: `npm run dev` (`package.json:8`)
- Command: `next dev`
- Runs on `http://localhost:3000`
- Hot module reloading enabled

**Build for production**: `npm run build` (`package.json:9`)
- Command: `next build`
- Creates optimized production build in `.next/` directory

**Start production server**: `npm run start` (`package.json:10`)
- Command: `next start`
- Requires build to exist (run `npm run build` first)
- Runs production server on `http://localhost:3000`

**Reset database**: `npm run db:reset` (`package.json:21`)
- Command: `prisma migrate reset --force --skip-seed`
- Wipes database and re-runs all migrations
- Skips seed (add `--seed` to run seed)

**Cited from**: `package.json:7-21` (scripts section)

## Required Environment Variables

### Database

**`DATABASE_URL`**

- **Required**: Yes
- **Usage**: Prisma database connection string
- **Used in**:
  - `prisma/schema.prisma:7` - Datasource configuration
  - `prisma.config.ts:13` - Prisma config
- **Format**: `file:./prisma/dev.db` (SQLite, development)
- **Production**: SQLite file path or PostgreSQL connection string (UNVERIFIED - check production setup)

**Cited from**: 
- `prisma/schema.prisma:5-8`
- `prisma.config.ts:12-14`

### Authentication (NextAuth)

**`NEXTAUTH_SECRET`**

- **Required**: Yes (production)
- **Usage**: JWT signing secret for NextAuth sessions
- **Used in**:
  - `src/features/auth/lib/auth.ts:537` - NextAuth config
  - `src/app/api/account/password/route.ts:94, 130` - JWT encoding/decoding
  - `src/proxy.ts:43` - Token verification
- **Generation**: Use `openssl rand -base64 32` or NextAuth secret generator
- **Security**: Must be a secure random string (32+ characters recommended)

**Cited from**: 
- `src/features/auth/lib/auth.ts:537`
- `src/app/api/account/password/route.ts:94, 130`

**`NEXTAUTH_URL`**

- **Required**: Yes (production)
- **Usage**: Base URL of the application (used for OAuth callbacks)
- **Used in**: NextAuth library (implicit, not directly accessed in code)
- **Development**: `http://localhost:3000`
- **Production**: Full URL of deployed application (e.g., `https://diveiq.com`)

**Cited from**: CI workflow uses it (`.github/workflows/pr-checks.yml:16`)

### OAuth (Google)

**`GOOGLE_CLIENT_ID`**

- **Required**: Yes (if using Google OAuth)
- **Usage**: Google OAuth client ID
- **Used in**: `src/features/auth/lib/auth.ts:123` - GoogleProvider configuration

**`GOOGLE_CLIENT_SECRET`**

- **Required**: Yes (if using Google OAuth)
- **Usage**: Google OAuth client secret
- **Used in**: `src/features/auth/lib/auth.ts:124` - GoogleProvider configuration

**Cited from**: `src/features/auth/lib/auth.ts:122-125`

### External APIs

**`OPENAI_API_KEY`**

- **Required**: Yes (if using AI dive plan features)
- **Usage**: OpenAI API key for dive plan briefings
- **Used in**: `src/services/ai/openaiService.ts:11` - OpenAI client initialization
- **Format**: `sk-...` (OpenAI API key format)

**Cited from**: `src/services/ai/openaiService.ts:11`

### UploadThing (Optional)

**`UPLOADTHING_TOKEN`**

- **Required**: No (optional, only if using avatar uploads)
- **Usage**: UploadThing token for file uploads (avatars)
- **Used in**: `src/app/api/uploadthing/core.ts:7` - Validates in development mode
- **Note**: SDK v7+ expects `UPLOADTHING_TOKEN` (not `UPLOADTHING_SECRET`)

**Cited from**: `src/app/api/uploadthing/core.ts:6-12` (development validation)

### Environment Detection

**`NODE_ENV`**

- **Required**: No (set automatically by Next.js)
- **Usage**: Development vs production detection
- **Used in**: Multiple files for conditional logic (development logging, etc.)
- **Values**: `"development"` or `"production"` (set by Next.js)

**Cited from**: Used in many files (e.g., `src/features/auth/lib/auth.ts:198`, `src/lib/prisma.ts:14`)

## Build + Start Commands

### Build Command

**Command**: `npm run build` (`package.json:9`)

**What it does**: `next build`
- Compiles TypeScript
- Bundles JavaScript
- Optimizes assets
- Generates static pages (if any)
- Outputs to `.next/` directory

**Environment assumed**: Production (Next.js sets `NODE_ENV=production`)

**Required env vars for build**:
- `DATABASE_URL` (for Prisma client generation)
- Other env vars may be needed if accessed at build time (UNVERIFIED - check if any env vars are read at build time)

**Cited from**: `package.json:9`

### Start Command

**Command**: `npm run start` (`package.json:10`)

**What it does**: `next start`
- Serves the production build
- Runs Next.js production server
- Listens on port 3000 by default (configurable via `PORT` env var)

**Environment assumed**: Production

**Required**: Build must exist (run `npm run build` first)

**Required env vars**: Same as runtime (see "Required Environment Variables" section)

**Cited from**: `package.json:10`

### CI Build Process

**CI workflow** (`.github/workflows/pr-checks.yml:27-46`):

1. Install dependencies: `npm ci`
2. Generate Prisma client: `npx prisma generate`
3. Run linter: `npm run lint`
4. Check formatting: `npm run format:check`
5. Type check: `npm run typecheck`
6. Run tests: `npm run test`
7. Build: `npm run build`

**Env vars in CI**: Uses placeholder values (`.github/workflows/pr-checks.yml:14-17`):
- `DATABASE_URL: "file:./prisma/dev.db"`
- `NEXTAUTH_SECRET: "placeholder-secret-for-build-check-only"`
- `NEXTAUTH_URL: "http://localhost:3000"`
- `OPENAI_API_KEY: "sk-placeholder"`

**Cited from**: `.github/workflows/pr-checks.yml`

## Hosting/Deployment Assumptions

### No Deployment Config Found

**No deployment configuration files found**:
- ❌ No `vercel.json`
- ❌ No `.vercel/` directory
- ❌ No other deployment config files

**`.gitignore` mentions Vercel**: `.gitignore:38` ignores `.vercel` directory (suggests Vercel may be used, but no config committed)

**Cited from**: `.gitignore:38`, no vercel.json found

### Assumed Deployment Platform

**Based on Next.js defaults**: Application can be deployed to:
- **Vercel** (recommended for Next.js, zero-config)
- **Node.js server** (using `npm run build` + `npm run start`)
- Other platforms supporting Node.js (Railway, Render, etc.)

**No evidence of specific platform**: Documentation does not specify deployment target

**Cited from**: Next.js framework (supports multiple platforms)

## Prisma Migration Workflow

### Development Workflow

**Create migration**:
```bash
npx prisma migrate dev --name migration_name
```

**What it does**:
- Creates migration file in `prisma/migrations/`
- Applies migration to development database
- Regenerates Prisma client
- Runs seed script if configured (unless `--skip-seed`)

**Migration files**: Located in `prisma/migrations/` (timestamped directories)

**Cited from**: Prisma CLI documentation (standard Prisma workflow)

### Reset Database (Development)

**Command**: `npm run db:reset` (`package.json:21`)

**What it does**: `prisma migrate reset --force --skip-seed`
- Wipes database
- Re-runs all migrations from scratch
- Skips seed (add `--seed` to run seed)

**Usage**: Development only (destructive operation)

**Cited from**: `package.json:21`

### Production Workflow

**No production migration script**: No script in `package.json` for production migrations

**Standard Prisma production command**:
```bash
npx prisma migrate deploy
```

**What it does**:
- Applies pending migrations to production database
- Does NOT reset database (safe for production)
- Does NOT run seed

**Note**: This command is not in `package.json` but is the standard Prisma production migration command

**Cited from**: Prisma documentation (standard production workflow)

### Seed Script

**Location**: `prisma/seed.ts`

**Run manually**:
```bash
npx prisma db seed
```

**What it does**: Seeds `CertificationDefinition` catalog from JSON file

**Config**: `package.json:55-57` defines seed command as `tsx prisma/seed.ts`

**Auto-run**: Runs automatically after `prisma migrate dev` (unless `--skip-seed`)

**Cited from**: 
- `package.json:55-57`
- `docs/05_DATABASE.md:147-175` (seed script documentation)

### Migration History

**Migrations directory**: `prisma/migrations/`

**Migration lock**: `prisma/migrations/migration_lock.toml` (ensures compatible Prisma version)

**Current migrations**: 14 migrations (from initial schema to current state)

**Cited from**: `docs/05_DATABASE.md:99-125` (migration strategy)

## Safe Handling of Secrets

### Environment File Location

**Local development**: `.env.local` (not committed to git)

**Git ignore**: `.gitignore:35` ignores `.env*` files (all env files)

**Cited from**: `.gitignore:35`

### Secrets Security

**✅ Good practices**:
- No `.env` files in repository (checked - none found)
- `.gitignore` excludes `.env*` files
- CI uses placeholder values (not real secrets)

**❌ No `.env.example` file**: No template file for required env vars (recommendation: create one)

**Cited from**: `.gitignore:35`, no `.env.example` found

### Example .env.local Template

**Create `.env.local` file** (do not commit):

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional - only if using Google sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI API (required for AI dive plan features)
OPENAI_API_KEY="sk-your-openai-api-key"

# UploadThing (optional - only if using avatar uploads)
UPLOADTHING_TOKEN="your-uploadthing-token"
```

**Notes**:
- Replace placeholder values with actual secrets
- Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
- `DATABASE_URL` format for SQLite: `file:./prisma/dev.db`
- For PostgreSQL (production): `postgresql://user:password@host:5432/database`

**Cited from**: Environment variable usage sites documented above

### Generating NEXTAUTH_SECRET

**Command**:
```bash
openssl rand -base64 32
```

**Or use online generator**: NextAuth provides secret generators (see NextAuth docs)

**Security**: Must be at least 32 characters, random, and kept secret

### Production Secrets

**Recommendations**:
- Use platform secret management (Vercel environment variables, AWS Secrets Manager, etc.)
- Never commit secrets to git
- Rotate secrets periodically
- Use different secrets for each environment (dev, staging, prod)

**Cited from**: Security best practices

---

Last verified against commit:

