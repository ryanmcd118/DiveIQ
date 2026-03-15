import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/apiResponse";

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
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const { avatarUrl } = body;

    // Validate avatarUrl is a string or null
    if (
      avatarUrl !== null &&
      avatarUrl !== undefined &&
      typeof avatarUrl !== "string"
    ) {
      return apiError("Invalid avatarUrl format", 400);
    }

    // Basic validation: if provided, should be a valid URL
    if (avatarUrl && avatarUrl.trim() !== "") {
      try {
        new URL(avatarUrl);
      } catch {
        return apiError("Invalid avatar URL format", 400);
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

    return apiSuccess({ user: updatedUser });
  } catch (error) {
    console.error("PATCH /api/me/avatar error", error);
    return apiError("Internal Server Error", 500);
  }
}
