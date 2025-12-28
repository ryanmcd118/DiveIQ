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
        birthday: true,
        location: true,
        bio: true,
        pronouns: true,
        website: true,
      },
    });

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
      if (!recoveryFirstName && (session.user as any).name) {
        const nameParts = (session.user as any).name.trim().split(/\s+/);
        if (nameParts.length > 0) {
          recoveryFirstName = nameParts[0];
          recoveryLastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
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
    const { firstName, lastName, birthday, location, bio, pronouns, website } = body;

    // Normalize string values: trim and convert empty strings to null
    const normalizeString = (val: string | null | undefined): string | null => {
      if (val === undefined || val === null) return null;
      const trimmed = val.trim();
      return trimmed === "" ? null : trimmed;
    };

    // Normalize values first for validation
    const normalizedFirstName = normalizeString(firstName);
    const normalizedLastName = normalizeString(lastName);
    const normalizedBio = normalizeString(bio);
    const normalizedWebsite = normalizeString(website);
    const normalizedLocation = normalizeString(location);
    const normalizedPronouns = normalizeString(pronouns);

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

    // Validate website URL format (if provided)
    if (normalizedWebsite) {
      try {
        // Basic URL validation
        new URL(normalizedWebsite);
      } catch {
        return NextResponse.json(
          { error: "Invalid website URL format" },
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

    return NextResponse.json({ user: updatedUser });
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

