/**
 * Backfill script to migrate existing User.name to firstName/lastName
 *
 * This script finds users where firstName or lastName is null/empty and name is not null,
 * then splits the name into firstName and lastName.
 *
 * Run with: npx tsx scripts/backfill-user-first-last.ts
 */

import { PrismaClient } from "@prisma/client";
import { splitFullName } from "../src/features/auth/lib/name";

const prisma = new PrismaClient();

async function backfillUserNames() {
  try {
    console.log("Starting user name backfill...");

    // Find users where (firstName is null OR lastName is null) AND name is not null
    // Using raw query to check if name field exists and get users that need backfilling
    const usersToBackfill = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string | null;
        firstName: string | null;
        lastName: string | null;
      }>
    >`
      SELECT id, name, firstName, lastName 
      FROM User 
      WHERE (firstName IS NULL OR lastName IS NULL) 
      AND name IS NOT NULL 
      AND name != ''
    `.catch(async () => {
      // If name field doesn't exist, try querying without it
      console.log(
        "Attempting query without 'name' field (migrations may have removed it)..."
      );
      return await prisma.user.findMany({
        where: {
          OR: [{ firstName: null }, { lastName: null }],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });
    });

    if (usersToBackfill.length === 0) {
      console.log(
        "✓ No users need backfilling. All users already have firstName and lastName, or no 'name' field to split."
      );
      await prisma.$disconnect();
      return;
    }

    console.log(`Found ${usersToBackfill.length} user(s) to backfill.`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToBackfill) {
      try {
        // Check if we have a name field to split
        const fullName = (user as any).name;

        if (!fullName || fullName.trim() === "") {
          // No name to split, skip
          console.log(`⊘ Skipping user ${user.id}: no name field to split`);
          continue;
        }

        // Split name into firstName and lastName
        const { firstName, lastName } = splitFullName(fullName);

        // Only update fields that are currently null
        const updateData: {
          firstName?: string | null;
          lastName?: string | null;
        } = {};
        if (!user.firstName) {
          updateData.firstName = firstName;
        }
        if (!user.lastName) {
          updateData.lastName = lastName;
        }

        // Update the user
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        console.log(
          `✓ Updated user ${user.id}: "${fullName}" → firstName: "${updateData.firstName ?? user.firstName}", lastName: "${updateData.lastName ?? user.lastName}"`
        );
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
