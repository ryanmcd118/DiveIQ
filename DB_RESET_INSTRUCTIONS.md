# Database Reset Instructions (DEV ONLY)

This document describes how to reset the development database.

## ⚠️ WARNING: DEV ONLY

The `db:reset` script will **permanently delete all data** in your development database. Only use this in development environments.

## Prerequisites

1. Stop your development server if it's running
2. Ensure you're in the project root directory

## Reset Steps

1. **Run the reset command:**

   ```bash
   npm run db:reset
   ```

   This command:
   - Drops all tables
   - Re-applies all migrations
   - Regenerates Prisma Client

2. **Clear NextAuth sessions:**
   - Option A: Use an Incognito/Private browser window
   - Option B: Clear cookies for `localhost:3000` in your browser
   - Option C: Delete the NextAuth session cookie manually

3. **Restart your development server:**

   ```bash
   npm run dev
   ```

4. **Test the reset:**
   - Create a new account
   - Verify that signup/login works correctly
   - Verify that profile data persists correctly

## What Gets Reset

- All users and accounts
- All sessions
- All dive logs
- All dive plans
- All gear items
- All other application data

## Troubleshooting

If you encounter errors after reset:

1. Make sure all migrations are up to date: `npx prisma migrate dev`
2. Regenerate Prisma Client: `npx prisma generate`
3. Restart your development server
