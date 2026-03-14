# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm run start         # Start production server

# Quality checks (run before committing)
npm run check         # lint + format:check + typecheck + test + build
npm run lint          # ESLint
npm run lint:fix      # Auto-fix ESLint errors
npm run format        # Prettier auto-format
npm run format:check  # Check formatting without fixing
npm run typecheck     # tsc --noEmit (strict mode)
npm run test          # vitest run (single pass)
npm run test:watch    # vitest (watch mode)

# Single test file
npx vitest run src/__tests__/units.test.ts

# Database
npx prisma migrate dev --name migration_name  # Create migration
npx prisma generate                           # Regenerate Prisma client
npx prisma db seed                            # Seed certification definitions
npm run db:reset                              # Reset DB (skips seed)
```

## Environment Variables

Required in `.env`:

- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `DATABASE_URL` — SQLite path (e.g., `file:/path/to/prisma/dev.db`)
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `UPLOADTHING_TOKEN`

## Architecture

DiveIQ is a Next.js 16 App Router application with React 19 Server Components, Prisma/SQLite, NextAuth, and OpenAI integration.

### Route Groups

- `src/app/(app)/` — Authenticated routes (dashboard, logbook, plan, gear, certifications, etc.) with AppShell layout
- `src/app/(auth)/` — Sign-in/sign-up pages
- `src/app/(public)/` — Public routes (no auth required)
- `src/app/api/` — RESTful API routes (`src/app/api/{resource}/route.ts`)

### Layer Hierarchy

```
Pages/Route Handlers (src/app/)
  └── Feature Modules (src/features/{name}/)
        └── Shared Components (src/components/)
              └── Services Layer (src/services/)
                    └── Lib Utilities (src/lib/)
```

Key rules:

- **Server Components** (pages) fetch data directly via repositories, pass to client feature components
- **Client Components** call API routes via `fetch()`
- **API routes** orchestrate: auth check → validate → service/repository → response. No business logic here.
- **No cross-feature imports** — features must not import from other features; shared code goes in `src/components/`, `src/lib/`, `src/hooks/`, `src/contexts/`
- All routes check auth via `getServerSession(authOptions)` from `src/features/auth/lib/auth.ts`

### Feature Module Structure

Each feature lives at `src/features/{feature-name}/`:

- `components/` — Feature-specific UI components
- `hooks/` — Custom React hooks (e.g., `useLogPageState`, `usePlanPageState`)
- `types.ts` — TypeScript types + Zod validation schemas
- `services/` — Feature-specific business logic (optional)

### Data Access

All DB access should go through repositories in `src/services/database/repositories/`:

- `diveLogRepository.ts`, `divePlanRepository.ts`, `gearRepository.ts`, `certificationRepository.ts`

Repositories enforce user-scoped authorization. Import Prisma only via the singleton at `src/lib/prisma.ts` — never instantiate `new PrismaClient()`.

Some routes still use Prisma directly (known inconsistency): `profile/route.ts`, `certifications/route.ts`, and auth routes (acceptable exception).

### Database Schema

SQLite via Prisma. Schema at `prisma/schema.prisma`. Key models:

- **User** — auth + profile (large model with 30+ fields; authentication fields + dive-specific profile)
- **DiveLog** — dive entries; `maxDepthCm` (integer cm), `waterTempCx10` (integer, tenths of °C) — fixed-point storage
- **DivePlan** — AI-generated plans with `riskLevel` and `aiAdvice`
- **GearItem / GearKit / GearKitItem** — gear inventory and kit management
- **UserCertification / CertificationDefinition** — certification catalog (seeded) + user certs

`DiveLog.userId` and `DivePlan.userId` are nullable (reserved for future guest support).

### Authentication

NextAuth v4 with JWT strategy. Config at `src/features/auth/lib/auth.ts`.

- Credentials provider (email/password via bcrypt) + Google OAuth
- Session invalidation via `User.sessionVersion` — incremented on password change, checked in every JWT callback
- `src/proxy.ts` exists but is currently **unused** (not wired as `middleware.ts`)

### Styling

CSS Modules throughout — co-locate `ComponentName.module.css` with each component. Design tokens (colors, spacing, typography) in `src/styles/design-system/tokens.css`. Shared component styles in `src/styles/components/`. Tailwind is available but CSS Modules are primary.

### AI Integration

OpenAI used for dive plan briefings. Service at `src/services/ai/openaiService.ts`. Dive plan risk is also calculated locally via `src/features/dive-plan/services/riskCalculator.ts`.

## Conventions

### Naming

- Components: `PascalCase` — props interface: `{ComponentName}Props`
- Hooks: `camelCase` with `use` prefix
- Types: `PascalCase`; input types suffix `Input`, response types suffix `Response`
- Zod schemas: `camelCase` with `Schema` suffix, defined in feature `types.ts`, exported alongside inferred types

### API Error Responses

```typescript
return NextResponse.json(
  { error: "Human-readable message" },
  { status: 400 | 401 | 404 | 409 | 500 }
);
// With validation details:
return NextResponse.json(
  { error: "Invalid input", details: result.error.issues },
  { status: 400 }
);
// Log with context:
console.error("GET /api/dive-logs error", err);
```

### Validation

Prefer Zod schemas in feature `types.ts` over manual validation in route handlers. Use `schema.safeParse(body)` in route handlers.

### Testing

- Tests in `src/__tests__/*.test.ts` using Vitest (node environment, `@` alias → `./src`)
- Pure functions: no mocks needed
- API routes / repositories: mock Prisma via `vi.mock("@/lib/prisma", ...)`
- No React component tests (no jsdom/RTL setup), no E2E framework
