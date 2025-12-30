export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/certifications/definitions
 * Get all certification definitions (catalog)
 * Optional query param: ?agency=PADI|SSI to filter by agency
 * Returns sorted by: category (core first), then levelRank, then name
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agency = searchParams.get("agency");

    const where = agency && (agency === "PADI" || agency === "SSI")
      ? { agency }
      : undefined;

    // Fetch all definitions
    const definitions = await prisma.certificationDefinition.findMany({
      where,
    });

    // Sort manually to ensure: core first, then specialty, then professional
    // Then by levelRank, then by name
    const categoryOrder = { core: 0, specialty: 1, professional: 2 };
    definitions.sort((a, b) => {
      // First by category
      const categoryDiff =
        (categoryOrder[a.category as keyof typeof categoryOrder] ?? 999) -
        (categoryOrder[b.category as keyof typeof categoryOrder] ?? 999);
      if (categoryDiff !== 0) return categoryDiff;

      // Then by levelRank
      if (a.levelRank !== b.levelRank) return a.levelRank - b.levelRank;

      // Finally by name
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ definitions });
  } catch (err) {
    console.error("GET /api/certifications/definitions error", err);
    return NextResponse.json(
      { error: "Failed to fetch certification definitions" },
      { status: 500 }
    );
  }
}

