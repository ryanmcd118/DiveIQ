import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check sign-in methods
    const hasPassword = !!user.password;
    const hasGoogle = user.accounts.some((acc) => acc.provider === "google");

    return NextResponse.json({
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
    if (process.env.NODE_ENV === "development") {
      console.error("[GET /api/me] Error:", error);
      if (error instanceof Error) {
        console.error("[GET /api/me] Error message:", error.message);
      }
    } else {
      console.error("[GET /api/me] Error fetching user data");
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
