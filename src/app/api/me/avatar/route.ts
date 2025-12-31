import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/me/avatar
 * Update the current user's avatar URL
 * Requires authentication
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user?.id ||
      typeof session.user.id !== "string" ||
      session.user.id.trim() === ""
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { avatarUrl } = body;

    // Validate avatarUrl is a string or null
    if (
      avatarUrl !== null &&
      avatarUrl !== undefined &&
      typeof avatarUrl !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid avatarUrl format" },
        { status: 400 }
      );
    }

    // Basic validation: if provided, should be a valid URL
    if (avatarUrl && avatarUrl.trim() !== "") {
      try {
        new URL(avatarUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid avatar URL format" },
          { status: 400 }
        );
      }
    }

    // Update user's avatarUrl
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatarUrl:
          avatarUrl && avatarUrl.trim() !== "" ? avatarUrl.trim() : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[PATCH /api/me/avatar] Error:", error);
      if (error instanceof Error) {
        console.error("[PATCH /api/me/avatar] Error message:", error.message);
        console.error("[PATCH /api/me/avatar] Error stack:", error.stack);
      }
    } else {
      console.error("[PATCH /api/me/avatar] Error updating avatar");
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
