/**
 * Backfill script to migrate existing User.name to firstName/lastName
 * 
 * This script finds users where firstName is null/empty and name is not null,
 * then splits the name into firstName and lastName.
 * 
 * Run with: npx tsx scripts/backfill-user-names.ts
 * Or add to package.json: "backfill:names": "tsx scripts/backfill-user-names.ts"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillUserNames() {
  try {
    console.log("Starting user name backfill...");

    // First, check if the database has a 'name' field
    // We'll try to query users and see what fields are available
    const allUsers = await prisma.$queryRaw<Array<{ id: string; name?: string | null; firstName?: string | null }>>`
      SELECT id, name, firstName FROM User LIMIT 1
    `.catch(() => null);

    if (!allUsers) {
      console.log("Could not check database schema. This might mean migrations haven't been applied yet.");
      console.log("Please run: npx prisma migrate dev");
      process.exit(1);
    }

    // Check if name field exists by examining the result
    // If the query worked but name is undefined, the field doesn't exist
    const hasNameField = allUsers.length > 0 && 'name' in allUsers[0];

    if (!hasNameField) {
      console.log("✓ 'name' field doesn't exist in database - migrations have been applied.");
      console.log("No backfill needed.");
      await prisma.$disconnect();
      return;
    }

    // Find users where firstName is null and name is not null
    // Using raw query since Prisma schema doesn't have 'name' field
    const usersToBackfill = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      firstName: string | null;
      lastName: string | null;
    }>>`
      SELECT id, name, firstName, lastName 
      FROM User 
      WHERE (firstName IS NULL OR firstName = '') 
      AND name IS NOT NULL 
      AND name != ''
    `;

    if (usersToBackfill.length === 0) {
      console.log("✓ No users need backfilling. All users already have firstName or no name field.");
      await prisma.$disconnect();
      return;
    }

    console.log(`Found ${usersToBackfill.length} user(s) to backfill.`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToBackfill) {
      try {
        // Split name into firstName and lastName
        const nameParts = user.name.trim().split(/\s+/);
        const firstName = nameParts[0] || null;
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

        // Update the user
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName,
          },
        });

        console.log(`✓ Updated user ${user.id}: "${user.name}" → firstName: "${firstName}", lastName: "${lastName}"`);
        successCount++;
      } catch (error) {
        console.error(`✗ Error updating user ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✓ Backfill complete!`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
  } catch (error) {
    console.error("Error during backfill:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillUserNames();

