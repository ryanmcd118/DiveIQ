# Google OAuth Setup - DiveIQ

This document describes how to set up Google OAuth authentication for DiveIQ.

## Overview

Google OAuth has been integrated into the existing authentication system. Users can now sign in with Google in addition to email/password authentication. The system automatically:

- Links Google accounts to existing users by email (no duplicate accounts)
- Creates new users when signing in with Google for the first time
- Uses the same JWT session mechanism as email/password auth

## Environment Variables

Add the following environment variables to your `.env` file (or `.env.local` for local development):

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend Base URL (used for error redirects)
FRONTEND_BASE_URL=http://localhost:3000

# NextAuth Configuration (if not already set)
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### Generating NEXTAUTH_SECRET

If you don't have a `NEXTAUTH_SECRET` set, generate one:

```bash
openssl rand -base64 32
```

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Note your project name and ID

### 2. Enable Google+ API

1. Navigate to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity Services"
3. Click on it and click **Enable**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: DiveIQ (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**
5. Add scopes (if needed):
   - `email`
   - `profile`
   - `openid`
6. Click **Save and Continue**
7. Add test users (optional for development)
8. Click **Save and Continue**

### 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: DiveIQ Web Client (or any name)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://your-production-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (for local development)
     - `https://your-production-domain.com/api/auth/callback/google` (for production)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**
7. Add them to your `.env` file as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 5. URLs to Register in Google Console

**For Local Development:**

- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

**For Production:**

- Authorized JavaScript origins: `https://your-production-domain.com`
- Authorized redirect URIs: `https://your-production-domain.com/api/auth/callback/google`

## Local Setup Steps

1. **Install dependencies** (if needed):

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env` (if it exists) or create a new `.env` file
   - Add all required environment variables (see above)

3. **Set up the database**:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

   Note: The Prisma schema already includes the `Account` table needed for OAuth, so no new migration is required.

4. **Start the development server**:

   ```bash
   npm run dev
   ```

5. **Test the OAuth flow**:
   - Navigate to `http://localhost:3000/signin`
   - You should see a "Sign in with Google" button (if added to the UI)
   - Or navigate directly to `http://localhost:3000/api/auth/signin/google`
   - Complete the Google OAuth flow
   - You should be redirected back and signed in

## API Endpoints

NextAuth automatically creates the following endpoints:

- **`GET /api/auth/signin/google`** - Initiates Google OAuth flow (redirects to Google)
- **`GET /api/auth/callback/google`** - Handles Google OAuth callback (automatically handled by NextAuth)
- **`GET /api/auth/signin`** - Sign-in page with provider options
- **`GET /api/auth/signout`** - Sign out endpoint
- **`GET /api/auth/session`** - Get current session

## Error Handling

If OAuth fails or encounters an error, users are redirected to:

```
/signin?oauth=google&error=1
```

The sign-in page handles this error parameter and can display appropriate error messages.

## How It Works

1. **New User with Google**:
   - User clicks "Sign in with Google"
   - Redirected to Google for authentication
   - After approval, Google redirects to `/api/auth/callback/google`
   - System creates a new user account with Google email, name, and image
   - Creates an `Account` record linking the Google account to the user
   - User is signed in with JWT session

2. **Existing User Linking Google**:
   - User with existing email/password account signs in with Google
   - If Google email matches an existing user email:
     - System links the Google account to the existing user
     - Creates an `Account` record without creating a duplicate user
     - User is signed in

3. **Existing Google User**:
   - User who previously signed in with Google signs in again
   - System finds the existing `Account` record
   - User is signed in directly

## Security Considerations

- **Secure Cookies**: In production, ensure `NEXTAUTH_URL` uses HTTPS
- **State Parameter**: NextAuth automatically handles the OAuth state parameter for CSRF protection
- **No Open Redirects**: Redirect URLs are validated against `baseUrl` and `FRONTEND_BASE_URL`
- **Environment Variables**: Never commit `.env` files to version control

## Troubleshooting

### "Redirect URI mismatch" Error

- Ensure the redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- Check for trailing slashes or protocol mismatches (http vs https)

### "Invalid Client" Error

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure the OAuth consent screen is properly configured
- Check that the Google+ API is enabled

### "Access Denied" or OAuth Error Redirect

- Check browser console and server logs for detailed error messages
- Verify environment variables are loaded correctly
- Ensure the database connection is working
- Check that the `Account` table exists in the database

### User Not Being Created

- Check Prisma client is generated: `npx prisma generate`
- Verify database migrations are applied: `npx prisma migrate status`
- Check server logs for database errors

## Database Schema

The OAuth implementation uses the existing `Account` table:

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String  // "oauth" for OAuth accounts
  provider          String  // "google"
  providerAccountId String  // Google user ID (sub)
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

## Testing Locally

1. Ensure all environment variables are set
2. Start the dev server: `npm run dev`
3. Navigate to `http://localhost:3000/api/auth/signin/google`
4. Complete the Google OAuth flow
5. Verify you're redirected back and signed in
6. Check the database to see the new `User` and `Account` records
7. Test linking: create a user with email/password, then sign in with Google using the same email

## Files Changed

- `src/features/auth/lib/auth.ts` - Added Google provider and signIn callback
- `src/app/(auth)/signin/page.tsx` - Added OAuth error handler
- `src/features/auth/components/OAuthErrorHandler.tsx` - New component for error handling
- `prisma/schema.prisma` - No changes needed (Account table already exists)

## Next Steps

To add a "Sign in with Google" button to your UI:

1. Update the sign-in form to include a Google sign-in button
2. Link it to `/api/auth/signin/google` or use `signIn("google")` from `next-auth/react`

Example:

```tsx
import { signIn } from "next-auth/react";

<button onClick={() => signIn("google")}>Sign in with Google</button>;
```
