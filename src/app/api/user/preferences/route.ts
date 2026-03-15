import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_UNIT_PREFERENCES,
  unitPreferencesSchema,
  type UnitPreferences,
} from "@/lib/units";
import { apiError, apiValidationError, apiSuccess } from "@/lib/apiResponse";

/**
 * GET /api/user/preferences
 * Get the current authenticated user's unit preferences
 * Returns preferences with defaults filled in if not set
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

    // Fetch user with unit preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        unitPreferences: true,
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    // Merge with defaults if preferences are not set
    const preferences: UnitPreferences = user.unitPreferences
      ? {
          ...DEFAULT_UNIT_PREFERENCES,
          ...(user.unitPreferences as Partial<UnitPreferences>),
        }
      : DEFAULT_UNIT_PREFERENCES;

    return apiSuccess({ preferences });
  } catch (error) {
    console.error("GET /api/user/preferences error", error);
    return apiError("Internal Server Error", 500);
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
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();

    // Validate the preferences
    const validationResult = unitPreferencesSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError(
        "Invalid preferences",
        validationResult.error.issues
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

    return apiSuccess({ preferences });
  } catch (error) {
    console.error("PATCH /api/user/preferences error", error);
    return apiError("Internal Server Error", 500);
  }
}
