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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { birthday, location, bio, pronouns, website } = body;

    // Validate bio max length (if provided)
    if (bio !== undefined && bio !== null && bio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Validate website URL format (if provided)
    if (website !== undefined && website !== null && website !== "") {
      try {
        // Basic URL validation
        new URL(website);
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

    // Update user profile (only allowed fields)
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(birthday !== undefined && { birthday: birthdayDate }),
        ...(location !== undefined && { location: location || null }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(pronouns !== undefined && { pronouns: pronouns || null }),
        ...(website !== undefined && { website: website || null }),
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
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

