import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/apiResponse";

/**
 * GET /api/me
 * Get the current authenticated user's profile data from the database
 * Returns fresh DB data (not session cache)
 */
export async function GET(_req: NextRequest) {
  void _req;
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user?.id ||
      typeof session.user.id !== "string" ||
      session.user.id.trim() === ""
    ) {
      return apiError("Unauthorized", 401);
    }

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        image: true,
        password: true, // Include password to check if credentials account exists
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    // Check sign-in methods
    const hasPassword = !!user.password;
    const hasGoogle = user.accounts.some((acc) => acc.provider === "google");

    return apiSuccess({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      image: user.image,
      hasPassword,
      hasGoogle,
    });
  } catch (error) {
    console.error("GET /api/me error", error);
    return apiError("Internal Server Error", 500);
  }
}
