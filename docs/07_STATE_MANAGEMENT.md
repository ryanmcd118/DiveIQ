# State Management

## Part 1 — State Inventory

### 1. Authentication/Session State

**What it represents**: Current user session, authentication status, user profile data

**Where it lives**:

- **Server**: `getServerSession(authOptions)` in Server Components (`src/app/(app)/dashboard/page.tsx:14`, `src/app/page.tsx:11`)
- **Client**: NextAuth `useSession()` hook (`src/features/auth/hooks/useAuth.ts:8`, `src/features/dive-log/hooks/useLogPageState.ts:40`)
- **Custom hook**: `useAuth()` wraps `useSession()` with sign-in/sign-up/sign-out helpers (`src/features/auth/hooks/useAuth.ts:7-96`)
- **User data hook**: `useMe()` fetches fresh user data from `/api/me` (`src/features/auth/hooks/useMe.ts:15-82`)

**Who owns it**:

- NextAuth library (session management)
- `SessionProvider` in root layout (`src/app/layout.tsx:23`)
- Feature hooks (`useAuth`, `useMe`) for convenience wrappers

**How it changes**:

- User signs in/out via `useAuth().signInUser()` / `signOutUser()` (`src/features/auth/hooks/useAuth.ts:12-86`)
- Session updates propagate via NextAuth's React Context
- `useMe()` refreshes on custom event `diveiq:me-updated` (`src/features/auth/hooks/useMe.ts:61-70`)

**How it persists**:

- JWT stored in httpOnly cookie (NextAuth default)
- Survives refresh (cookie-based)
- Does NOT sync across tabs (each tab has independent session check)
- Session invalidated on password change via `sessionVersion` (`docs/04_AUTH.md`)

**Cited from**:

- `src/features/auth/hooks/useAuth.ts`
- `src/features/auth/hooks/useMe.ts`
- `src/app/layout.tsx:23`
- `src/app/(app)/dashboard/page.tsx:14`

---

### 2. Unit Preferences State

**What it represents**: User's preferred unit system (metric/imperial) for depth, temperature, pressure, weight

**Where it lives**:

- **Global Context**: `UnitSystemContext` for authenticated users (`src/contexts/UnitSystemContext.tsx:18-71`)
- **localStorage**: Guest users store in `localStorage.getItem("diveiq:unitSystem")` (`src/contexts/UnitSystemContext.tsx:22,29`)
- **Unified hook**: `useUnitPreferences()` handles both authenticated (DB) and guest (localStorage) modes (`src/hooks/useUnitPreferences.ts:29-160`)
- **Legacy hook**: `useUnitSystemOrLocal()` switches between context and local state (`src/hooks/useUnitSystemOrLocal.ts:12-61`)

**Who owns it**:

- `UnitSystemProvider` in root layout (`src/app/layout.tsx:24`)
- Individual components for guest mode (localStorage directly)

**How it changes**:

- Authenticated: `useUnitPreferences().setPrefs()` → API call → DB update (`src/hooks/useUnitPreferences.ts:114-153`)
- Guest: localStorage update + custom event `unitSystemChanged` (`src/hooks/useUnitPreferences.ts:141-149`)
- Toggle components call `setUnitSystem()` or `toggleUnitSystem()` (`src/contexts/UnitSystemContext.tsx:44-50`)

**How it persists**:

- Authenticated: Stored in DB (`User.unitPreferences` JSON field), survives refresh, syncs across tabs (via DB)
- Guest: localStorage only, survives refresh, does NOT sync across tabs (no event listener for cross-tab)
- Default: `"metric"` if not set (`src/contexts/UnitSystemContext.tsx:34`)

**Cited from**:

- `src/contexts/UnitSystemContext.tsx`
- `src/hooks/useUnitPreferences.ts`
- `src/app/layout.tsx:24`

---

### 3. Form Input State

**What it represents**: User input in forms (dive plans, dive logs, profile, gear, etc.)

**Where it lives**:

- **Controlled inputs**: `useState` for unit-bearing fields (e.g., `maxDepth`, `waterTemp`) (`src/features/dive-plan/components/PlanForm.tsx:43-46`, `src/features/dive-log/components/DiveLogForm.tsx:54-67`)
- **Uncontrolled inputs**: `defaultValue` + `FormData` extraction on submit (`src/features/dive-plan/components/PlanForm.tsx:76,91`, `src/features/dive-log/hooks/useLogPageState.ts:78-102`)
- **Form reset pattern**: `formKey` prop forces remount to reset uncontrolled inputs (`src/features/dive-log/hooks/useLogPageState.ts:22,62,158`)

**Who owns it**:

- Page-level hooks: `useLogPageState()`, `usePlanPageState()` (`src/features/dive-log/hooks/useLogPageState.ts:11-256`, `src/features/dive-plan/hooks/usePlanPageState.ts:12-407`)
- Form components: Local `useState` for controlled fields
- Complex forms: `ProfilePageContent` manages draft state separately (`src/features/profile/components/ProfilePageContent.tsx:91-124`)

**How it changes**:

- User types in inputs (controlled: `onChange` → `setState`, uncontrolled: native form state)
- Form submission: `FormData` extracted, converted to canonical units, sent to API (`src/features/dive-log/hooks/useLogPageState.ts:72-172`)
- Edit mode: `setEditingEntryId()` → form populated from entry → `formKey` updated (`src/features/dive-log/hooks/useLogPageState.ts:174-182`)

**How it persists**:

- Does NOT persist between page refreshes (ephemeral)
- Saved data persists in DB (via API), reloaded on mount
- Draft state lost on refresh (no localStorage for drafts)

**Cited from**:

- `src/features/dive-log/hooks/useLogPageState.ts`
- `src/features/dive-plan/hooks/usePlanPageState.ts`
- `src/features/dive-plan/components/PlanForm.tsx:43-55`
- `src/features/profile/components/ProfilePageContent.tsx:91-124`

---

### 4. API/Fetched Data State

**What it represents**: Data fetched from API routes (dive logs, plans, gear, certifications, profile)

**Where it lives**:

- **Server Components**: Direct repository calls, passed as props (`src/app/(app)/dashboard/page.tsx:23-35`)
- **Client Components**: `useState` for data + loading + error (`src/features/dive-log/hooks/useLogPageState.ts:13-16`, `src/features/dive-plan/hooks/usePlanPageState.ts:30-33`)
- **Custom hooks**: Encapsulate fetch logic (`useLogPageState`, `usePlanPageState`, `useMe`)

**Who owns it**:

- Page-level hooks own the state
- Feature components consume via props or hook return values

**How it changes**:

- On mount: `useEffect` → `fetch()` → `setState` (`src/features/dive-log/hooks/useLogPageState.ts:32-55`)
- After mutations: Optimistic update or refetch (`src/features/dive-log/hooks/useLogPageState.ts:146-150`)
- Manual refresh: `useMe().refreshMe()` (`src/features/auth/hooks/useMe.ts:72-74`)

**How it persists**:

- Does NOT persist between refreshes (refetched on mount)
- Server Components: Fresh data on every request (`force-dynamic` everywhere, `src/app/(app)/dashboard/page.tsx:10`)
- Client Components: Fetched on mount, cached in component state until unmount

**Cited from**:

- `src/app/(app)/dashboard/page.tsx:23-35` (Server Component)
- `src/features/dive-log/hooks/useLogPageState.ts:32-55` (Client Component)
- `src/features/dive-plan/hooks/usePlanPageState.ts:45-80`

---

### 5. UI State (Modals, Toggles, Sidebar)

**What it represents**: UI visibility/state (modals open/closed, sidebar collapsed, filters active, etc.)

**Where it lives**:

- **Component-level `useState`**: Most UI state is local (`src/features/gear/components/GearPageContent.tsx:22-25`, `src/features/settings/components/DeleteAccountModal.tsx:18-20`)
- **localStorage**: Sidebar collapse state (`src/features/app/components/Sidebar.tsx:34-38,60`)
- **URL params**: Some state derived from `useSearchParams()` (`src/features/auth/components/SignInForm.tsx:16,19-22`)

**Who owns it**:

- Individual components own their UI state
- Sidebar state shared via localStorage + custom events (`src/features/app/components/Sidebar.tsx:62-64`)

**How it changes**:

- User interactions (clicks, toggles)
- Custom events for cross-component sync (`sidebarToggle`, `unitSystemChanged`)
- URL params for OAuth error messages (derived state, not set in effect)

**How it persists**:

- Sidebar collapse: localStorage, survives refresh (`src/features/app/components/Sidebar.tsx:60`)
- Modals/filters: Ephemeral, reset on unmount
- URL params: Survive refresh (part of URL)

**Cited from**:

- `src/features/app/components/Sidebar.tsx:34-65`
- `src/features/gear/components/GearPageContent.tsx:22-25`
- `src/features/auth/components/SignInForm.tsx:16-22`

---

### 6. Page-Level Feature State

**What it represents**: Complex state for entire pages (dive log page, dive plan page, profile page)

**Where it lives**:

- **Custom hooks**: `useLogPageState()`, `usePlanPageState()` (`src/features/dive-log/hooks/useLogPageState.ts`, `src/features/dive-plan/hooks/usePlanPageState.ts`)
- **Component state**: `ProfilePageContent` manages its own state (`src/features/profile/components/ProfilePageContent.tsx:84-124`)

**Who owns it**:

- Page component or page-level hook

**What it includes**:

- Form state (editing, draft values)
- API data (entries, plans, profile)
- UI state (loading, errors, modals)
- Derived state (total bottom time, `src/features/dive-log/hooks/useLogPageState.ts:26-29`)

**How it changes**:

- User actions trigger handlers that update multiple state variables
- Form submission updates both local state and API data

**How it persists**:

- Mixed: Some state persists (API data refetched), some ephemeral (form drafts)

**Cited from**:

- `src/features/dive-log/hooks/useLogPageState.ts:11-256`
- `src/features/dive-plan/hooks/usePlanPageState.ts:12-407`
- `src/features/profile/components/ProfilePageContent.tsx:82-124`

---

## Part 2 — Server vs Client State (Pattern Map)

### Pattern 1: Server Component → Props → Client Component

**Example**: Dashboard page loads data on server, passes to client component

**Flow**:

1. **Page loads**: `src/app/(app)/dashboard/page.tsx` (Server Component)
2. **Server fetch**: `getServerSession()` + `Promise.all([diveLogRepository.findMany(), diveLogRepository.getStatistics(), divePlanRepository.findMany()])` (`src/app/(app)/dashboard/page.tsx:23-35`)
3. **Client render**: Props passed to `DashboardPageContent` (Client Component) (`src/app/(app)/dashboard/page.tsx:38-45`)

**State management**:

- Server: No React state (direct async/await)
- Client: Receives props, may have local UI state (modals, filters)

**Caching**: None - `export const dynamic = "force-dynamic"` (`src/app/(app)/dashboard/page.tsx:10`)

**Cited from**: `src/app/(app)/dashboard/page.tsx`

---

### Pattern 2: Client Component → API Route → State Update

**Example**: User submits dive log form, API call updates local state

**Flow**:

1. **User submits form**: `DiveLogForm` calls `handleSubmit` (`src/features/dive-log/hooks/useLogPageState.ts:72`)
2. **API call**: `fetch("/api/dive-logs", { method: "POST", body: JSON.stringify({ action: "create", payload }) })` (`src/features/dive-log/hooks/useLogPageState.ts:124-132`)
3. **UI update**: On success, `setEntries((prev) => [entryWithGear, ...prev])` (optimistic update) (`src/features/dive-log/hooks/useLogPageState.ts:146-150`)
4. **Form reset**: `form.reset()`, `setFormKey()` to remount form (`src/features/dive-log/hooks/useLogPageState.ts:153-158`)

**State management**:

- Loading: `setSaving(true)` → `setSaving(false)` (`src/features/dive-log/hooks/useLogPageState.ts:74,170`)
- Error: `setError(null)` → `setError("Failed...")` on catch (`src/features/dive-log/hooks/useLogPageState.ts:75,164-168`)
- Success: Optimistic update to `entries` state

**Cited from**: `src/features/dive-log/hooks/useLogPageState.ts:72-172`

---

### Pattern 3: Cross-Page Shared State (Unit Preferences)

**Example**: User changes unit system, all pages reflect change

**Flow**:

1. **User toggles unit**: `NavbarUnitToggle` calls `setUnitSystem()` (`src/contexts/UnitSystemContext.tsx:44-46`)
2. **Context update**: `UnitSystemContext` state updates, localStorage persisted (`src/contexts/UnitSystemContext.tsx:38-42`)
3. **All consumers re-render**: Components using `useUnitSystem()` or `useUnitPreferences()` get new value
4. **Guest mode**: Custom event `unitSystemChanged` dispatched for localStorage-only components (`src/hooks/useUnitPreferences.ts:145-148`)

**State management**:

- Global: React Context (`UnitSystemContext`)
- Persistence: localStorage (guest) or DB (authenticated)
- Cross-tab: Authenticated users sync via DB, guests do NOT sync (localStorage only)

**Cited from**:

- `src/contexts/UnitSystemContext.tsx`
- `src/hooks/useUnitPreferences.ts:114-153`

---

### Next.js Caching Patterns

**Current approach**: No caching

**Evidence**:

- All pages use `export const dynamic = "force-dynamic"`:
  - `src/app/page.tsx:7`
  - `src/app/(app)/dashboard/page.tsx:10`
  - `src/app/(app)/profile/page.tsx:11`
  - `src/app/(app)/plan/page.tsx:12`
  - `src/app/(app)/settings/page.tsx:11`
  - `src/app/(public)/dive-plans/page.tsx:16`

**No revalidation**: No `revalidate` or `cache` settings found

**Impact**: Every page request fetches fresh data from database

**Cited from**: Grep results for `force-dynamic` in `src/app/`

---

## Part 3 — Global State (What Exists, What Doesn't)

### Existing Global State

**1. Unit System Context** (`src/contexts/UnitSystemContext.tsx`)

- **Provider**: `UnitSystemProvider` in root layout (`src/app/layout.tsx:24`)
- **What it stores**: `unitSystem: "metric" | "imperial"`
- **Scope**: Authenticated users only (guest users use localStorage directly)
- **Persistence**: localStorage for guests, DB for authenticated

**2. Session Provider** (NextAuth)

- **Provider**: `SessionProvider` in root layout (`src/app/layout.tsx:23`)
- **What it stores**: NextAuth session (user, JWT token)
- **Scope**: Global (all pages)
- **Persistence**: httpOnly cookie

**Cited from**: `src/app/layout.tsx:23-24`

---

### No Global State Library

**Confirmed**: No Zustand, Redux, Jotai, or other global state library

**Evidence**:

- `package.json` dependencies: Only Next.js, React, Prisma, NextAuth, OpenAI, UploadThing (`package.json:23-37`)
- No state management libraries found in dependencies
- No store files found in codebase

**Why**: Current architecture uses:

- React Context for unit preferences (minimal global state)
- Server Components for data fetching (no client-side cache needed)
- Custom hooks for feature-level state (encapsulated, not global)

**Cited from**: `package.json`, no state library imports found

---

### Shared Providers

**Root layout providers** (`src/app/layout.tsx:23-24`):

1. `SessionProvider` (NextAuth) - wraps entire app
2. `UnitSystemProvider` - wraps entire app

**No other global providers found**

**Cited from**: `src/app/layout.tsx`

---

## Part 4 — Recommendations

### A) Endorsement / Keep-as-is

**Current approach is reasonable for product stage**

**What's working well**:

1. **Server-first architecture**: Server Components fetch directly from repositories, minimal client-side data fetching (`src/app/(app)/dashboard/page.tsx:23-35`)
2. **Feature-level hooks**: `useLogPageState()`, `usePlanPageState()` encapsulate complex state well (`src/features/dive-log/hooks/useLogPageState.ts`, `src/features/dive-plan/hooks/usePlanPageState.ts`)
3. **Minimal global state**: Only unit preferences in Context, which is appropriate for cross-cutting concern
4. **Clear boundaries**: Server vs client state is well-separated

**Risks that are manageable**:

1. **No caching**: `force-dynamic` everywhere means every page load hits DB. Acceptable for current scale, but watch for performance as data grows.
2. **No cross-tab sync for guests**: Unit preferences in localStorage don't sync across tabs for guests. Low impact (preference, not critical data).
3. **Form state lost on refresh**: Draft forms don't persist. Acceptable UX for current product stage.

**What to watch for as app grows**:

- If API calls become slow, consider React Query or SWR for client-side caching
- If cross-page state sharing increases, consider Zustand (lightweight, no boilerplate)
- If form drafts need persistence, add localStorage or DB draft storage

**Cited from**: Patterns documented in Parts 1-3

---

### B) Incremental Improvements (No Big Rewrites)

**1. Normalize API State Patterns**

**Current**: Each hook implements its own loading/error/data pattern (`useLogPageState`, `usePlanPageState`, `useMe`)

**Improvement**: Create shared `useApiState<T>()` hook

```typescript
// src/hooks/useApiState.ts (new file)
function useApiState<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ... standard pattern
}
```

**Impact**: Reduces duplication in `useLogPageState`, `usePlanPageState`, `useMe`

**Files to update**:

- Create `src/hooks/useApiState.ts`
- Refactor `src/features/dive-log/hooks/useLogPageState.ts:32-55`
- Refactor `src/features/dive-plan/hooks/usePlanPageState.ts:45-80`
- Refactor `src/features/auth/hooks/useMe.ts:21-53`

**Risk**: Low - internal refactor, no behavior change

---

**2. Centralize Fetch Helpers**

**Current**: Direct `fetch()` calls scattered across hooks (`src/features/dive-log/hooks/useLogPageState.ts:35,124`, `src/features/dive-plan/hooks/usePlanPageState.ts:60`)

**Improvement**: Create `src/lib/apiClient.ts` with typed helpers

```typescript
// src/lib/apiClient.ts (new file)
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
```

**Impact**: Consistent error handling, easier to add auth headers, request logging

**Files to update**:

- Create `src/lib/apiClient.ts`
- Replace `fetch()` calls in hooks with `apiGet()`, `apiPost()`, etc.

**Risk**: Low - wrapper functions, same behavior

---

**3. Use `useReducer` for Complex Forms**

**Current**: `ProfilePageContent` has 10+ `useState` calls (`src/features/profile/components/ProfilePageContent.tsx:84-124`)

**Improvement**: Consolidate to `useReducer` for form state

**Impact**: Easier to reason about form state changes, single source of truth

**Files to update**:

- `src/features/profile/components/ProfilePageContent.tsx:91-124` (draftProfile state)

**Risk**: Medium - refactor complex component, test thoroughly

---

**4. Lift State to Page-Level in Specific Cases**

**Current**: `GearPageContent` manages gear items + kits + modals all in one component (`src/features/gear/components/GearPageContent.tsx:18-25`)

**Improvement**: Create `useGearPageState()` hook (similar to `useLogPageState`)

**Impact**: Better separation of concerns, easier to test, reusable logic

**Files to update**:

- Create `src/features/gear/hooks/useGearPageState.ts`
- Refactor `src/features/gear/components/GearPageContent.tsx`

**Risk**: Low - extract existing logic, no behavior change

---

**5. Improve Cross-Tab Sync for Unit Preferences (Guests)**

**Current**: Guest unit preferences in localStorage don't sync across tabs

**Improvement**: Use `storage` event listener

```typescript
// In UnitSystemContext or useUnitPreferences
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "diveiq:unitSystem") {
      setUnitSystem(e.newValue as UnitSystem);
    }
  };
  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);
```

**Impact**: Better UX for guests with multiple tabs

**Files to update**:

- `src/contexts/UnitSystemContext.tsx:37-42` (add storage listener)
- `src/hooks/useUnitPreferences.ts:78-111` (add storage listener for guest mode)

**Risk**: Low - additive feature, no breaking changes

---

**6. Standardize Form Reset Pattern**

**Current**: `formKey` prop used to force remount (`src/features/dive-log/hooks/useLogPageState.ts:22,62,158`)

**Improvement**: Create `useFormReset()` hook that handles key generation + form reset

**Impact**: Consistent form reset across all forms

**Files to update**:

- Create `src/hooks/useFormReset.ts`
- Use in `useLogPageState`, `usePlanPageState`

**Risk**: Low - extract pattern, no behavior change

---

**7. Add Optimistic Updates Helper**

**Current**: Optimistic updates implemented inline (`src/features/dive-log/hooks/useLogPageState.ts:146-150`)

**Improvement**: Create `useOptimisticUpdate<T>()` hook

**Impact**: Consistent optimistic update pattern, easier rollback on error

**Files to update**:

- Create `src/hooks/useOptimisticUpdate.ts`
- Use in `useLogPageState`, `usePlanPageState`

**Risk**: Low - extract pattern, no behavior change

---

**8. Document State Lifecycle**

**Current**: No clear documentation on when state is created/destroyed

**Improvement**: Add JSDoc comments to hooks explaining state lifecycle

**Impact**: Easier onboarding, clearer mental model

**Files to update**:

- Add JSDoc to `useLogPageState`, `usePlanPageState`, `useUnitPreferences`

**Risk**: None - documentation only

---

**9. Extract Modal State Pattern**

**Current**: Modal open/close state scattered (`src/features/gear/components/GearPageContent.tsx:22-25`)

**Improvement**: Create `useModal()` hook

```typescript
// src/hooks/useModal.ts (new file)
function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  return { isOpen, open, close };
}
```

**Impact**: Consistent modal pattern, less boilerplate

**Files to update**:

- Create `src/hooks/useModal.ts`
- Use in `GearPageContent`, `ProfilePageContent`, etc.

**Risk**: Low - extract pattern, no behavior change

---

**10. Add Loading Skeletons**

**Current**: Loading states show nothing or spinner (`src/features/dive-log/hooks/useLogPageState.ts:15`)

**Improvement**: Add skeleton components for better perceived performance

**Impact**: Better UX during data fetching

**Files to update**:

- Create skeleton components in `src/components/Skeletons/`
- Use in `DashboardPageContent`, `DiveLogList`, etc.

**Risk**: Low - additive UI improvement

---

### C) Global Store Justification

**Current assessment**: **NOT justified** for current product stage

**Why**:

- Minimal global state (only unit preferences)
- Server Components handle most data fetching (no client-side cache needed)
- Feature-level hooks encapsulate state well
- No evidence of prop drilling or state synchronization issues

**If evidence emerges** (watch for these signs):

- Prop drilling 3+ levels deep
- Multiple components need same fetched data
- Complex state synchronization between pages
- Performance issues from redundant API calls

**If needed, recommend**: **Zustand**

**Why Zustand**:

- Minimal boilerplate (no actions, reducers, providers)
- Works well with Next.js (no SSR issues)
- Small bundle size (~1KB)
- TypeScript-first

**Migration plan** (if needed, 3-5 steps):

1. **Install Zustand**: `npm install zustand`
2. **Create store for shared API data** (e.g., `useDiveLogStore`, `useGearStore`)
3. **Migrate one feature** (e.g., dive logs) to test pattern
4. **Gradually migrate** other features if pattern proves useful
5. **Keep Server Components** for initial data load, use store for client-side updates

**DO NOT migrate**:

- Unit preferences (Context is fine for this)
- Form state (local to forms)
- UI state (local to components)

**Cited from**: Current architecture analysis (Parts 1-3)

---

## Part 5 — Summary

**Current state management approach**: Server-first with feature-level hooks, minimal global state

**Strengths**:

- Clear server/client boundaries
- Encapsulated feature state
- Minimal global state (appropriate for product stage)

**Areas for improvement**:

- Normalize API state patterns
- Extract common patterns (modals, form reset)
- Improve cross-tab sync for guests
- Add loading skeletons

**No global store needed** at current stage, but watch for prop drilling or state sync issues as app grows.

---

Last verified against commit:
