import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/account
 * Delete the authenticated user's account and all associated data
 * Requires authentication
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // Perform defensive deletion in a transaction
    // Even though we have cascade deletes, this ensures proper order
    // and handles any edge cases where cascades might not behave as expected
    await prisma.$transaction(async (tx) => {
      // 1. Delete Sessions for user (cascade from User)
      await tx.session.deleteMany({
        where: { userId },
      });

      // 2. Delete Accounts for user (cascade from User)
      await tx.account.deleteMany({
        where: { userId },
      });

      // 3. Delete DiveGearItem rows for dives owned by user
      // (cascade from DiveLog, but delete explicitly for safety)
      const userDiveLogs = await tx.diveLog.findMany({
        where: { userId },
        select: { id: true },
      });
      const diveIds = userDiveLogs.map((dive) => dive.id);

      if (diveIds.length > 0) {
        await tx.diveGearItem.deleteMany({
          where: { diveId: { in: diveIds } },
        });
      }

      // 4. Delete DiveLogs where userId = user.id (cascade from User)
      // This would cascade delete DiveGearItems, but we already deleted them
      await tx.diveLog.deleteMany({
        where: { userId },
      });

      // 5. Delete DivePlans where userId = user.id (cascade from User)
      await tx.divePlan.deleteMany({
        where: { userId },
      });

      // 6. Delete GearKitItems for kits owned by user
      // (cascade from GearKit, but delete explicitly for safety)
      const userGearKits = await tx.gearKit.findMany({
        where: { userId },
        select: { id: true },
      });
      const kitIds = userGearKits.map((kit) => kit.id);

      if (kitIds.length > 0) {
        await tx.gearKitItem.deleteMany({
          where: { kitId: { in: kitIds } },
        });
      }

      // 7. Delete GearKits where userId = user.id (cascade from User)
      // This would cascade delete GearKitItems, but we already deleted them
      await tx.gearKit.deleteMany({
        where: { userId },
      });

      // 8. Delete GearItems where userId = user.id (cascade from User)
      // This would cascade delete any remaining GearKitItems and DiveGearItems
      await tx.gearItem.deleteMany({
        where: { userId },
      });

      // 9. Finally delete User (cascades to all remaining relations)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting account:", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

