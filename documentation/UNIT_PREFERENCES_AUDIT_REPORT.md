# DiveIQ Unit Preferences Migration - Technical Audit & Implementation Plan

**Date:** 2025-01-XX  
**Status:** Pre-Implementation Audit  
**Goal:** Migrate from per-page Metric/Imperial navbar toggle to persisted per-user unit preferences managed from `/settings`

---

## Executive Summary

DiveIQ currently uses a **localStorage-based unit toggle** in the navbar that applies globally but is **not persisted per-user**. The `/settings` page has a UI for unit preferences (Depth, Temperature, Pressure, Weight) but it's **disabled and non-functional**. This audit maps the current implementation and provides a concrete migration plan to:

1. Store per-user unit preferences in the database
2. Remove navbar toggle components
3. Apply preferences globally across all measurement displays
4. Support mixed units per category (e.g., ft + °C)

---

## 1. Current State Map

### 1.1 Unit Toggle Components

#### **NavbarUnitToggle** (`src/components/NavbarUnitToggle.tsx`)
- **Purpose:** Global unit toggle for authenticated users
- **State Management:** Uses `UnitSystemContext` (global React context)
- **Storage:** Persists to `localStorage` key `'diveiq:unitSystem'`
- **Rendered In:**
  - `src/features/auth/components/AuthNav.tsx` (line 37) - authenticated users
  - `src/features/app/components/TopBar.tsx` (line 59) - conditional on path
- **Current Behavior:** Toggles between `'metric'` and `'imperial'` globally (all measurement types)

#### **NavbarUnitToggleLocal** (`src/components/NavbarUnitToggleLocal.tsx`)
- **Purpose:** Local-state toggle for logged-out users
- **State Management:** Component-local state (not context)
- **Storage:** Persists to `localStorage` key `'diveiq:unitSystem'`
- **Rendered In:**
  - `src/features/auth/components/AuthNav.tsx` (line 57) - only on `/dive-plans` page for logged-out users
- **Current Behavior:** Same as NavbarUnitToggle but isolated to logged-out users

#### **FormUnitToggle** (`src/components/FormUnitToggle.tsx`)
- **Purpose:** Form-level toggle for logged-out users on plan form
- **State Management:** Component-local state
- **Storage:** Persists to `localStorage` key `'diveiq:unitSystem'`
- **Rendered In:**
  - `src/features/dive-plan/components/PlanForm.tsx` (line 86) - only when `!isAuthenticated`
- **Current Behavior:** Allows unit switching during plan creation for guests

### 1.2 Unit System Context & Hooks

#### **UnitSystemContext** (`src/contexts/UnitSystemContext.tsx`)
- **Purpose:** Global React context provider for unit system state
- **Storage:** `localStorage` key `'diveiq:unitSystem'`
- **Default:** `'metric'`
- **SSR Handling:** Starts with `'metric'` to prevent hydration mismatches, loads from localStorage after mount
- **Wrapped In:** `src/app/layout.tsx` (line 24) - wraps entire app
- **Exports:** `useUnitSystem()` hook

#### **useUnitSystemOrLocal** (`src/hooks/useUnitSystemOrLocal.ts`)
- **Purpose:** Hybrid hook that uses context when authenticated, local state when logged out
- **Behavior:** 
  - Authenticated: returns `useUnitSystem()` context
  - Logged out: uses local state + listens to `'unitSystemChanged'` custom events
- **Used In:**
  - `src/features/dive-plan/hooks/usePlanPageState.ts` (line 13)

### 1.3 Unit Conversion & Formatting Utilities

#### **Core Utilities** (`src/lib/units.ts`)
- **Conversion Functions:**
  - `mToFt(meters)` / `ftToM(feet)` - depth/distance
  - `cToF(celsius)` / `fToC(fahrenheit)` - temperature
- **Display Functions:**
  - `displayDepth(valueMeters, unitSystem)` → `{ value: string, unit: 'm' | 'ft' }`
  - `displayTemperature(valueCelsius, unitSystem)` → `{ value: string, unit: '°C' | '°F' }`
  - `displayDistance(valueMeters, unitSystem)` → same as depth
- **Input Conversion:**
  - `uiToMetric(uiValue, unitSystem, type)` → converts UI input to metric for DB storage
  - `metricToUI(metricValue, unitSystem, type)` → converts DB metric to UI display
- **Current Limitation:** Only supports binary `'metric'` | `'imperial'` - no per-category granularity

### 1.4 Settings Page UI (Non-Functional)

#### **SettingsPageContent** (`src/features/settings/components/SettingsPageContent.tsx`)
- **Lines 273-380:** Units section with 4 dropdowns (Depth, Temperature, Pressure, Weight)
- **Current State:**
  - Local component state (lines 33-38) - not persisted
  - All dropdowns are **disabled** (lines 298, 321, 344, 367)
  - No API integration
  - No save functionality
- **UI Values:**
  - Depth: `"meters" | "feet"`
  - Temperature: `"celsius" | "fahrenheit"`
  - Pressure: `"bar" | "psi"` (not currently used in app)
  - Weight: `"kg" | "lb"` (not currently used in app)

---

## 2. Files & Components Involved

### 2.1 Unit Toggle Components (TO REMOVE)
- `src/components/NavbarUnitToggle.tsx` - navbar toggle for authenticated users
- `src/components/NavbarUnitToggleLocal.tsx` - navbar toggle for logged-out users
- `src/components/FormUnitToggle.tsx` - form toggle for logged-out plan form
- `src/components/UnitToggle.tsx` - generic toggle component (if exists)

### 2.2 Context & Hooks (TO REFACTOR)
- `src/contexts/UnitSystemContext.tsx` - needs to fetch from API instead of localStorage
- `src/hooks/useUnitSystemOrLocal.ts` - may be simplified or removed

### 2.3 Measurement Display Components (TO UPDATE)
- `src/features/dashboard/components/StatsGrid.tsx` - displays deepestDive, avgDepth
- `src/features/dashboard/components/InFocusCards.tsx` - displays plan depth, dive depth/temp
- `src/features/dashboard/components/ActivityTabs.tsx` - displays dive/plan depths in lists
- `src/features/dive-log/components/DiveLogList.tsx` - displays depth, visibility, temp
- `src/features/dive-log/components/DiveLogForm.tsx` - form inputs with unit labels
- `src/features/dive-plan/components/PlanForm.tsx` - form inputs with unit labels

### 2.4 Form Submission Handlers (TO UPDATE)
- `src/features/dive-log/hooks/useLogPageState.ts` - converts UI units to metric on submit
- `src/features/dive-plan/hooks/usePlanPageState.ts` - converts UI units to metric on submit

### 2.5 API Routes (TO CREATE/UPDATE)
- `src/app/api/user/preferences/route.ts` - **NEW** - GET/PATCH user preferences
- `src/app/api/me/route.ts` - **UPDATE** - include preferences in response

### 2.6 Settings Page (TO ENABLE)
- `src/features/settings/components/SettingsPageContent.tsx` - enable dropdowns, add save functionality

### 2.7 Unit Utilities (TO EXTEND)
- `src/lib/units.ts` - add per-category unit support (depth, temp, pressure, weight)

### 2.8 AI Service (TO UPDATE)
- `src/services/ai/openaiService.ts` - currently accepts `unitSystem?: UnitSystem` (binary), needs per-category support

---

## 3. Data Flow Diagrams

### 3.1 Current Flow: Input → Storage → Display

```
┌─────────────────────────────────────────────────────────────┐
│ USER INPUT (Forms)                                          │
├─────────────────────────────────────────────────────────────┤
│ Plan Form: maxDepth (UI units)                              │
│ Log Form: maxDepth, waterTemp, visibility (UI units)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CONVERSION (usePlanPageState / useLogPageState)             │
├─────────────────────────────────────────────────────────────┤
│ uiToMetric(value, unitSystem, type)                         │
│ - unitSystem from UnitSystemContext (localStorage)          │
│ - Converts: ft→m, °F→°C, etc.                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE STORAGE (Prisma)                                   │
├─────────────────────────────────────────────────────────────┤
│ DiveLog: maxDepth (Int, meters), waterTemp (Int, °C), etc. │
│ DivePlan: maxDepth (Int, meters)                            │
│ User: NO unit preferences stored                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ DISPLAY (Dashboard, Lists, Forms)                          │
├─────────────────────────────────────────────────────────────┤
│ displayDepth(value, unitSystem)                            │
│ displayTemperature(value, unitSystem)                      │
│ - unitSystem from UnitSystemContext (localStorage)         │
│ - Converts: m→ft, °C→°F, etc.                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Proposed Flow: Per-User Preferences

```
┌─────────────────────────────────────────────────────────────┐
│ USER INPUT (Forms)                                          │
├─────────────────────────────────────────────────────────────┤
│ Plan Form: maxDepth (user's preferred depth unit)            │
│ Log Form: maxDepth, waterTemp, visibility (user's prefs)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CONVERSION (usePlanPageState / useLogPageState)             │
├─────────────────────────────────────────────────────────────┤
│ uiToMetric(value, userPrefs.depth, 'depth')                 │
│ uiToMetric(value, userPrefs.temperature, 'temperature')    │
│ - userPrefs from API (/api/user/preferences)               │
│ - Converts based on per-category preference                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE STORAGE (Prisma)                                   │
├─────────────────────────────────────────────────────────────┤
│ DiveLog: maxDepth (Int, meters), waterTemp (Int, °C)        │
│ DivePlan: maxDepth (Int, meters)                            │
│ User: unitPreferences (JSON)                                │
│   { depth: 'meters'|'feet', temp: 'celsius'|'fahrenheit',  │
│     pressure: 'bar'|'psi', weight: 'kg'|'lb' }             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ DISPLAY (Dashboard, Lists, Forms)                          │
├─────────────────────────────────────────────────────────────┤
│ displayDepth(value, userPrefs.depth)                       │
│ displayTemperature(value, userPrefs.temperature)          │
│ - userPrefs from API or session                             │
│ - Converts based on per-category preference                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Schema/Auth Findings

### 4.1 Current Prisma Schema

**User Model** (`prisma/schema.prisma`, lines 11-49):
- No unit preferences fields
- Has profile fields (firstName, lastName, bio, etc.)
- Uses NextAuth with JWT sessions

**DiveLog Model** (lines 87-105):
- `maxDepth: Int` - stored in **meters** (canonical)
- `waterTemp: Int?` - stored in **Celsius** (canonical)
- `visibility: Int?` - stored in **meters** (canonical)

**DivePlan Model** (lines 107-123):
- `maxDepth: Int` - stored in **meters** (canonical)

### 4.2 NextAuth Session Structure

**JWT Callback** (`src/features/auth/lib/auth.ts`, lines 315-449):
- Stores: `id`, `email`, `firstName`, `lastName`, `avatarUrl`, `sessionVersion`
- **No unit preferences in token**

**Session Callback** (lines 451-493):
- Populates `session.user` from token
- **No unit preferences in session**

**Current Session Shape:**
```typescript
session.user = {
  id: string,
  email: string,
  firstName: string | null,
  lastName: string | null,
  avatarUrl: string | null,
  sessionVersion: number
}
```

### 4.3 User Data Access Patterns

**Client-Side:**
- `useAuth()` hook - reads from NextAuth session
- `useMe()` hook - fetches from `/api/me` (fresh DB data)
- `/api/me` route - returns user profile data (no preferences currently)

**Server-Side:**
- `getServerSession(authOptions)` - NextAuth session
- Direct Prisma queries for user data

### 4.4 Recommended Approach for MVP

**Option A: Store in User Model + Include in Session (RECOMMENDED)**
- Add `unitPreferences` JSON field to User model
- Include in JWT token (lightweight, no extra DB call)
- Include in session for client access
- Fallback to API fetch if session not available

**Why:**
- Fast client access (no API call needed)
- Works with SSR (session available server-side)
- Consistent with existing pattern (firstName, lastName in session)
- Minimal performance impact (small JSON object)

**Option B: Store in User Model + API Fetch Only**
- Add `unitPreferences` JSON field to User model
- Fetch via `/api/user/preferences` or include in `/api/me`
- Don't include in session

**Why Not:**
- Requires API call on every page load
- More complex client state management
- Slower initial render

**Recommendation: Option A** - Include in session for MVP, can optimize later if needed.

---

## 5. Recommended MVP Design

### 5.1 Schema Changes

**Add to User Model:**
```prisma
model User {
  // ... existing fields ...
  unitPreferences Json? // JSON object: { depth: 'meters'|'feet', temperature: 'celsius'|'fahrenheit', pressure: 'bar'|'psi', weight: 'kg'|'lb' }
}
```

**Default Values (for existing users):**
- Infer from current `localStorage` if available, otherwise:
- Default to `{ depth: 'feet', temperature: 'fahrenheit', pressure: 'psi', weight: 'lb' }` (imperial-ish)
- Or: `{ depth: 'meters', temperature: 'celsius', pressure: 'bar', weight: 'kg' }` (metric) - **RECOMMENDED**

**Migration Strategy:**
1. Add nullable `unitPreferences` field
2. Backfill script: set defaults for existing users
3. Make non-nullable after backfill (or keep nullable with defaults in code)

### 5.2 Canonical Storage Strategy

**RECOMMENDED: Store Canonical Units in DB + User Preferences for Display**

**Current State:**
- ✅ Already storing canonical units (meters, Celsius)
- ✅ Converting on input/output

**Proposed:**
- ✅ Keep canonical storage (no change to DiveLog/DivePlan schema)
- ✅ Store user preferences in User model
- ✅ Convert on display based on per-category preferences

**Why:**
- No data migration needed for existing dives
- Consistent data model (all dives in same units)
- Easy to change display preferences without affecting data
- Supports future features (export in different units, etc.)

**Alternative (NOT RECOMMENDED):**
- Store raw value + unit per measurement
- Would require schema changes to all measurement fields
- More complex queries and conversions
- Risk of inconsistent data

### 5.3 Unit Preferences Type Definition

```typescript
// src/lib/units.ts
export type DepthUnit = 'meters' | 'feet';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type PressureUnit = 'bar' | 'psi';
export type WeightUnit = 'kg' | 'lb';

export interface UnitPreferences {
  depth: DepthUnit;
  temperature: TemperatureUnit;
  pressure: PressureUnit;
  weight: WeightUnit;
}

export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  depth: 'meters',
  temperature: 'celsius',
  pressure: 'bar',
  weight: 'kg',
};
```

### 5.4 Updated Conversion Functions

**Extend `src/lib/units.ts`:**
```typescript
// Update display functions to accept per-category units
export function displayDepth(
  valueMeters: number | null | undefined,
  unit: DepthUnit // Changed from UnitSystem
): { value: string; unit: 'm' | 'ft' }

export function displayTemperature(
  valueCelsius: number | null | undefined,
  unit: TemperatureUnit // Changed from UnitSystem
): { value: string; unit: '°C' | '°F' }

// Add pressure/weight when needed
export function displayPressure(
  valueBar: number | null | undefined,
  unit: PressureUnit
): { value: string; unit: 'bar' | 'psi' }

export function displayWeight(
  valueKg: number | null | undefined,
  unit: WeightUnit
): { value: string; unit: 'kg' | 'lb' }
```

---

## 6. Step-by-Step Implementation Plan

### Phase 1: Schema & Backend Foundation

#### Step 1.1: Update Prisma Schema
- [ ] Add `unitPreferences Json?` to User model
- [ ] Run migration: `npx prisma migrate dev --name add_unit_preferences`
- [ ] Update Prisma client: `npx prisma generate`

#### Step 1.2: Create Preferences API Route
- [ ] Create `src/app/api/user/preferences/route.ts`
  - `GET` - return user's preferences (with defaults if null)
  - `PATCH` - update user's preferences (validate, save, return)
- [ ] Add validation (Zod schema for UnitPreferences)
- [ ] Add error handling

#### Step 1.3: Update `/api/me` Route
- [ ] Include `unitPreferences` in response
- [ ] Return defaults if null

#### Step 1.4: Update NextAuth Session
- [ ] Update JWT callback to include `unitPreferences` in token
- [ ] Update session callback to include `unitPreferences` in session
- [ ] Handle `trigger === 'update'` for preferences changes

#### Step 1.5: Create Backfill Script
- [ ] Create `scripts/backfill-unit-preferences.ts`
- [ ] Set default preferences for all existing users
- [ ] Run script: `npx tsx scripts/backfill-unit-preferences.ts`

### Phase 2: Unit Utilities Refactor

#### Step 2.1: Update Unit Types
- [ ] Add `DepthUnit`, `TemperatureUnit`, `PressureUnit`, `WeightUnit` types
- [ ] Add `UnitPreferences` interface
- [ ] Add `DEFAULT_UNIT_PREFERENCES` constant

#### Step 2.2: Refactor Display Functions
- [ ] Update `displayDepth()` to accept `DepthUnit` instead of `UnitSystem`
- [ ] Update `displayTemperature()` to accept `TemperatureUnit`
- [ ] Update `displayDistance()` to accept `DepthUnit` (same as depth)
- [ ] Add `displayPressure()` and `displayWeight()` (for future use)

#### Step 2.3: Refactor Input Conversion Functions
- [ ] Update `uiToMetric()` to accept per-category unit
- [ ] Update `metricToUI()` to accept per-category unit
- [ ] Update `getUnitLabel()` to accept per-category unit

### Phase 3: Context & Hooks Refactor

#### Step 3.1: Update UnitSystemContext
- [ ] Rename to `UnitPreferencesContext` (or keep name, change behavior)
- [ ] Replace `unitSystem: UnitSystem` with `preferences: UnitPreferences`
- [ ] Fetch preferences from API on mount (or from session)
- [ ] Remove localStorage dependency
- [ ] Add `updatePreferences()` method

#### Step 3.2: Update/Remove useUnitSystemOrLocal
- [ ] Evaluate if still needed (may be simplified)
- [ ] Update to use new preferences context
- [ ] Or remove if no longer needed

#### Step 3.3: Create useUnitPreferences Hook
- [ ] Create new hook: `src/hooks/useUnitPreferences.ts`
- [ ] Returns `{ preferences, updatePreferences, isLoading }`
- [ ] Handles fetching from session/API

### Phase 4: Settings Page Implementation

#### Step 4.1: Enable Settings Form
- [ ] Remove `disabled` from unit dropdowns
- [ ] Load preferences from API on mount
- [ ] Add save button and handler
- [ ] Add loading/error states
- [ ] Add success toast notification

#### Step 4.2: Connect to API
- [ ] Call `PATCH /api/user/preferences` on save
- [ ] Update local state on success
- [ ] Trigger session update to refresh context

### Phase 5: Update All Display Components

#### Step 5.1: Dashboard Components
- [ ] `StatsGrid.tsx` - use `preferences.depth` instead of `unitSystem`
- [ ] `InFocusCards.tsx` - use `preferences.depth` and `preferences.temperature`
- [ ] `ActivityTabs.tsx` - use `preferences.depth`

#### Step 5.2: Log Components
- [ ] `DiveLogList.tsx` - use `preferences.depth`, `preferences.temperature`, `preferences.depth` (visibility)
- [ ] `DiveLogForm.tsx` - use preferences for labels and conversions

#### Step 5.3: Plan Components
- [ ] `PlanForm.tsx` - use `preferences.depth` for labels and conversions
- [ ] `usePlanPageState.ts` - use preferences for conversions

#### Step 5.4: AI Service
- [ ] Update `openaiService.ts` to accept `UnitPreferences` instead of `UnitSystem`
- [ ] Build prompt based on per-category preferences
- [ ] Update API route to pass preferences to AI service

### Phase 6: Remove Old Toggle Components

#### Step 6.1: Remove Navbar Toggles
- [ ] Remove `<NavbarUnitToggle />` from `AuthNav.tsx`
- [ ] Remove `<NavbarUnitToggleLocal />` from `AuthNav.tsx`
- [ ] Remove `<NavbarUnitToggle />` from `TopBar.tsx`
- [ ] Delete `src/components/NavbarUnitToggle.tsx`
- [ ] Delete `src/components/NavbarUnitToggleLocal.tsx`

#### Step 6.2: Remove Form Toggle
- [ ] Remove `<FormUnitToggle />` from `PlanForm.tsx`
- [ ] Delete `src/components/FormUnitToggle.tsx`

#### Step 6.3: Clean Up Context
- [ ] Remove `UnitSystem` type (or keep for backward compat during migration)
- [ ] Remove localStorage reads/writes
- [ ] Remove `toggleUnitSystem()` method

### Phase 7: Testing & Validation

#### Step 7.1: Manual Testing
- [ ] Test settings page: save preferences, verify persistence
- [ ] Test dashboard: verify all measurements use preferences
- [ ] Test plan form: verify input/output conversions
- [ ] Test log form: verify input/output conversions
- [ ] Test log list: verify display conversions
- [ ] Test AI briefing: verify units match preferences

#### Step 7.2: Edge Cases
- [ ] New user (no preferences) - should use defaults
- [ ] User changes preferences - should update immediately
- [ ] Logged-out user - should use defaults or localStorage fallback?
- [ ] SSR hydration - verify no mismatches

#### Step 7.3: Clean Up
- [ ] Remove unused `UnitSystem` type (if removed)
- [ ] Remove unused hooks (`useUnitSystemOrLocal` if removed)
- [ ] Remove localStorage key `'diveiq:unitSystem` (or keep for logged-out fallback)

---

## 7. Risk/Edge Cases + Tests to Add

### 7.1 Risks

**Risk 1: Hydration Mismatches**
- **Issue:** Server renders with defaults, client loads preferences from API
- **Mitigation:** Use `isMounted` pattern (already in place), or fetch preferences server-side

**Risk 2: Session Staleness**
- **Issue:** User changes preferences, but session not updated immediately
- **Mitigation:** Call `session.update()` after PATCH, or refetch context

**Risk 3: Logged-Out Users**
- **Issue:** No session, no preferences
- **Mitigation:** Use localStorage fallback for logged-out users, or defaults

**Risk 4: Backward Compatibility**
- **Issue:** Existing code uses `UnitSystem` type
- **Mitigation:** Keep type during migration, add migration helpers

**Risk 5: AI Service Unit Mismatch**
- **Issue:** AI receives mixed units (e.g., ft + °C)
- **Mitigation:** Update AI prompt to handle per-category units

### 7.2 Edge Cases

**Edge Case 1: Null Preferences**
- **Scenario:** User has `null` preferences (new user or migration issue)
- **Handling:** Return defaults in API, use defaults in context

**Edge Case 2: Invalid Preferences**
- **Scenario:** User has invalid JSON or unknown unit values
- **Handling:** Validate in API, return defaults if invalid

**Edge Case 3: Missing Measurement Type**
- **Scenario:** New measurement type added (e.g., pressure) but user preferences don't include it
- **Handling:** Merge with defaults, save updated preferences

**Edge Case 4: Form Input During Preference Change**
- **Scenario:** User has form open, changes preferences in settings
- **Handling:** Convert form values on preference change (already implemented for unitSystem toggle)

### 7.3 Tests to Add

**Unit Tests:**
- [ ] `src/lib/units.ts` - conversion functions with per-category units
- [ ] `src/app/api/user/preferences/route.ts` - GET/PATCH validation
- [ ] Preferences context - fetch, update, defaults

**Integration Tests:**
- [ ] Settings page - save preferences, verify API call
- [ ] Dashboard - verify measurements use preferences
- [ ] Form submission - verify conversions use preferences

**E2E Tests (if applicable):**
- [ ] User changes preferences, verifies all displays update
- [ ] User creates plan/log, verifies units match preferences

---

## 8. Open Questions

### Q1: Logged-Out User Behavior
**Question:** Should logged-out users have unit preferences?
- **Option A:** Use localStorage (current behavior) - persists across sessions
- **Option B:** Use defaults only - no persistence
- **Option C:** Store in session storage - cleared on close

**Recommendation:** Option A - keep localStorage for logged-out users, migrate to DB on sign-up.

### Q2: Pressure & Weight Units
**Question:** Pressure and weight are in settings UI but not used in app. Should we:
- **Option A:** Implement now (add to gear forms, etc.)
- **Option B:** Keep in settings but don't use yet (MVP scope)
- **Option C:** Remove from settings until needed

**Recommendation:** Option B - keep in settings, add to schema, but don't implement display until needed.

### Q3: Default Preferences
**Question:** What should default preferences be for new users?
- **Option A:** Metric (meters, °C, bar, kg) - international standard
- **Option B:** Imperial (feet, °F, psi, lb) - US market
- **Option C:** Detect from browser locale

**Recommendation:** Option A - metric as default, users can change.

### Q4: Session Update Strategy
**Question:** How to update session after preferences change?
- **Option A:** Call `session.update()` immediately
- **Option B:** Refetch preferences in context
- **Option C:** Invalidate session, force re-login (not recommended)

**Recommendation:** Option A - call `session.update()` after PATCH, refresh context.

### Q5: Backward Compatibility Period
**Question:** Should we support old `UnitSystem` type during migration?
- **Option A:** Yes, add migration helpers, remove after full migration
- **Option B:** No, break cleanly, update all at once

**Recommendation:** Option A - add helpers, gradual migration, cleaner rollback.

---

## 9. File Inventory Summary

### Files to Create
- `src/app/api/user/preferences/route.ts` - preferences API
- `scripts/backfill-unit-preferences.ts` - migration script
- `src/hooks/useUnitPreferences.ts` - new hook (optional)

### Files to Modify
- `prisma/schema.prisma` - add unitPreferences field
- `src/features/auth/lib/auth.ts` - add to JWT/session
- `src/app/api/me/route.ts` - include preferences
- `src/lib/units.ts` - extend for per-category units
- `src/contexts/UnitSystemContext.tsx` - refactor to preferences
- `src/features/settings/components/SettingsPageContent.tsx` - enable form
- All dashboard components (StatsGrid, InFocusCards, ActivityTabs)
- All log components (DiveLogList, DiveLogForm, useLogPageState)
- All plan components (PlanForm, usePlanPageState)
- `src/services/ai/openaiService.ts` - update for preferences

### Files to Delete
- `src/components/NavbarUnitToggle.tsx`
- `src/components/NavbarUnitToggleLocal.tsx`
- `src/components/FormUnitToggle.tsx`
- `src/hooks/useUnitSystemOrLocal.ts` (if no longer needed)

### Files to Review (May Need Updates)
- `src/components/UnitToggle.tsx` (if exists)
- Any other components using `useUnitSystem()` directly

---

## 10. Implementation Timeline Estimate

**Phase 1 (Schema & Backend):** 2-3 hours
- Schema migration, API routes, session updates, backfill script

**Phase 2 (Unit Utilities):** 1-2 hours
- Type updates, function refactoring

**Phase 3 (Context & Hooks):** 1-2 hours
- Context refactor, hook updates

**Phase 4 (Settings Page):** 1-2 hours
- Enable form, connect to API

**Phase 5 (Display Components):** 3-4 hours
- Update all measurement displays

**Phase 6 (Cleanup):** 1 hour
- Remove old components, clean up

**Phase 7 (Testing):** 2-3 hours
- Manual testing, edge cases, fixes

**Total Estimate:** 11-17 hours

---

## 11. Success Criteria

✅ User can set unit preferences on `/settings`  
✅ Preferences persist per-user in database  
✅ Preferences apply globally: dashboard, forms, lists, AI output  
✅ Users can mix units (e.g., ft + °C)  
✅ Navbar toggle removed  
✅ No route-conditional rendering for units  
✅ Forms assume user inputs in preferred units  
✅ All measurements convert correctly on submit/display  
✅ No hydration mismatches  
✅ Backward compatible (existing dives display correctly)

---

## Appendix A: Current Measurement Touchpoints

### Depth
- **Input:** PlanForm (maxDepth), DiveLogForm (maxDepth)
- **Storage:** DivePlan.maxDepth (Int, meters), DiveLog.maxDepth (Int, meters)
- **Display:** Dashboard (StatsGrid, InFocusCards, ActivityTabs), DiveLogList, PlanForm, DiveLogForm

### Temperature
- **Input:** DiveLogForm (waterTemp)
- **Storage:** DiveLog.waterTemp (Int?, Celsius)
- **Display:** Dashboard (InFocusCards), DiveLogList, DiveLogForm

### Visibility/Distance
- **Input:** DiveLogForm (visibility)
- **Storage:** DiveLog.visibility (Int?, meters)
- **Display:** DiveLogList, DiveLogForm

### Pressure (Not Currently Used)
- **Input:** None
- **Storage:** None
- **Display:** None
- **Note:** In settings UI but not implemented

### Weight (Not Currently Used)
- **Input:** None
- **Storage:** None
- **Display:** None
- **Note:** In settings UI but not implemented

---

## Appendix B: Type Definitions Reference

### Current Types
```typescript
// src/lib/units.ts
export type UnitSystem = 'metric' | 'imperial';
```

### Proposed Types
```typescript
// src/lib/units.ts
export type DepthUnit = 'meters' | 'feet';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type PressureUnit = 'bar' | 'psi';
export type WeightUnit = 'kg' | 'lb';

export interface UnitPreferences {
  depth: DepthUnit;
  temperature: TemperatureUnit;
  pressure: PressureUnit;
  weight: WeightUnit;
}
```

---

**End of Audit Report**

