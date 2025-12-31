# Last Name Implementation Summary

## Overview

Implemented "last name" support across DiveIQ authentication and user creation, replacing the single `name` field with separate `firstName` and `lastName` fields.

## Files Changed

### 1. Database Schema & Migration

- **`prisma/schema.prisma`**:
  - Replaced `name String?` with `firstName String?` and `lastName String?`
  - Both fields are nullable to support existing users and Google OAuth users who may not have a lastName
- **`prisma/migrations/20251228023805_add_firstname_lastname/migration.sql`**:
  - Created migration to split existing `name` data into `firstName` (first token) and `lastName` (remaining tokens)
  - Existing users' names are automatically split

### 2. Authentication Configuration

- **`src/features/auth/lib/auth.ts`**:
  - Added `extractNamesFromGoogleProfile()` helper function to extract firstName/lastName from Google OAuth profile
  - Prefers `given_name`/`family_name` from profile, falls back to splitting `name` field
  - Updated `authorize()` callback to return `firstName` and `lastName` instead of `name`
  - Updated Google OAuth `signIn` callback to extract and store `firstName`/`lastName` when creating new users
  - Updated `jwt` callback to include `firstName` and `lastName` in token (fetches from DB for OAuth users)
  - Updated `session` callback to include `firstName` and `lastName` in session

### 3. API Routes

- **`src/app/api/auth/signup/route.ts`**:
  - Updated to accept `firstName` and `lastName` instead of `name`
  - Added validation to require both `firstName` and `lastName` for email/password signups
  - Updated response to return `firstName` and `lastName`

### 4. Type Definitions

- **`src/types/next-auth.d.ts`**:
  - Updated `Session.user` interface to include `firstName: string | null` and `lastName: string | null` (removed `name`)
  - Updated `User` interface to include `firstName` and `lastName`
  - Updated `JWT` interface to include `firstName` and `lastName`

### 5. UI Components - Signup Forms

- **`src/features/auth/components/SignUpForm.tsx`**:
  - Added `lastName` state variable and input field
  - Updated form to collect both `firstName` and `lastName`
  - Updated `handleSubmit` to pass both fields to `signUpUser`

- **`src/features/auth/components/AuthModal.tsx`**:
  - Added `lastName` state variable and input field
  - Updated form to collect both `firstName` and `lastName` in signup mode
  - Updated API call to send both fields

### 6. Hooks

- **`src/features/auth/hooks/useAuth.ts`**:
  - Updated `signUpUser` function signature to accept `firstName` and `lastName` parameters
  - Updated API call body to include both fields

### 7. UI Components - Display

- **`src/features/auth/components/AuthNav.tsx`**:
  - Updated to use `user.firstName` directly instead of splitting `user.name`

- **`src/features/app/components/TopBar.tsx`**:
  - Updated to use `user.firstName` for initials
  - Added `displayName` variable to show full name (firstName + lastName) in profile menu

- **`src/features/dashboard/components/DashboardHeader.tsx`**:
  - Updated to use `user.firstName` directly instead of splitting `user.name`

## Key Implementation Details

### Validation Rules

- **Email/Password Signup**: Both `firstName` and `lastName` are **required**
- **Google OAuth**: Both fields are **nullable** (lastName can be null if not provided by Google)

### Google OAuth Name Extraction Logic

1. **Preferred**: Uses `profile.given_name` and `profile.family_name` if available
2. **Fallback**: Splits `profile.name` or `user.name` if provided
   - First token → `firstName`
   - Remaining tokens → `lastName`
3. **No name**: Returns `null` for both (allowed for Google OAuth users)

### Database Migration

The migration safely handles existing data:

- Splits existing `name` field on first space
- First token → `firstName`
- Remaining tokens → `lastName`
- If no space found, entire name → `firstName`, `lastName` → `null`
- Null names remain null

### Session/JWT Flow

- Credentials provider: `firstName`/`lastName` come from database via `authorize()` callback
- OAuth providers: `firstName`/`lastName` fetched from database in `jwt` callback after user creation/linking
- Session always includes both `firstName` and `lastName` (nullable)

## Testing Instructions

### Prerequisites

1. **Run the migration**:

   ```bash
   npx prisma migrate dev
   ```

   This will apply the migration and update the database schema.

2. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```
   This ensures TypeScript types match the new schema.

### Test 1: Email/Password Signup

1. Navigate to the signup page (`/signup`)
2. Fill in the form with:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Submit the form
4. **Verify**:
   - User is created and signed in successfully
   - Check database: User should have `firstName="John"` and `lastName="Doe"`
   - Check session: `session.user.firstName` should be "John" and `session.user.lastName` should be "Doe"
   - Navbar should show "Hi, John"

### Test 2: Google OAuth Sign-in

1. Sign out if currently signed in
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. **Verify**:
   - New user is created (if first time) or existing user is linked
   - Check database: User should have `firstName` and `lastName` populated from Google profile
   - If Google provides `given_name`/`family_name`, those should be used
   - If only full name is provided, it should be split correctly
   - Check session: `session.user.firstName` and `session.user.lastName` should be set
   - Navbar should show the first name

### Test 3: Existing User Migration

1. If you have existing users with a `name` field:
   - After running migration, verify their names were split correctly
   - First token should be in `firstName`
   - Remaining tokens should be in `lastName`
   - Single-word names should have `lastName=null`

### Test 4: Form Validation

1. Try to submit signup form without lastName
2. **Verify**: Form should show validation error (required field)
3. Try to submit with only firstName
4. **Verify**: Form should not submit, lastName is required

### Test 5: Profile Display

1. Sign in and check:
   - TopBar profile menu should show full name (firstName + lastName if both present)
   - Dashboard header should show greeting with firstName
   - AuthNav should show "Hi, [firstName]"

## Notes

- Existing users will have their names automatically migrated
- Google OAuth users may have nullable `lastName` (this is allowed)
- All email/password signups require both `firstName` and `lastName`
- The `name` field has been completely removed from the schema
