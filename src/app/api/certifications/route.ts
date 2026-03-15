export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserCertificationSchema } from "@/features/certifications/types";
import {
  apiError,
  apiValidationError,
  apiSuccess,
  apiCreated,
} from "@/lib/apiResponse";

/**
 * GET /api/certifications
 * Get all certifications for the authenticated user
 * Returns certifications with expanded definition info
 */
export async function GET(_req: NextRequest) {
  void _req;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

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

    return apiSuccess({ certifications });
  } catch (err) {
    console.error("GET /api/certifications error", err);
    return apiError("Failed to fetch certifications", 500);
  }
}

/**
 * POST /api/certifications
 * Create a new user certification
 * Requires authentication
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();

    // Validate input
    const validationResult = createUserCertificationSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError("Invalid input", validationResult.error.issues);
    }

    const data = validationResult.data;

    // Verify the certification definition exists
    const definition = await prisma.certificationDefinition.findUnique({
      where: { id: data.certificationDefinitionId },
    });

    if (!definition) {
      return apiError("Certification definition not found", 404);
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
        certEarnedDate === inputEarnedDate && certCertNumber === inputCertNumber
      );
    });

    if (isDuplicate) {
      return apiError(
        "Duplicate certification: same definition, earned date, and cert number",
        409
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

    return apiCreated({ certification });
  } catch (err) {
    console.error("POST /api/certifications error", err);
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return apiError("Duplicate certification", 409);
    }
    return apiError("Failed to create certification", 500);
  }
}
