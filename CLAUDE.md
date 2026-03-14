# CLAUDE.md

DiveIQ — full-stack scuba dive planning and logging app. Next.js 16 App Router, React 19, TypeScript, Prisma/SQLite (migrating to PostgreSQL via DIV-41), NextAuth v4 JWT, OpenAI, CSS Modules.

## Commands

```bash
npm run dev                                       # Dev server (localhost:3000)
npm run check                                     # lint + format + typecheck + test + build — MUST PASS before every commit
npm run lint:fix && npm run format                # Auto-fix style issues
npx vitest run src/__tests__/units.test.ts        # Single test file
npx prisma migrate dev --name descriptive_name   # Create + apply migration
npx prisma generate                               # Regenerate client after schema changes
npx prisma db seed                                # Seed certification definitions
```

**`npm run check` must pass with 0 errors and all tests passing before every commit and PR.**

## Branching and PRs

- Branch name: use the `gitBranchName` field from the Linear ticket exactly
- PRs: `gh pr create` against `main` — no auto-merge flags
- Never mark a Linear ticket Done without explicit confirmation from Ryan

## Architecture

```
src/app/               # Route handlers (thin — auth check → validate → service → response)
src/features/{name}/   # Feature modules: components/, hooks/, services/, types.ts
src/services/database/repositories/  # Sole Prisma boundary — all DB access here
src/lib/prisma.ts      # Prisma singleton — never instantiate new PrismaClient()
src/components/        # Shared UI
src/lib/               # Shared utilities
```

No cross-feature imports. Shared code goes in `src/components/`, `src/lib/`, `src/hooks/`, `src/contexts/`.

Auth check on all routes: `getServerSession(authOptions)` from `src/features/auth/lib/auth.ts`.

## Critical gotchas — do not touch without understanding these

- **sessionVersion**: `User.sessionVersion` increments on password change; checked in every JWT callback. Do not modify auth session logic without fully reading `src/features/auth/lib/auth.ts`.
- **Nullable userId**: `DiveLog.userId` and `DivePlan.userId` are **intentionally** `String?` — reserved for future guest support. Do not make them non-nullable.
- **DIV-41 migration pending**: DB is currently SQLite. Do not run `prisma migrate dev` on DIV-42 branch until DIV-41 switches provider to `postgresql`.
- **resolveHighestCert()** lives in `src/features/dive-plan/services/riskCalculator.ts` — imported by `openaiService.ts`. Do not duplicate.
- **NDL table + interpolateNdl()** exported from `riskCalculator.ts` — used by form validation. Do not duplicate.
- **Known direct Prisma usage** (do not refactor): `profile/route.ts`, `certifications/route.ts`, auth routes — acceptable exceptions.
- **`src/proxy.ts`** exists but is unused — not wired as `middleware.ts`. Leave it alone.

## Docs

Project docs in `docs/` — maintained by agents, consult before starting any ticket, update when making relevant changes. Treat existing content as potentially stale.

Key files: `docs/01_ARCHITECTURE.md`, `docs/05_DATABASE.md`, `docs/08_ROADMAP_AND_DEBT.md`, `docs/12_ENV_AND_DEPLOYMENT.md`.
