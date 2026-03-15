import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeProfileUpdate } from "@/features/profile/utils/normalizeProfile";
import { apiError, apiSuccess } from "@/lib/apiResponse";

const USER_PROFILE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  image: true,
  avatarUrl: true,
  birthday: true,
  location: true,
  bio: true,
  pronouns: true,
  website: true,
  homeDiveRegion: true,
  languages: true,
  primaryDiveTypes: true,
  experienceLevel: true,
  yearsDiving: true,
  certifyingAgency: true,
  typicalDivingEnvironment: true,
  lookingFor: true,
  favoriteDiveLocation: true,
  showCertificationsOnProfile: true,
  showGearOnProfile: true,
} as const;

const USER_PROFILE_WITH_KITS_SELECT = {
  ...USER_PROFILE_SELECT,
  profileKits: {
    select: {
      kitId: true,
      kit: {
        select: {
          id: true,
          name: true,
          kitItems: {
            select: {
              gearItem: {
                select: {
                  id: true,
                  type: true,
                  manufacturer: true,
                  model: true,
                  purchaseDate: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

/**
 * GET /api/profile
 * Get the current user's profile
 * Requires authentication
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Log session state in development
    if (process.env.NODE_ENV === "development") {
      console.log("[GET /api/profile] Session:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userContents: session?.user,
      });
    }

    // Check for session and user.id
    if (!session?.user) {
      if (process.env.NODE_ENV === "development") {
        console.error("[GET /api/profile] No session or user");
      }
      return apiError("Unauthorized", 401);
    }

    // Check for user.id - this is critical
    if (
      !session.user.id ||
      typeof session.user.id !== "string" ||
      session.user.id.trim() === ""
    ) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[GET /api/profile] Missing or invalid user.id:",
          session.user.id
        );
      }
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    if (process.env.NODE_ENV === "development") {
      console.log("[GET /api/profile] Fetching user with id:", userId);
    }

    // Try to find user by ID first
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_PROFILE_WITH_KITS_SELECT,
    });

    // Transform profile kits to a simpler structure if user exists
    if (user) {
      type TransformedUser = typeof user & {
        profileKitIds: string[];
        profileKits: Array<{
          id: string;
          name: string;
          items: Array<{
            id: string;
            type: string;
            manufacturer: string;
            model: string;
            purchaseDate: Date | null;
          }>;
        }>;
      };
      user = {
        ...user,
        profileKitIds: user.profileKits.map((pk) => pk.kitId),
        profileKits: user.profileKits.map((pk) => ({
          id: pk.kit.id,
          name: pk.kit.name,
          items: pk.kit.kitItems.map((ki) => ({
            id: ki.gearItem.id,
            type: ki.gearItem.type,
            manufacturer: ki.gearItem.manufacturer,
            model: ki.gearItem.model,
            purchaseDate: ki.gearItem.purchaseDate,
          })),
        })),
      } as TransformedUser;
    }

    // If not found by ID, try by email (resilience for stale sessions)
    if (!user && userEmail) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[GET /api/profile] User not found by id, trying email:",
          userEmail
        );
      }
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: USER_PROFILE_WITH_KITS_SELECT,
      });
    }

    if (!user) {
      return apiError("User not found", 404);
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[GET /api/profile] Successfully fetched user:", {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }

    return apiSuccess({ user });
  } catch (error) {
    console.error("GET /api/profile error", error);
    return apiError("Internal Server Error", 500);
  }
}

/**
 * PATCH /api/profile
 * Update the current user's profile
 * Requires authentication
 * Only allows updating profile fields, not email or password
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
    const { data, profileKitIds, validationError } =
      normalizeProfileUpdate(body);

    if (validationError) {
      return apiError(validationError.error, validationError.status);
    }

    // Update user profile with select that includes kits
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: USER_PROFILE_WITH_KITS_SELECT,
    });

    // Handle profile kit selection if showGearOnProfile is being set or profileKitIds is provided
    if (profileKitIds !== undefined || body.showGearOnProfile !== undefined) {
      const finalShowGear =
        body.showGearOnProfile !== undefined
          ? Boolean(body.showGearOnProfile)
          : updatedUser.showGearOnProfile;

      if (!finalShowGear) {
        // Clear all profile kits if gear visibility is disabled
        await prisma.userProfileKit.deleteMany({
          where: { userId: session.user.id },
        });
      } else if (profileKitIds !== undefined) {
        // Verify all kit IDs belong to the user
        if (profileKitIds.length > 0) {
          const userKits = await prisma.gearKit.findMany({
            where: {
              userId: session.user.id,
              id: { in: profileKitIds },
            },
            select: { id: true },
          });

          const validKitIds = userKits.map((kit) => kit.id);
          const invalidKitIds = profileKitIds.filter(
            (id: string) => !validKitIds.includes(id)
          );

          if (invalidKitIds.length > 0) {
            return apiError(
              `Invalid kit IDs: ${invalidKitIds.join(", ")}`,
              400
            );
          }
        }

        // Replace existing profile kits with new selection
        await prisma.userProfileKit.deleteMany({
          where: { userId: session.user.id },
        });

        if (profileKitIds.length > 0) {
          await prisma.userProfileKit.createMany({
            data: profileKitIds.map((kitId: string) => ({
              userId: session.user.id,
              kitId,
            })),
          });
        }
      }
    }

    // Re-fetch only if kit mutations happened (to get updated kit data)
    const needsRefetch =
      profileKitIds !== undefined || body.showGearOnProfile !== undefined;
    const finalUser = needsRefetch
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: USER_PROFILE_WITH_KITS_SELECT,
        })
      : updatedUser;

    // Transform profile kits to a simpler structure
    const userResponse = finalUser
      ? {
          ...finalUser,
          profileKitIds: finalUser.profileKits.map((pk) => pk.kitId),
          profileKits: finalUser.profileKits.map((pk) => ({
            id: pk.kit.id,
            name: pk.kit.name,
            items: pk.kit.kitItems.map((ki) => ({
              id: ki.gearItem.id,
              type: ki.gearItem.type,
              manufacturer: ki.gearItem.manufacturer,
              model: ki.gearItem.model,
              purchaseDate: ki.gearItem.purchaseDate,
            })),
          })),
        }
      : updatedUser;

    return apiSuccess({ user: userResponse });
  } catch (error) {
    console.error("PATCH /api/profile error", error);
    return apiError("Internal Server Error", 500);
  }
}
