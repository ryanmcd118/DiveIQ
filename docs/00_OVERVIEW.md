# DiveIQ - Project Overview

## Documentation Contract

This documentation follows strict guidelines to ensure accuracy and maintainability:

1. **File Path Citations**: All claims about implementation details must cite exact file paths (e.g., `src/features/auth/lib/auth.ts:45-52`)
2. **Update Requirements**: When code changes affect architecture, data flows, or major conventions, the relevant documentation file must be updated in the same PR
3. **Version Tracking**: Each documentation file ends with a "Last verified against commit:" line to track when it was last reviewed

---

## Documentation Index

Complete list of documentation files in `/docs`:

- **`00_OVERVIEW.md`** (this file) - High-level project overview, tech stack, folder structure, and navigation index. **When to read**: Start here for first-time onboarding or quick project orientation.

- **`01_ARCHITECTURE.md`** - Dependency boundaries, request flow diagrams, and system architecture patterns. **When to read**: Architecture reviews, understanding how layers interact, onboarding to system design.

- **`02_FRONTEND.md`** - App Router structure, component organization, styling (CSS Modules), data fetching patterns, forms, and frontend tech debt. **When to read**: Frontend feature work, adding new pages/components, understanding React patterns.

- **`03_BACKEND.md`** - API route structure, validation patterns, error handling, business logic organization, core backend flows, and backend tech debt. **When to read**: Backend feature work, API development, understanding request/response patterns.

- **`04_AUTH.md`** - NextAuth configuration, JWT/session behavior, route protection, OAuth vs credentials differences, with sequence diagrams. **When to read**: Authentication features, security reviews, understanding session management.

- **`05_DATABASE.md`** - Prisma schema overview, ERD diagram, core models, migration strategy, seed/backfill scripts, common query patterns, and schema smells. **When to read**: Database changes, schema migrations, understanding data model.

- **`06_TESTING_CI.md`** - What `npm run check` does, CI workflow, canary tests, debugging CI failures, testing rules of thumb. **When to read**: Writing tests, debugging CI, understanding test patterns.

- **`08_ROADMAP_AND_DEBT.md`** - Technical debt items, refactor candidates, and prioritized improvement plans. **When to read**: Planning refactoring, understanding code quality issues, technical debt reviews.

- **`09_CONVENTIONS.md`** - Folder structure, naming conventions, validation patterns, business logic boundaries, error handling, data access patterns, testing conventions, styling conventions. **When to read**: Day-to-day coding, onboarding to code style, before making architectural changes.

- **`10_SECURITY.md`** - Auth/session security, route protection, input validation, data access controls, secrets handling, CSRF/XSS considerations, threat model, security TODOs. **When to read**: Security reviews, adding auth features, security audits.

- **`11_PERFORMANCE.md`** - Rendering strategy, data fetching, bundle risks, images/fonts, React performance, database performance (N+1, pagination), CI/perf checks, quick wins. **When to read**: Performance optimization, debugging slow queries, bundle analysis.

- **`12_ENV_AND_DEPLOYMENT.md`** - Local setup commands, required environment variables, build/start commands, deployment assumptions, Prisma migration workflow, secrets handling, `.env.local` template. **When to read**: Setting up development environment, deployment, environment configuration.

## Recommended Reading Order

### Path 1: New to the Codebase (High-Level)

**Goal**: Understand what the project does and its high-level structure.

1. `00_OVERVIEW.md` (this file) - Start here
2. `01_ARCHITECTURE.md` - Understand system architecture
3. `12_ENV_AND_DEPLOYMENT.md` - Get development environment set up
4. `09_CONVENTIONS.md` - Learn coding standards

**Time estimate**: 30-60 minutes

---

### Path 2: Working on Features Day-to-Day

**Goal**: Understand patterns and conventions for feature development.

1. `00_OVERVIEW.md` - Quick project orientation
2. `09_CONVENTIONS.md` - Coding conventions (naming, structure, patterns)
3. `02_FRONTEND.md` or `03_BACKEND.md` - Depending on your work (frontend vs backend)
4. `06_TESTING_CI.md` - Testing patterns and CI setup
5. Reference `08_ROADMAP_AND_DEBT.md` when planning changes

**Time estimate**: 1-2 hours initial, then reference as needed

---

### Path 3: Preparing for Interviews / Architecture Review

**Goal**: Deep understanding of system design and technical decisions.

1. `00_OVERVIEW.md` - Project overview and tech stack
2. `01_ARCHITECTURE.md` - System architecture and boundaries
3. `04_AUTH.md` - Authentication and security architecture
4. `05_DATABASE.md` - Data model and schema design
5. `10_SECURITY.md` - Security posture and threat model
6. `11_PERFORMANCE.md` - Performance characteristics and trade-offs
7. `08_ROADMAP_AND_DEBT.md` - Known issues and improvement opportunities

**Time estimate**: 2-3 hours for comprehensive review

## How to Use These Docs

**Start with**: `00_OVERVIEW.md` (this file) to orient yourself with the project structure and find the right documentation for your task.

**For quick answers**: Use the Documentation Index above to jump directly to the relevant doc. Each doc is self-contained but cross-references others where helpful.

**Depth depends on context**:

- **Quick feature work**: Read `09_CONVENTIONS.md` + relevant feature doc (`02_FRONTEND.md` or `03_BACKEND.md`)
- **Architecture changes**: Read `01_ARCHITECTURE.md` + relevant layer docs + `09_CONVENTIONS.md`
- **Security changes**: Read `04_AUTH.md` + `10_SECURITY.md`
- **Database changes**: Read `05_DATABASE.md` + `03_BACKEND.md`
- **Performance work**: Read `11_PERFORMANCE.md` + relevant layer docs

**Staying in sync**: These docs are meant to reflect the current codebase state. Each doc cites file paths, so you can verify claims against actual code. When code changes affect documented patterns, update the relevant doc in the same PR (see Documentation Maintenance Rules below).

**Unverified content**: Some sections are marked "UNVERIFIED" - these are hypotheses that need verification against the codebase. Treat them as starting points for investigation.

## Documentation Maintenance Rules

**When code changes affect documentation**:

1. **Frontend changes** → Update `02_FRONTEND.md`:
   - New component patterns or organization
   - Changes to App Router structure
   - Styling approach changes
   - New data fetching patterns

2. **Backend changes** → Update `03_BACKEND.md`:
   - New API routes or patterns
   - Validation approach changes
   - Error handling pattern changes
   - Business logic reorganization

3. **Authentication/security changes** → Update `04_AUTH.md` and/or `10_SECURITY.md`:
   - NextAuth configuration changes
   - Route protection pattern changes
   - Session/security model changes
   - New security measures

4. **Database changes** → Update `05_DATABASE.md`:
   - Schema changes (new models, fields, relationships)
   - Migration strategy changes
   - Query pattern changes
   - Repository pattern changes

5. **Infrastructure/deployment changes** → Update `12_ENV_AND_DEPLOYMENT.md`:
   - New environment variables
   - Build/deployment process changes
   - Hosting platform changes
   - Migration workflow changes

6. **Convention changes** → Update `09_CONVENTIONS.md`:
   - Naming convention changes
   - Folder structure changes
   - Pattern standardization
   - New coding standards

7. **Architecture changes** → Update `01_ARCHITECTURE.md`:
   - Dependency boundary changes
   - New architectural patterns
   - System design changes

**PR requirements**: PRs that affect architecture, data flows, major conventions, or security must update at least one relevant documentation file in the same PR.

**Citation requirements**: All non-trivial claims must cite exact file paths (e.g., `src/features/auth/lib/auth.ts:45-52`). Avoid speculative descriptions - if unsure, mark as "UNVERIFIED" with notes on what to check.

**Version tracking**: Each doc ends with "Last verified against commit:" - update this when making substantive changes to reflect the commit hash.

---

## Project Description

AI-powered dive planning and logging application for scuba divers. See `README.md` for full description.

## Technology Stack

Verified from `package.json`:

- **Next.js 16.0.7** (`package.json:30`) - Full-stack React framework with App Router
- **React 19.2.0** (`package.json:34`) - UI library with Server Components support
- **TypeScript** (`package.json:52`, `tsconfig.json`) - Type-safe JavaScript
- **NextAuth 4.24.13** (`package.json:31`) - Authentication library, configured in `src/features/auth/lib/auth.ts`
- **Prisma 6.19.0** (`package.json:33`) - ORM for database access, schema in `prisma/schema.prisma`
- **SQLite** (`prisma/schema.prisma:6-7`) - Database (development), accessed via Prisma client in `src/lib/prisma.ts`
- **OpenAI API** (`package.json:32`) - AI service for dive plan analysis, used in `src/services/ai/openaiService.ts`
- **Vitest** (`package.json:53`, `vitest.config.ts`) - Testing framework
- **UploadThing** (`package.json:37`) - File upload service for avatars, configured in `src/app/api/uploadthing/`

## Project Structure

Top-level directories (2-3 levels deep):

```
diveiq/
├── src/
│   ├── app/                      # Next.js App Router (pages and API routes)
│   │   ├── (app)/               # Authenticated app routes (group route)
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── dive-logs/       # Dive log listing page
│   │   │   ├── plan/            # Dive plan creation page
│   │   │   ├── gear/            # Gear management page
│   │   │   ├── profile/         # User profile page
│   │   │   ├── settings/        # Settings page
│   │   │   ├── certifications/  # Certifications page
│   │   │   └── layout.tsx       # App shell layout (Sidebar + TopBar)
│   │   ├── (auth)/              # Authentication routes (group route)
│   │   │   ├── signin/          # Sign-in page
│   │   │   ├── signup/          # Sign-up page
│   │   │   └── layout.tsx       # Auth layout
│   │   ├── (public)/            # Public routes (group route)
│   │   │   └── dive-plans/      # Public dive plan viewer
│   │   ├── api/                 # API routes (REST endpoints)
│   │   │   ├── auth/            # NextAuth endpoints
│   │   │   ├── dive-plans/      # Dive plan CRUD
│   │   │   ├── dive-logs/       # Dive log CRUD
│   │   │   ├── gear/            # Gear CRUD
│   │   │   ├── profile/         # Profile management
│   │   │   ├── certifications/  # Certification management
│   │   │   └── uploadthing/     # File upload endpoints
│   │   ├── layout.tsx           # Root layout (SessionProvider, UnitSystemProvider)
│   │   └── page.tsx             # Home page
│   ├── features/                # Feature modules (feature-based architecture)
│   │   ├── auth/                # Authentication feature
│   │   │   ├── components/      # Auth UI components
│   │   │   ├── hooks/           # useAuth, useMe hooks
│   │   │   └── lib/             # auth.ts (NextAuth config)
│   │   ├── dive-log/            # Dive logging feature
│   │   ├── dive-plan/           # Dive planning feature (AI integration)
│   │   ├── gear/                # Gear tracking feature
│   │   ├── certifications/      # Certification management feature
│   │   ├── dashboard/           # Dashboard feature
│   │   ├── profile/             # User profile feature
│   │   ├── settings/            # Settings feature
│   │   ├── app/                 # App shell components (Sidebar, TopBar)
│   │   └── public-home/         # Public landing page components
│   ├── components/              # Shared/reusable UI components
│   │   ├── Avatar/              # Avatar component + upload modal
│   │   ├── Toast/               # Toast notification
│   │   ├── ConfirmModal/        # Confirmation dialog
│   │   └── UnitToggle/          # Unit system toggle
│   ├── contexts/                # React contexts
│   │   └── UnitSystemContext.tsx # Unit preferences context
│   ├── hooks/                   # Shared custom hooks
│   │   ├── useUnitPreferences.ts
│   │   └── useUnitSystemOrLocal.ts
│   ├── lib/                     # Utility libraries
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── units.ts             # Unit conversion utilities
│   │   ├── validation.ts        # Validation helpers
│   │   └── diveMath.ts          # Dive calculations
│   ├── services/                # Service layer
│   │   ├── ai/                  # OpenAI service
│   │   ├── database/            # Repository pattern
│   │   │   └── repositories/    # Data access layer
│   │   └── weather/             # Weather service (UNVERIFIED - check usage)
│   └── styles/                  # CSS Modules and design system
│       ├── design-system/       # Design tokens
│       └── components/          # Shared component styles
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Database migration history
│   └── seed.ts                  # Database seeding script
├── public/                      # Static assets
├── scripts/                     # Utility scripts
├── .github/workflows/           # CI/CD (GitHub Actions)
└── package.json                 # Dependencies and scripts
```

## Primary Feature Modules

Based on `src/features/` directory structure:

1. **auth** - Authentication (NextAuth, sign in/up, OAuth)
2. **dive-log** - Dive logging (create, edit, list dives)
3. **dive-plan** - Dive planning with AI analysis (OpenAI integration)
4. **gear** - Gear tracking (items, kits, maintenance)
5. **certifications** - Certification management
6. **dashboard** - Dashboard/stats overview
7. **profile** - User profile management
8. **settings** - User settings and preferences
9. **app** - App shell components (Sidebar, TopBar, layouts)
10. **public-home** - Public landing page

## Core User Flows

Hypothesized flows with primary file citations:

### Authentication Flows

- **Sign up**: `src/app/(auth)/signup/page.tsx` → `src/features/auth/components/SignUpForm.tsx` → `src/features/auth/hooks/useAuth.ts:36-82` → `src/app/api/auth/signup/route.ts`
- **Sign in (credentials)**: `src/app/(auth)/signin/page.tsx` → `src/features/auth/components/SignInForm.tsx` → `src/features/auth/hooks/useAuth.ts:12-34` → `src/features/auth/lib/auth.ts` (NextAuth credentials provider)
- **Sign in (Google OAuth)**: `src/features/auth/components/GoogleOAuthButton.tsx` → `src/features/auth/lib/auth.ts` (Google provider)

### Dive Planning Flows

- **Create dive plan**: `src/app/(app)/plan/page.tsx` → `src/features/dive-plan/components/PlanPageContent.tsx` → `src/features/dive-plan/components/PlanForm.tsx` → `src/app/api/dive-plans/preview/route.ts` (preview) or `src/app/api/dive-plans/route.ts:19-101` (save)
- **Save dive plan**: `src/features/dive-plan/components/SaveDivePlanButton.tsx` → `src/app/api/dive-plans/route.ts:19-101` → `src/services/ai/openaiService.ts` (AI briefing) → `src/services/database/repositories/divePlanRepository.ts`
- **View saved plans**: `src/app/(app)/plan/page.tsx` → `src/features/dive-plan/components/PastPlansList.tsx` → `src/app/api/dive-plans/route.ts:202-224` (GET)

### Dive Logging Flows

- **Create dive log**: `src/app/(app)/dive-logs/page.tsx` → `src/features/dive-log/components/LogPageContent.tsx` → `src/features/dive-log/components/DiveLogForm.tsx` → `src/app/api/dive-logs/route.ts:81-197` (POST with action="create")
- **List dive logs**: `src/app/(app)/dive-logs/page.tsx` → `src/features/dive-log/components/DiveLogList.tsx` → `src/app/api/dive-logs/route.ts:14-67` (GET)
- **Edit dive log**: `src/features/dive-log/hooks/useLogPageState.ts` → `src/app/api/dive-logs/route.ts:136-173` (POST with action="update")

### Profile Flows

- **View profile**: `src/app/(app)/profile/page.tsx` → `src/features/profile/components/ProfilePageContent.tsx` → `src/app/api/profile/route.ts:11-328` (GET)
- **Edit profile**: `src/features/profile/components/ProfilePageContent.tsx` → `src/app/api/profile/route.ts:336-739` (PATCH)

### Dashboard Flow

- **View dashboard**: `src/app/(app)/dashboard/page.tsx:12-47` (server component) → fetches data via repositories → `src/features/dashboard/components/DashboardPageContent.tsx`

### Gear Management Flows

- **Manage gear**: `src/app/(app)/gear/page.tsx` → `src/features/gear/components/GearPageContent.tsx` → `src/app/api/gear/route.ts`
- **Manage gear kits**: `src/features/gear/components/KitsSection.tsx` → `src/app/api/gear-kits/route.ts`

## Development Setup

UNVERIFIED - check for setup instructions in README or create setup guide based on:

- `package.json` scripts (dev, build, test, db:reset)
- `prisma/schema.prisma` for database setup
- Environment variables needed (DATABASE_URL, NEXTAUTH_SECRET, OPENAI_API_KEY, etc.)

## Quick Start

UNVERIFIED - verify startup steps from README or package.json scripts.

## Frontend at a Glance

See `docs/02_FRONTEND.md` for detailed frontend documentation.

**Key folders:**

- `src/app/` - Next.js App Router pages and API routes
- `src/features/` - Feature-based component organization
- `src/components/` - Shared/reusable UI components
- `src/styles/` - CSS Modules and design system (tokens, shared component styles)

**Stack:**

- Next.js 16 App Router with Server/Client Components
- React 19 with hooks for state management
- CSS Modules (no Tailwind) with design token system
- NextAuth for authentication (client: `useSession()`, server: `getServerSession()`)

**Data fetching:**

- Server Components: Direct repository access
- Client Components: `fetch()` to API routes

## Security & Auth Overview

See `docs/04_AUTH.md` for detailed authentication documentation and `docs/10_SECURITY.md` for comprehensive security analysis.

**Authentication:**

- NextAuth.js with JWT sessions (configured in `src/features/auth/lib/auth.ts`)
- Two providers: Credentials (email/password) and Google OAuth
- Session invalidation via `sessionVersion` field (password changes invalidate other sessions)

**Key security decisions:**

- **JWT-based sessions** (not database sessions) for scalability
- **Session versioning** (`User.sessionVersion`) to invalidate all sessions on password change
- **Per-route auth checks** in Server Components and API handlers (no middleware currently active)
- **Password hashing** with bcrypt (10 rounds)
- **Account linking** supports email/password + Google OAuth on same account

**Protected routes:**

- Server Components: Check `getServerSession()` and redirect if not authenticated
- API routes: Check `getServerSession()` and return 401 if not authenticated
- All protected routes manually check auth (no centralized middleware - `src/proxy.ts` exists but unused)

**Security posture:**

- **Strong**: SQL injection protected (Prisma ORM), XSS protected (React escaping), session security (httpOnly cookies, JWT)
- **Areas for improvement**: Input validation inconsistent (mostly manual, only 2 routes use Zod), no dependency scanning (no Dependabot), weak password policy (8 char minimum only)
- **See `docs/10_SECURITY.md`** for detailed security analysis, threat model, and prioritized security TODOs

## Conventions and Patterns

See `docs/09_CONVENTIONS.md` for detailed coding conventions and standards.

**Key conventions:**

- Feature-based architecture: Each major feature lives in `src/features/{feature-name}/`
- API routes follow REST patterns in `src/app/api/{resource}/route.ts`
- CSS Modules: Component styles use `.module.css` files
- Repository pattern: Data access via `src/services/database/repositories/`
- Server-first: Most pages are Server Components, client components marked with `"use client"`

**Naming conventions:**

- Components: PascalCase (`DiveLogForm.tsx`)
- Hooks: camelCase with `use` prefix (`useLogPageState.ts`)
- Types: PascalCase (`DiveLogEntry`, `PlanInput`)
- Repositories: camelCase with `Repository` suffix (`diveLogRepository`)

## How to Verify a Change

**Before committing, run the full quality check**:

```bash
npm run check
```

This runs (in order, stops on first failure):

1. `npm run lint` - ESLint code quality checks
2. `npm run format:check` - Prettier formatting validation
3. `npm run typecheck` - TypeScript type checking
4. `npm run test` - Run test suite (Vitest)
5. `npm run build` - Next.js production build

**Individual checks** (if you want to run separately):

```bash
# Fix linting issues
npm run lint:fix

# Auto-format code
npm run format:write

# Run tests in watch mode (during development)
npm run test:watch

# Type check only
npm run typecheck
```

**See `docs/06_TESTING_CI.md` for detailed testing and CI documentation.**

## Performance Notes

See `docs/11_PERFORMANCE.md` for detailed performance analysis.

**Rendering**: Server-first architecture with client components for interactivity. All pages use `force-dynamic` (no caching).

**Data fetching**: Server Components fetch via repositories with `Promise.all()` for parallelism. Client Components use `fetch()` to API routes.

**Performance concerns**:

- **N+1 query**: Dive logs gear loading uses N queries instead of 1 (`src/app/api/dive-logs/route.ts:46-57`)
- **Unbounded queries**: Dive logs API loads all entries without pagination
- **No caching**: All pages `force-dynamic`, no ISR/static generation
- **No performance monitoring**: No bundle analyzer, Lighthouse, or query timing in CI

**Quick wins available**: Pagination, N+1 fix, bundle analyzer, date indexes (1-2 hours each)

**Cited from**: `docs/11_PERFORMANCE.md`

---

Last documentation index review:

Last verified against commit:
