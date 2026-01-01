# Add User Profile System with First/Last Name Support

## Summary

Implements a comprehensive user profile system with split name fields (`firstName`/`lastName`), an editable profile page, and extended profile fields for DiveIQ-specific data.

## Key Changes

### Database & Schema

- Replaced single `name` field with `firstName` and `lastName` (nullable)
- Added basic profile fields: `birthday`, `location`, `bio`, `pronouns`, `website`
- Added DiveIQ-specific fields: `homeDiveRegion`, `languages`, `primaryDiveTypes`, `experienceLevel`, `yearsDiving`, `certifyingAgency`, `typicalDivingEnvironment`, `lookingFor`, `favoriteDiveLocation`
- Created migrations and backfill scripts for existing users

### Authentication Updates

- Updated NextAuth to extract and store `firstName`/`lastName` from Google OAuth
- Modified signup forms to collect both name fields (required for email/password, optional for OAuth)
- Updated JWT and session callbacks to include separate name fields

### Profile Page

- New `/profile` route with authentication check
- Full-featured profile page component with edit mode, validation, and progress meter
- Added "Profile" link to sidebar navigation

### API Endpoints

- `GET /api/profile` - Fetch current user's profile
- `PATCH /api/profile` - Update profile fields with validation

### Documentation

- Implementation guides for lastName migration and profile page setup
- Database migration instructions

## Stats

- 45 files changed
- 4,335 insertions, 78 deletions
- 15 commits
