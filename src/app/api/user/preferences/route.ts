import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DEFAULT_UNIT_PREFERENCES, type UnitPreferences } from "@/lib/units";

/**
 * Validation schema for unit preferences
 */
const unitPreferencesSchema = z.object({
  depth: z.enum(["ft", "m"]),
  temperature: z.enum(["f", "c"]),
  pressure: z.enum(["psi", "bar"]),
  weight: z.enum(["lb", "kg"]),
});

/**
 * GET /api/user/preferences
 * Get the current authenticated user's unit preferences
 * Returns preferences with defaults filled in if not set
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user?.id ||
      typeof session.user.id !== "string" ||
      session.user.id.trim() === ""
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with unit preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        unitPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Merge with defaults if preferences are not set
    const preferences: UnitPreferences = user.unitPreferences
      ? {
          ...DEFAULT_UNIT_PREFERENCES,
          ...(user.unitPreferences as Partial<UnitPreferences>),
        }
      : DEFAULT_UNIT_PREFERENCES;

    return NextResponse.json({ preferences });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[GET /api/user/preferences] Error:", error);
    } else {
      console.error("[GET /api/user/preferences] Error fetching preferences");
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/preferences
 * Update the current authenticated user's unit preferences
 * Validates and saves preferences to database
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

    // Validate the preferences
    const validationResult = unitPreferencesSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid preferences",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const preferences = validationResult.data;

    // Update user preferences
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        unitPreferences: preferences,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[PATCH /api/user/preferences] Error:", error);
    } else {
      console.error("[PATCH /api/user/preferences] Error updating preferences");
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
