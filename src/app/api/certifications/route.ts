export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserCertificationSchema } from "@/features/certifications/types";

/**
 * GET /api/certifications
 * Get all certifications for the authenticated user
 * Returns certifications with expanded definition info
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const certifications = await prisma.userCertification.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        certificationDefinition: {
          select: {
            id: true,
            agency: true,
            name: true,
            slug: true,
            levelRank: true,
            category: true,
            badgeImageUrl: true,
          },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { earnedDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ certifications });
  } catch (err) {
    console.error("GET /api/certifications error", err);
    return NextResponse.json(
      { error: "Failed to fetch certifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certifications
 * Create a new user certification
 * Requires authentication
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate input
    const validationResult = createUserCertificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify the certification definition exists
    const definition = await prisma.certificationDefinition.findUnique({
      where: { id: data.certificationDefinitionId },
    });

    if (!definition) {
      return NextResponse.json(
        { error: "Certification definition not found" },
        { status: 404 }
      );
    }

    // Check for duplicates
    // Allow duplicates ONLY if earnedDate differs OR certNumber differs
    // Otherwise reject with 409
    const existingCerts = await prisma.userCertification.findMany({
      where: {
        userId: session.user.id,
        certificationDefinitionId: data.certificationDefinitionId,
      },
    });

    // Check if there's an exact duplicate (same definition, earnedDate, and certNumber)
    const inputEarnedDate = data.earnedDate
      ? new Date(data.earnedDate).toISOString().split("T")[0]
      : null;
    const inputCertNumber = data.certNumber?.trim() || null;

    const isDuplicate = existingCerts.some((cert) => {
      const certEarnedDate = cert.earnedDate
        ? cert.earnedDate.toISOString().split("T")[0]
        : null;
      const certCertNumber = cert.certNumber?.trim() || null;

      // If both have the same earnedDate (or both null) AND same certNumber (or both null), it's a duplicate
      return (
        certEarnedDate === inputEarnedDate &&
        certCertNumber === inputCertNumber
      );
    });

    if (isDuplicate) {
      return NextResponse.json(
        {
          error:
            "Duplicate certification: same definition, earned date, and cert number",
        },
        { status: 409 }
      );
    }

    // Create the certification
    const certification = await prisma.userCertification.create({
      data: {
        userId: session.user.id,
        certificationDefinitionId: data.certificationDefinitionId,
        earnedDate: data.earnedDate ? new Date(data.earnedDate) : null,
        certNumber: data.certNumber || null,
        diveShop: data.diveShop || null,
        location: data.location || null,
        instructor: data.instructor || null,
        notes: data.notes || null,
        isFeatured: data.isFeatured ?? false,
      },
      include: {
        certificationDefinition: {
          select: {
            id: true,
            agency: true,
            name: true,
            slug: true,
            levelRank: true,
            category: true,
            badgeImageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ certification }, { status: 201 });
  } catch (err) {
    console.error("POST /api/certifications error", err);
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Duplicate certification" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create certification" },
      { status: 500 }
    );
  }
}

