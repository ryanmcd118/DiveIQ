import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

/**
 * PUT /api/account/password
 * Change the authenticated user's password
 * Requires authentication and credentials account (password must exist)
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Fetch user with password to verify they have a credentials account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has a password (credentials account)
    if (!user.password) {
      return NextResponse.json(
        { error: "This account does not have a password. You signed in with Google." },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Get current session token from cookies
    const cookieStore = await cookies();
    const sessionToken = 
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value ||
      null;

    // Update password and delete other sessions in a transaction
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      // Delete all other sessions (keep current one if we found it)
      if (sessionToken) {
        await tx.session.deleteMany({
          where: {
            userId,
            sessionToken: { not: sessionToken },
          },
        });
      } else {
        // If we can't find the current session token, delete all sessions
        // This is safe but may sign the user out
        await tx.session.deleteMany({
          where: { userId },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error changing password:", err);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}

