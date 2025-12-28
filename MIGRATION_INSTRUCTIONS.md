# Database Migration Instructions

## Problem

The Prisma schema defines `firstName`, `lastName`, and profile fields (`birthday`, `location`, `bio`, `pronouns`, `website`), but the database still has the old `name` field. This causes the `/api/profile` endpoint to fail with: "Unknown field `firstName` for select statement on model `User`".

## Solution

### Step 1: Apply Prisma Migrations

The migrations already exist but haven't been applied. Run:

```bash
npx prisma migrate dev
```

This will:

- Apply migration `20251228023805_add_firstname_lastname` (converts `name` → `firstName`/`lastName`)
- Apply migration `20251228024358_add_profile_fields` (adds `birthday`, `location`, `bio`, `pronouns`, `website`)
- Regenerate the Prisma client

### Step 2: Regenerate Prisma Client (if needed)

```bash
npx prisma generate
```

### Step 3: (Optional) Backfill Existing Users

If you have existing users with `name` field that weren't migrated by the migration, run:

```bash
npm run backfill:names
```

Or manually:

```bash
npx tsx scripts/backfill-user-names.ts
```

The migration should already handle the backfill, but this script can be run as a safety check.

## Verification

After running migrations:

1. **Check database schema:**

   ```bash
   sqlite3 prisma/dev.db ".schema User"
   ```

   Should show: `firstName`, `lastName`, `birthday`, `location`, `bio`, `pronouns`, `website` fields (not `name`).

2. **Test the profile page:**
   - Visit `/profile`
   - Should load without 500 errors
   - Should display user's name correctly

3. **Check console logs:**
   - In development, check for `[GET /api/profile] Successfully fetched user:` logs
   - Should show firstName/lastName values

## Current Code Status

✅ **Prisma Schema**: Already has all required fields defined  
✅ **Migrations**: Already exist in `prisma/migrations/`  
✅ **API Route**: Already selects the correct fields (will work after migrations)  
✅ **Profile Component**: Updated to handle `name` as fallback during transition  
✅ **Google OAuth**: Already populates firstName/lastName  
✅ **Signup**: Already populates firstName/lastName  
✅ **Backfill Script**: Created at `scripts/backfill-user-names.ts`

## Next Steps After Migration

Once migrations are applied:

1. Restart the Next.js dev server
2. Test `/profile` page
3. Verify name display works correctly
4. Test profile editing (save should persist)
