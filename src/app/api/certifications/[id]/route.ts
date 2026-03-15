export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserCertificationSchema } from "@/features/certifications/types";
import { apiError, apiSuccess, apiOk } from "@/lib/apiResponse";

/**
 * PATCH /api/certifications/:id
 * Update a user certification
 * Requires authentication
 * User can only update their own certifications
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const resolvedParams = await Promise.resolve(params);
    const certId = resolvedParams.id;

    // Validate input
    const validationResult = updateUserCertificationSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError("Invalid input", 400);
    }

    const data = validationResult.data;

    // Verify the certification exists and belongs to the user
    const existing = await prisma.userCertification.findUnique({
      where: { id: certId },
    });

    if (!existing) {
      return apiError("Certification not found", 404);
    }

    if (existing.userId !== session.user.id) {
      return apiError("Certification not found", 404);
    }

    // Optional: If setting isFeatured=true, check if we should enforce max 3 featured
    // For MVP, we'll allow multiple featured (as per requirements)
    // Uncomment below if you want to enforce max 3:
    /*
    if (data.isFeatured === true) {
      const featuredCount = await prisma.userCertification.count({
        where: {
          userId: session.user.id,
          isFeatured: true,
          id: { not: params.id }, // Exclude current cert
        },
      });

      if (featuredCount >= 3) {
        return apiError("Maximum of 3 featured certifications allowed", 400);
      }
    }
    */

    // Build update data
    const updateData: {
      earnedDate?: Date | null;
      certNumber?: string | null;
      diveShop?: string | null;
      location?: string | null;
      instructor?: string | null;
      notes?: string | null;
      isFeatured?: boolean;
    } = {};
    if (data.earnedDate !== undefined) {
      updateData.earnedDate = data.earnedDate
        ? new Date(data.earnedDate)
        : null;
    }
    if (data.certNumber !== undefined) {
      updateData.certNumber = data.certNumber || null;
    }
    if (data.diveShop !== undefined) {
      updateData.diveShop = data.diveShop || null;
    }
    if (data.location !== undefined) {
      updateData.location = data.location || null;
    }
    if (data.instructor !== undefined) {
      updateData.instructor = data.instructor || null;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes || null;
    }
    if (data.isFeatured !== undefined) {
      updateData.isFeatured = data.isFeatured;
    }

    // Update the certification
    const updated = await prisma.userCertification.update({
      where: { id: certId },
      data: updateData,
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

    return apiSuccess({ certification: updated });
  } catch (err) {
    console.error("PATCH /api/certifications/[id] error", err);
    if (
      err instanceof Error &&
      err.message.includes("Record to update not found")
    ) {
      return apiError("Certification not found", 404);
    }
    return apiError("Failed to update certification", 500);
  }
}

/**
 * DELETE /api/certifications/:id
 * Delete a user certification
 * Requires authentication
 * User can only delete their own certifications
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const resolvedParams = await Promise.resolve(params);
    const certId = resolvedParams.id;

    // Verify the certification exists and belongs to the user
    const existing = await prisma.userCertification.findUnique({
      where: { id: certId },
    });

    if (!existing) {
      return apiError("Certification not found", 404);
    }

    if (existing.userId !== session.user.id) {
      return apiError("Certification not found", 404);
    }

    // Delete the certification
    await prisma.userCertification.delete({
      where: { id: certId },
    });

    return apiOk();
  } catch (err) {
    console.error("DELETE /api/certifications/[id] error", err);
    if (
      err instanceof Error &&
      err.message.includes("Record to delete does not exist")
    ) {
      return apiError("Certification not found", 404);
    }
    return apiError("Failed to delete certification", 500);
  }
}
