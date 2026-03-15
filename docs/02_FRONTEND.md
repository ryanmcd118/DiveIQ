# Frontend

## App Router Structure

### Route Groups

Next.js route groups organize layouts without affecting URLs:

- **`(app)/`** - Authenticated app routes with `AppShell` layout (`src/app/(app)/layout.tsx`)
  - Wraps pages with Sidebar + TopBar (`src/features/app/components/AppShell.tsx`)
  - Applied to: dashboard, dive-logs, plan, gear, profile, settings, certifications, etc.
- **`(auth)/`** - Authentication pages with auth-specific layout (`src/app/(auth)/layout.tsx`)
  - Uses `AuthLayoutClient` for background image and scroll handling (`src/app/(auth)/AuthLayoutClient.tsx`)
  - Applied to: signin, signup
- **`(public)/`** - Public routes (no auth required)
  - Applied to: public dive-plans viewer

### Layout Hierarchy

1. **Root Layout** (`src/app/layout.tsx`)
   - Wraps entire app with `SessionProvider` and `UnitSystemProvider`
   - Sets global metadata, Inter font
   - No visual layout - just providers

2. **Route Group Layouts**
   - `(app)/layout.tsx` - Server component wrapping with `AppShell` + background
   - `(auth)/layout.tsx` - Server component delegating to `AuthLayoutClient` (client component)

3. **Page Components**
   - Most pages are thin server components that render feature client components
   - Example: `src/app/(app)/dive-logs/page.tsx` fetches dive log data via repositories and renders `LogPageContent` (client logbook layout)

### Pages Pattern

**Server Component Pages** (default):

```typescript
// src/app/(app)/dive-logs/page.tsx
export default async function LogPage({ searchParams }: LogPageProps) {
  const session = await getServerSession(authOptions);
  const initialSelectedDiveId = searchParams?.diveId ?? null;

  if (!session?.user?.id) {
    return (
      <LogPageContent
        initialEntries={[]}
        initialStats={null}
        initialSelectedDiveId={initialSelectedDiveId}
        isAuthed={false}
      />
    );
  }

  const [entries, stats] = await Promise.all([
    diveLogRepository.findMany({ orderBy: "date", userId: session.user.id }),
    diveLogRepository.getStatistics(session.user.id),
  ]);

  return (
    <LogPageContent
      initialEntries={entries}
      initialStats={stats}
      initialSelectedDiveId={initialSelectedDiveId}
      isAuthed={true}
    />
  );
}
```

**Server Component with Data Fetching**:

```typescript
// src/app/(app)/dashboard/page.tsx:12-47
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const [recentDives, statistics, recentPlans] = await Promise.all([
    diveLogRepository.findMany({ ... }),
    diveLogRepository.getStatistics(userId),
    divePlanRepository.findMany({ ... }),
  ]);

  return <DashboardPageContent {...props} />;
}
```

**Server Component with Redirect**:

```typescript
// src/app/page.tsx:9-21
export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (userId) redirect("/dashboard");
  return <PublicHomePage />;
}
```

### Loading and Error Patterns

**No built-in loading.tsx or error.tsx files found** - loading/error states handled in components:

- **Loading states**: Managed in custom hooks (`useLogPageState`, `usePlanPageState`) with `useState`
  - Example: `src/features/dive-log/hooks/useLogPageState.ts:14-16` (`loading`, `saving` states)
- **Error states**: Same hooks manage error state
  - Example: `src/features/dive-log/hooks/useLogPageState.ts:16` (`error` state)
- **Auth loading**: Uses NextAuth `status === "loading"`
  - Example: `src/features/dive-plan/hooks/usePlanPageState.ts:40-42`

## Authentication State Access

### Session Provider

Root layout wraps app with `SessionProvider` (`src/app/layout.tsx:23`), which wraps NextAuth's `SessionProvider`:

```typescript
// src/features/auth/components/SessionProvider.tsx:10-12
export default function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

### Client-Side Auth Hooks

**`useAuth()` hook** (`src/hooks/useAuth.ts`):

- Wraps `useSession()` from next-auth/react
- Provides: `user`, `isAuthenticated`, `isLoading`, `signInUser()`, `signUpUser()`, `signOutUser()`
- Used in: SignInForm, SignUpForm, TopBar, etc.

**`useMe()` hook** (`src/features/auth/hooks/useMe.ts`):

- Fetches user profile from `/api/me` endpoint
- Provides: `me`, `isLoading`, `error`, `refreshMe()`
- Listens for `diveiq:me-updated` custom event to refresh (`src/features/auth/hooks/useMe.ts:61-70`)
- Used when full user profile data is needed (not just session.user)

**`useSession()` directly** (from next-auth/react):

- Used in hooks that need session status: `src/features/dive-plan/hooks/usePlanPageState.ts:40`

### Server-Side Auth

Server Components use `getServerSession(authOptions)`:

- Example: `src/app/(app)/dashboard/page.tsx:14`
- `authOptions` imported from `src/features/auth/lib/auth.ts`

## Component Organization

### Shared Components (`src/components/`)

Reusable UI components used across features:

- `AuthModal/` - Auth modal for sign-in/sign-up prompts (promoted from auth feature in DIV-65)
- `Avatar/` - Avatar display + upload modal (`Avatar.tsx`, `AvatarUploadModal.tsx`)
- `Toast.tsx` - Toast notifications
- `ConfirmModal.tsx` - Confirmation dialogs
- `UnitToggleButtons.tsx` - Pure presentational unit toggle buttons (no state/context)
- `NavbarUnitToggle.tsx` - Navbar unit toggle (uses `UnitToggleButtons` + `useUnitSystem` context)
- `FormUnitToggle.tsx` - Form-level unit toggle (uses `UnitToggleButtons` + `useUnitSystem` context)
- `UploadThingProvider.tsx` - File upload provider wrapper

**Convention**: Shared components should not import from features. Features import from components.

### Feature Components (`src/features/{feature-name}/components/`)

Feature-specific components organized by feature:

- `auth/components/` - SignInForm, SignUpForm, GoogleOAuthButton, etc. (AuthModal promoted to `src/components/AuthModal/`)
- `dive-log/components/` - LogbookForm, BasicDiveSection, AdvancedDiveSection, AddEditDiveSheet, DiveLogList, DiveLogGrid, LogbookLayout, LogPageContent, GearSelection
  - `dive-log/hooks/` - useDiveFormState, useLogPageState
  - `dive-log/utils/` - timeUtils (time conversion/normalization)
  - `LogbookLayout` - Master-detail layout with browse pane (grid/list views), detail pane, search, and sort controls (date, site name, region)
  - `DiveLogList` - List view has two modes. **Expanded (full-width, detail closed)**: table-like single-row layout with a subtle header row; columns Site, Buddy, Notes, Date, Depth, Time, Temp, Vis (plus actions). CSS Grid with explicit columns keeps all rows aligned; Notes column uses ellipsis and never overflows. **Condensed (detail pane open)**: 2×2 grid per dive (date | metrics, site | notes); buddy/region hidden. Styles in `List.module.css`.
- `dive-plan/components/` - PlanForm, PlanPageContent, AIDiveBriefing, SaveDivePlanButton
- `gear/components/` - GearPageContent, GearFormModal, GearItemCard, KitFormModal, GearListSection, KitsSection, etc.
  - `gear/hooks/` - useGearPageData, useGearArchive
- `profile/components/` - ProfilePageContent, ProfileViewSection, ProfileEditForm, etc.
  - `profile/hooks/` - useProfileForm
  - `profile/utils/` - profileUtils, parseJsonArray
- `dashboard/components/` - DashboardPageContent, StatsGrid, CertificationsCard, etc.
- `app/components/` - AppShell, Sidebar, TopBar (app-level shell components)

**Convention**: Feature components can import from `components/`, `lib/`, `hooks/`, `contexts/`, but not from other features.

### Component File Structure

```
FeatureComponent.tsx          # Component file
FeatureComponent.module.css   # Co-located CSS Module (same name)
```

Example: `src/features/dive-log/components/LogbookForm.tsx` + `LogbookForm.module.css`

## Styling Approach

### CSS Modules (Primary)

**No Tailwind usage found** - styling uses CSS Modules exclusively.

**Design System Structure** (`src/styles/`):

1. **Design Tokens** (`src/styles/design-system/tokens.css`)
   - CSS custom properties (variables) for colors, spacing, typography, shadows
   - Example: `--color-accent-primary`, `--space-4`, `--font-size-base`

2. **Typography** (`src/styles/design-system/typography.css`)
   - Font families, sizes, weights, line heights

3. **Utilities** (`src/styles/design-system/utilities.css`)
   - Utility classes (UNVERIFIED - check actual contents)

4. **Shared Component Styles** (`src/styles/components/`)
   - Reusable style modules: `Button.module.css`, `Card.module.css`, `Form.module.css`, `Layout.module.css`, etc.
   - Use CSS `composes` for variant patterns:
     ```css
     /* src/styles/components/Button.module.css:32-37 */
     .primary {
       composes: base;
       background-color: var(--color-accent-primary);
       color: var(--color-bg-primary);
     }
     ```

5. **Feature-Specific Styles**
   - Co-located with components: `ComponentName.module.css` next to `ComponentName.tsx`

### CSS Module Usage Pattern

```typescript
// Import style module
import formStyles from "@/styles/components/Form.module.css";
import cardStyles from "@/styles/components/Card.module.css";

// Use in JSX
<div className={cardStyles.card}>
  <form className={formStyles.form}>
    <label className={formStyles.label}>...</label>
  </form>
</div>
```

### Global Styles

- `src/app/globals.css` - Imported in root layout (`src/app/layout.tsx:3`)
- Imports design system tokens, typography, utilities
- Base HTML/body styles, scrollbar styling

### Theme

Dark theme optimized for diving environments - colors defined in `src/styles/design-system/tokens.css`.

## Data Fetching Patterns

### Server Components (Default)

Server Components fetch data directly via repositories:

```typescript
// src/app/(app)/dashboard/page.tsx:23-35
export default async function DashboardPage() {
  const [recentDives, statistics, recentPlans] = await Promise.all([
    diveLogRepository.findMany({ orderBy: "date", take: 3, userId }),
    diveLogRepository.getStatistics(userId),
    divePlanRepository.findMany({ orderBy: "createdAt", take: 3, userId }),
  ]);
  return <DashboardPageContent {...props} />;
}
```

**No fetch() calls** - direct database access via Prisma repositories.

### Client Components

Client components use `fetch()` in event handlers or for incremental enrichment:

**Pattern 1: Hydrate from Server Props + Mutations**

```typescript
// src/features/dive-log/hooks/useLogPageState.ts:11-35
export function useLogPageState(initialEntries: DiveLogEntry[]) {
  const [entries, setEntries] = useState<DiveLogEntry[]>(initialEntries);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutations still call /api/dive-logs (create/update/delete)
}
```

**Pattern 2: Form Submission Handler**

```typescript
// src/features/dive-log/hooks/useLogPageState.ts:124-132
const res = await fetch("/api/dive-logs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "create", payload }),
});
```

**Pattern 3: User Profile Fetching**

```typescript
// src/features/auth/hooks/useMe.ts:32
const response = await fetch("/api/me");
```

### Data Flow Summary

- **Server Components** → Direct repository access → Database
- **Client Components** → `fetch("/api/...")` → API Routes → Services/Repositories → Database

## Forms and Validation Patterns

### Form Structure

Forms use controlled inputs with React state and HTML5 validation:

```typescript
// src/features/auth/components/SignInForm.tsx:11-32
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  className={formStyles.input}
/>
```

### Form Submission Pattern

**Uncontrolled forms with FormData** (common pattern):

```typescript
// src/features/dive-log/hooks/useLogPageState.ts:72-96
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);

  // Extract values
  const maxDepthUI = formData.get("maxDepth");
  const regionValue = formData.get("region");

  // Convert units (UI → canonical)
  const maxDepthCm = depthInputToCm(maxDepthUIString, prefs.depth);

  // Submit to API
  const res = await fetch("/api/dive-logs", {
    method: "POST",
    body: JSON.stringify({ action: "create", payload }),
  });
};
```

### Unit Conversion in Forms

Forms handle unit conversion in hooks, not in components:

1. Form stores values in **UI units** (user's preference: ft/m, °F/°C)
2. Hook converts to **canonical units** (cm, C×10) before API call
3. Example: `src/features/dive-log/hooks/useLogPageState.ts:93-95`

### Form Reset Pattern

Forms use `formKey` prop to force remount on edit/new transitions:

```typescript
// src/features/dive-log/hooks/useLogPageState.ts:22, 158, 181
const [formKey, setFormKey] = useState<string>("new");

// On edit
setFormKey(`edit-${entry.id}-${Date.now()}`);

// On new
setFormKey(`new-${Date.now()}`);

// In form
<form key={formKey} onSubmit={handleSubmit}>
```

This ensures `defaultValue` attributes update correctly.

### Validation

**Client-side**: HTML5 validation (`required`, `type="email"`, etc.) + custom validation in hooks

**Server-side**: Validation in API routes (see `docs/03_BACKEND.md`)

**Validation utilities**: `src/lib/validation.ts` (UNVERIFIED - check actual exports)

### Form Error Display

Errors stored in hook state, displayed in component:

```typescript
// Hook
const [error, setError] = useState<string | null>(null);

// Component
{error && <div className={formStyles.error}>{error}</div>}
```

## Known Frontend Tech Debt

### Component Organization Notes

**Mixed patterns in component organization**:

- Most features follow `components/` pattern
- `app/` feature contains shell components (Sidebar, TopBar) - could be considered shared
- Unit toggle components consolidated (DIV-65 batch 6b): `UnitToggleButtons` (presentational), `NavbarUnitToggle` and `FormUnitToggle` (both use `UnitSystemContext`)
- Auth hooks and components promoted to shared locations (DIV-65 batch 6a): `useAuth` → `src/hooks/`, `AuthModal` → `src/components/AuthModal/`

### State Management Complexity

**Custom hooks contain significant business logic**:

- `useLogPageState.ts` (256 lines) - manages form state, API calls, unit conversion, list state
- `usePlanPageState.ts` (407 lines) - manages draft plans, AI briefing, past plans, auth state

**Trade-off**: Encapsulation vs complexity. Consider extracting API client functions or splitting hooks if they grow further.

### Form Key Remounting Pattern

The `formKey` remounting pattern (`formKey` prop to force remount) is a workaround for uncontrolled forms with `defaultValue`. While it works, it could be replaced with fully controlled inputs for better predictability.

## How to Add a New Page

1. **Create page file** in appropriate route group:

   ```
   src/app/(app)/new-feature/page.tsx
   ```

2. **Page component** (Server Component, thin wrapper):

   ```typescript
   import { Metadata } from "next";
   import { NewFeaturePageContent } from "@/features/new-feature/components/NewFeaturePageContent";

   export const metadata: Metadata = {
     title: "New Feature | DiveIQ",
   };

   export default function NewFeaturePage() {
     return <NewFeaturePageContent />;
   }
   ```

3. **Create feature component** (Client Component if interactive):

   ```
   src/features/new-feature/components/NewFeaturePageContent.tsx
   ```

4. **If data fetching needed**: Fetch in Server Component page, pass as props:

   ```typescript
   export default async function NewFeaturePage() {
     const session = await getServerSession(authOptions);
     if (!session?.user?.id) redirect("/");

     const data = await repository.findMany({ userId: session.user.id });
     return <NewFeaturePageContent data={data} />;
   }
   ```

5. **Add navigation**: Update Sidebar component (`src/features/app/components/Sidebar.tsx`)

## How to Add a New UI Component

1. **Determine location**:
   - **Shared** (used by 2+ features) → `src/components/ComponentName/`
   - **Feature-specific** → `src/features/{feature}/components/ComponentName.tsx`

2. **Create component file**:

   ```typescript
   "use client"; // Only if needs interactivity/hooks

   import styles from "./ComponentName.module.css"; // Co-located styles
   import sharedStyles from "@/styles/components/Card.module.css"; // Shared styles

   interface ComponentNameProps {
     // props
   }

   export function ComponentName({ ...props }: ComponentNameProps) {
     return <div className={styles.container}>...</div>;
   }
   ```

3. **Create CSS Module** (`ComponentName.module.css`):

   ```css
   .container {
     /* Use design tokens */
     padding: var(--space-4);
     color: var(--color-text-primary);
   }
   ```

4. **Use shared styles** when appropriate:

   ```typescript
   import cardStyles from "@/styles/components/Card.module.css";
   <div className={cardStyles.card}>...</div>
   ```

5. **Export from feature** (if feature has index):
   ```typescript
   // src/features/new-feature/index.ts
   export { ComponentName } from "./components/ComponentName";
   ```

---

Last verified against commit:
