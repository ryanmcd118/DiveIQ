# Google OAuth Implementation Summary

## Overview

Google OAuth has been successfully integrated into DiveIQ's authentication system. The implementation uses NextAuth.js's built-in Google provider and maintains compatibility with the existing email/password authentication.

## Authentication Mechanism

**Current Setup**: NextAuth.js v4 with JWT strategy

- Sessions are stored as JWTs in HTTP-only cookies
- Same session mechanism used for both email/password and Google OAuth
- No changes to existing auth flow

## Files Changed

### 1. Backend Authentication Configuration

- **`src/features/auth/lib/auth.ts`**
  - Added `GoogleProvider` from `next-auth/providers/google`
  - Implemented custom `signIn` callback for:
    - Linking Google accounts to existing users by email
    - Creating new users when signing in with Google for the first time
    - Preventing duplicate accounts

### 2. Error Handling

- **`src/app/(auth)/signin/page.tsx`**
  - Added `OAuthErrorHandler` component wrapper with Suspense
  - Handles OAuth error redirects

- **`src/features/auth/components/OAuthErrorHandler.tsx`** (NEW)
  - Client component that detects OAuth errors from NextAuth
  - Redirects to `/signin?oauth=google&error=1` format as required

### 3. Documentation

- **`documentation/GOOGLE_OAUTH_SETUP.md`** (NEW)
  - Complete setup guide
  - Environment variables documentation
  - Google Cloud Console configuration steps
  - Testing instructions

## Database Schema

**No changes required** - The existing `Account` table already has all necessary fields:

- `provider` and `providerAccountId` (with unique constraint)
- OAuth token fields (access_token, refresh_token, etc.)
- User relation

## API Endpoints

NextAuth automatically creates these endpoints (no manual implementation needed):

- **`GET /api/auth/signin/google`** - Initiates Google OAuth flow
- **`GET /api/auth/callback/google`** - Handles OAuth callback (automatic)

## Environment Variables Required

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_BASE_URL=http://localhost:3000  # Optional, defaults to NEXTAUTH_URL
NEXTAUTH_SECRET=your-secret  # Should already exist
NEXTAUTH_URL=http://localhost:3000  # Should already exist
```

## How It Works

### 1. New User Flow

1. User clicks "Sign in with Google" → Redirects to `/api/auth/signin/google`
2. Google OAuth consent screen
3. After approval → Callback to `/api/auth/callback/google`
4. `signIn` callback:
   - Creates new `User` record with email, name, image from Google
   - Creates `Account` record linking Google account
   - Returns `true` to allow sign-in
5. NextAuth creates JWT session
6. User redirected to app (logged in)

### 2. Existing User Linking Flow

1. User with email/password account signs in with Google
2. `signIn` callback checks if email matches existing user
3. If match found:
   - Links Google account to existing user (creates `Account` record)
   - Does NOT create duplicate user
   - Returns `true` to allow sign-in
4. User is signed in with their existing account

### 3. Returning Google User Flow

1. User who previously signed in with Google signs in again
2. `signIn` callback finds existing `Account` record by `provider` + `providerAccountId`
3. Links to existing user
4. Returns `true` to allow sign-in
5. User is signed in

## Security Features

✅ **State Parameter**: NextAuth automatically handles OAuth state for CSRF protection  
✅ **Secure Cookies**: Uses HTTP-only cookies for JWT storage  
✅ **No Open Redirects**: Redirect URLs validated against baseUrl  
✅ **Email Linking**: Prevents duplicate accounts by linking via email  
✅ **Unique Constraints**: Database enforces one Google account per user ID

## Error Handling

- OAuth errors redirect to: `/signin?oauth=google&error=1`
- Handled by `OAuthErrorHandler` component
- NextAuth's error page configuration: `/signin`

## Testing Locally

1. **Set up environment variables** (see documentation)
2. **Configure Google Cloud Console**:
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:3000/api/auth/callback/google`
3. **Start dev server**: `npm run dev`
4. **Test OAuth flow**:
   - Navigate to `http://localhost:3000/api/auth/signin/google`
   - Complete Google sign-in
   - Verify user is created/linked in database
   - Verify session is established

## Next Steps (UI Integration)

To add a "Sign in with Google" button to your UI:

```tsx
import { signIn } from "next-auth/react";

<button onClick={() => signIn("google")}>Sign in with Google</button>;
```

Or use a direct link:

```tsx
<Link href="/api/auth/signin/google">Sign in with Google</Link>
```

## Notes

- **No Prisma Migration Needed**: The `Account` table already exists with correct structure
- **No Breaking Changes**: Existing email/password auth continues to work unchanged
- **NextAuth Endpoints**: The endpoints are `/api/auth/signin/google` and `/api/auth/callback/google` (not `/auth/google` as might be expected from Express patterns, but this is NextAuth's standard)
- **Email Linking**: The system links accounts by email to prevent duplicates, which is the desired behavior

## Verification Checklist

- [x] Google provider added to NextAuth config
- [x] signIn callback implemented for account linking
- [x] Error handling configured
- [x] Environment variables documented
- [x] Database schema verified (no migration needed)
- [x] Documentation created
- [ ] Environment variables set in `.env`
- [ ] Google Cloud Console configured
- [ ] Local testing completed
- [ ] UI button added (optional)

## Potential Issues & Solutions

**Issue**: "Redirect URI mismatch" error

- **Solution**: Ensure Google Console redirect URI exactly matches: `http://localhost:3000/api/auth/callback/google`

**Issue**: "Invalid client" error

- **Solution**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

**Issue**: User not being created

- **Solution**: Check database connection, verify Prisma client is generated (`npx prisma generate`)

**Issue**: TypeScript errors about Prisma unique constraint

- **Solution**: The format `provider_providerAccountId` is correct for composite unique constraints in Prisma
