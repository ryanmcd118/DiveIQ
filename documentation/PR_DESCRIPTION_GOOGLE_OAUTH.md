# Add Google OAuth sign-in

Adds Google OAuth as an authentication option alongside email/password. Users can now sign in or sign up with their Google account from the `/signin` and `/signup` pages.

## What's included

- "Continue with Google" button on both sign-in and sign-up pages (with divider and Google icon)
- Automatic account linking — if a Google email matches an existing user, it links to that account instead of creating a duplicate
- Error handling with friendly messages when OAuth fails
- Same JWT session management as email/password auth
- Setup documentation for Google Cloud Console configuration

## Implementation notes

Uses NextAuth's built-in Google provider. The existing `Account` table in Prisma already had all the fields we needed, so no database migration required. Account linking happens in the `signIn` callback by checking for matching emails.

The Google button component is shared between sign-in and sign-up pages. Error handling redirects to `/signin?oauth=google&error=1` and displays a user-friendly message.

See `documentation/GOOGLE_OAUTH_SETUP.md` for setup instructions.
