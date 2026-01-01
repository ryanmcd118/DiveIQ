import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { encode } from "next-auth/jwt";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

/**
 * PUT /api/account/password
 * Change the authenticated user's password
 * Requires authentication and credentials account (password must exist)
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has a password (credentials account)
    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "This account does not have a password. You signed in with Google.",
        },
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

    // Get current JWT token to preserve its data
    const currentToken = await getToken({
      req: req as unknown as Parameters<typeof getToken>[0]["req"],
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!currentToken || !currentToken.id) {
      return NextResponse.json(
        { error: "Session token not found" },
        { status: 401 }
      );
    }

    // Update password and increment sessionVersion in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update password and increment sessionVersion atomically
      return await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          sessionVersion: {
            increment: 1,
          } as Prisma.IntFieldUpdateOperationsInput,
        },
        select: {
          sessionVersion: true,
        },
      });
    });

    // Create a new JWT token with updated sessionVersion to keep current session alive
    const newTokenPayload = {
      ...currentToken,
      sessionVersion: updatedUser.sessionVersion ?? 0,
    };

    // Encode the new token
    const newToken = await encode({
      token: newTokenPayload,
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 30 * 24 * 60 * 60, // 30 days (NextAuth default)
    });

    // Determine cookie name based on environment
    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    // Create response with success
    const response = NextResponse.json({ success: true });

    // Set the new JWT cookie with updated sessionVersion
    // This keeps the current session alive while invalidating all others
    response.cookies.set(cookieName, newToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    console.error("Error changing password:", err);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
