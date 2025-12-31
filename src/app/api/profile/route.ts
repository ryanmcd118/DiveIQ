import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile
 * Get the current user's profile
 * Requires authentication
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Log session state in development
    if (process.env.NODE_ENV === 'development') {
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
      if (process.env.NODE_ENV === 'development') {
        console.error("[GET /api/profile] No session or user");
      }
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check for user.id - this is critical
    if (!session.user.id || typeof session.user.id !== 'string' || session.user.id.trim() === '') {
      if (process.env.NODE_ENV === 'development') {
        console.error("[GET /api/profile] Missing or invalid user.id:", session.user.id);
      }
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    if (process.env.NODE_ENV === 'development') {
      console.log("[GET /api/profile] Fetching user with id:", userId);
    }

    // Try to find user by ID first
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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
      },
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
      if (process.env.NODE_ENV === 'development') {
        console.log("[GET /api/profile] User not found by id, trying email:", userEmail);
      }
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          image: true,
          birthday: true,
          location: true,
          bio: true,
          pronouns: true,
          website: true,
        },
      });
    }

    // If still not found, recover by creating user record (dev resilience)
    if (!user && userEmail) {
      if (process.env.NODE_ENV === 'development') {
        console.log("[GET /api/profile] User not found, recovering by creating user record");
      }
      
      // Extract firstName/lastName from session if available
      let recoveryFirstName: string | null = session.user.firstName || null;
      let recoveryLastName: string | null = session.user.lastName || null;
      
      // If names missing, try to split session.user.name
      if (!recoveryFirstName) {
        const sessionUserUnknown = session.user as unknown;
        if (
          sessionUserUnknown &&
          typeof sessionUserUnknown === "object" &&
          "name" in sessionUserUnknown &&
          typeof sessionUserUnknown.name === "string"
        ) {
          const nameParts = sessionUserUnknown.name.trim().split(/\s+/);
          if (nameParts.length > 0) {
            recoveryFirstName = nameParts[0];
            recoveryLastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
          }
        }
      }
      
      // Create user record with available data
      user = await prisma.user.create({
        data: {
          email: userEmail,
          firstName: recoveryFirstName,
          lastName: recoveryLastName,
          emailVerified: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          image: true,
          birthday: true,
          location: true,
          bio: true,
          pronouns: true,
          website: true,
        },
      });
    }

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.error("[GET /api/profile] Unable to find or create user");
      }
      return NextResponse.json(
        { error: "Unable to load user profile" },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("[GET /api/profile] Successfully fetched user:", { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName 
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    // Always log the full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error("[GET /api/profile] Error:", error);
      if (error instanceof Error) {
        console.error("[GET /api/profile] Error message:", error.message);
        console.error("[GET /api/profile] Error stack:", error.stack);
      }
    } else {
      console.error("[GET /api/profile] Error fetching profile");
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
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

    if (!session?.user?.id || typeof session.user.id !== 'string' || session.user.id.trim() === '') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Whitelist only allowed profile fields - explicitly exclude certifications and other fields
    // This prevents any accidental inclusion of certifications, userCertifications, or nested objects
    const {
      firstName,
      lastName,
      birthday,
      location,
      bio,
      pronouns,
      website,
      homeDiveRegion,
      languages,
      primaryDiveTypes,
      experienceLevel,
      yearsDiving,
      certifyingAgency,
      typicalDivingEnvironment,
      lookingFor,
      favoriteDiveLocation,
      showCertificationsOnProfile,
      showGearOnProfile,
      profileKitIds,
    } = body;
    
    // Explicitly ignore any other fields (especially certifications, userCertifications, etc.)
    // Only the whitelisted fields above will be processed
    
    // Validate profileKitIds if provided
    let normalizedProfileKitIds: string[] | undefined = undefined;
    if (profileKitIds !== undefined) {
      if (!Array.isArray(profileKitIds)) {
        return NextResponse.json(
          { error: "profileKitIds must be an array" },
          { status: 400 }
        );
      }
      // Filter out invalid values and ensure all are strings
      normalizedProfileKitIds = profileKitIds
        .filter((id): id is string => typeof id === "string" && id.trim() !== "")
        .map((id) => id.trim());
    }

    // Normalize string values: trim and convert empty strings to null
    const normalizeString = (val: string | null | undefined): string | null => {
      if (val === undefined || val === null) return null;
      const trimmed = val.trim();
      return trimmed === "" ? null : trimmed;
    };

    // Normalize website URL: prepend https:// if missing protocol
    const normalizeWebsiteUrl = (url: string | null | undefined): string | null => {
      const normalized = normalizeString(url);
      if (!normalized) return null;
      
      // If it already starts with http:// or https://, return as-is
      if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
        return normalized;
      }
      
      // Otherwise, prepend https://
      return `https://${normalized}`;
    };

    // Normalize values first for validation
    const normalizedFirstName = normalizeString(firstName);
    const normalizedLastName = normalizeString(lastName);
    const normalizedBio = normalizeString(bio);
    const normalizedWebsite = normalizeWebsiteUrl(website); // Normalize website URL (prepend https:// if needed)
    const normalizedLocation = normalizeString(location);
    const normalizedPronouns = normalizeString(pronouns);
    const normalizedHomeDiveRegion = normalizeString(homeDiveRegion);
    const normalizedLanguages = normalizeString(languages);
    const normalizedPrimaryDiveTypes = normalizeString(primaryDiveTypes);
    const normalizedExperienceLevel = normalizeString(experienceLevel);
    const normalizedCertifyingAgency = normalizeString(certifyingAgency);
    const normalizedTypicalDivingEnvironment = normalizeString(typicalDivingEnvironment);
    const normalizedLookingFor = normalizeString(lookingFor);
    const normalizedFavoriteDiveLocation = normalizeString(favoriteDiveLocation);

    // Validate firstName/lastName max length (if provided)
    if (normalizedFirstName && normalizedFirstName.length > 50) {
      return NextResponse.json(
        { error: "First name must be 50 characters or less" },
        { status: 400 }
      );
    }
    if (normalizedLastName && normalizedLastName.length > 50) {
      return NextResponse.json(
        { error: "Last name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Validate bio max length (if provided)
    if (normalizedBio && normalizedBio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Validate website URL format (if provided, after normalization)
    if (normalizedWebsite) {
      try {
        // Validate using URL constructor (will throw if invalid)
        new URL(normalizedWebsite);
      } catch {
        return NextResponse.json(
          { error: "Please enter a valid website address" },
          { status: 400 }
        );
      }
    }

    // Parse birthday if provided - normalize to noon UTC to avoid timezone issues
    let birthdayDate: Date | null = null;
    if (birthday !== undefined) {
      if (birthday !== null && birthday !== "") {
        // Parse the date string (expected format: YYYY-MM-DD)
        const dateParts = birthday.split("-");
        if (dateParts.length !== 3) {
          return NextResponse.json(
            { error: "Invalid birthday date format" },
            { status: 400 }
          );
        }
        
        // Create date at noon UTC to avoid timezone shifts
        birthdayDate = new Date(Date.UTC(
          parseInt(dateParts[0], 10),
          parseInt(dateParts[1], 10) - 1, // Month is 0-indexed
          parseInt(dateParts[2], 10),
          12, 0, 0, 0 // Noon UTC
        ));
        
        if (isNaN(birthdayDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid birthday date format" },
            { status: 400 }
          );
        }
      } else {
        // Explicitly set to null to clear the field
        birthdayDate = null;
      }
    }

    // Normalize yearsDiving (convert to integer or null)
    let normalizedYearsDiving: number | null = null;
    if (yearsDiving !== undefined && yearsDiving !== null && yearsDiving !== "") {
      const parsed = typeof yearsDiving === "number" ? yearsDiving : parseInt(String(yearsDiving), 10);
      if (!isNaN(parsed) && parsed >= 0) {
        normalizedYearsDiving = parsed;
      }
    }

    // Update user profile (only allowed fields) - use normalized values
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(firstName !== undefined && { firstName: normalizedFirstName }),
        ...(lastName !== undefined && { lastName: normalizedLastName }),
        ...(birthday !== undefined && { birthday: birthdayDate }),
        ...(location !== undefined && { location: normalizedLocation }),
        ...(bio !== undefined && { bio: normalizedBio }),
        ...(pronouns !== undefined && { pronouns: normalizedPronouns }),
        ...(website !== undefined && { website: normalizedWebsite }),
        ...(homeDiveRegion !== undefined && { homeDiveRegion: normalizedHomeDiveRegion }),
        ...(languages !== undefined && { languages: normalizedLanguages }),
        ...(primaryDiveTypes !== undefined && { primaryDiveTypes: normalizedPrimaryDiveTypes }),
        ...(experienceLevel !== undefined && { experienceLevel: normalizedExperienceLevel }),
        ...(yearsDiving !== undefined && { yearsDiving: normalizedYearsDiving }),
        ...(certifyingAgency !== undefined && { certifyingAgency: normalizedCertifyingAgency }),
        ...(typicalDivingEnvironment !== undefined && { typicalDivingEnvironment: normalizedTypicalDivingEnvironment }),
        ...(lookingFor !== undefined && { lookingFor: normalizedLookingFor }),
        ...(favoriteDiveLocation !== undefined && { favoriteDiveLocation: normalizedFavoriteDiveLocation }),
        ...(showCertificationsOnProfile !== undefined && { showCertificationsOnProfile: Boolean(showCertificationsOnProfile) }),
        ...(showGearOnProfile !== undefined && { showGearOnProfile: Boolean(showGearOnProfile) }),
      },
      select: {
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
      },
    });

    // Handle profile kit selection if showGearOnProfile is being set or profileKitIds is provided
    if (normalizedProfileKitIds !== undefined || showGearOnProfile !== undefined) {
      const finalShowGear = showGearOnProfile !== undefined 
        ? Boolean(showGearOnProfile)
        : updatedUser.showGearOnProfile;

      if (!finalShowGear) {
        // Clear all profile kits if gear visibility is disabled
        await prisma.userProfileKit.deleteMany({
          where: { userId: session.user.id },
        });
      } else if (normalizedProfileKitIds !== undefined) {
        // Verify all kit IDs belong to the user
        if (normalizedProfileKitIds.length > 0) {
          const userKits = await prisma.gearKit.findMany({
            where: {
              userId: session.user.id,
              id: { in: normalizedProfileKitIds },
            },
            select: { id: true },
          });

          const validKitIds = userKits.map((kit) => kit.id);
          const invalidKitIds = normalizedProfileKitIds.filter(
            (id) => !validKitIds.includes(id)
          );

          if (invalidKitIds.length > 0) {
            return NextResponse.json(
              { error: `Invalid kit IDs: ${invalidKitIds.join(", ")}` },
              { status: 400 }
            );
          }
        }

        // Replace existing profile kits with new selection
        await prisma.userProfileKit.deleteMany({
          where: { userId: session.user.id },
        });

        if (normalizedProfileKitIds.length > 0) {
          await prisma.userProfileKit.createMany({
            data: normalizedProfileKitIds.map((kitId) => ({
              userId: session.user.id,
              kitId,
            })),
          });
        }
      }
    }

    // Fetch updated user with profile kits for response
    const userWithKits = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
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
      },
    });

    // Transform profile kits to a simpler structure
    const userResponse = userWithKits ? {
      ...userWithKits,
      profileKitIds: userWithKits.profileKits.map((pk) => pk.kitId),
      profileKits: userWithKits.profileKits.map((pk) => ({
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
    } : updatedUser;

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    // Outer catch for all other errors
    if (process.env.NODE_ENV === 'development') {
      console.error("[PATCH /api/profile] Error:", error);
      if (error instanceof Error) {
        console.error("[PATCH /api/profile] Error message:", error.message);
        console.error("[PATCH /api/profile] Error stack:", error.stack);
      }
    } else {
      console.error("[PATCH /api/profile] Error updating profile");
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

