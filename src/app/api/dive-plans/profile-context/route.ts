import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";
import { gearRepository } from "@/services/database/repositories/gearRepository";

/**
 * GET /api/dive-plans/profile-context
 * Returns profile data for personalizing dive plan briefings
 * Requires authentication
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [stats, lastDiveRecord, certs, gear, user] = await Promise.all([
      diveLogRepository.getStatistics(userId),
      prisma.diveLog.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      prisma.userCertification.findMany({
        where: { userId },
        include: {
          certificationDefinition: {
            select: {
              agency: true,
              name: true,
              slug: true,
              levelRank: true,
              category: true,
            },
          },
        },
        orderBy: [{ certificationDefinition: { levelRank: "asc" } }],
      }),
      gearRepository.findMany(userId, { includeInactive: false }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          experienceLevel: true,
          yearsDiving: true,
          homeDiveRegion: true,
          primaryDiveTypes: true,
        },
      }),
    ]);

    let primaryDiveTypes: string[] = [];
    try {
      if (user?.primaryDiveTypes) {
        primaryDiveTypes = JSON.parse(user.primaryDiveTypes) as string[];
      }
    } catch {
      primaryDiveTypes = [];
    }

    return NextResponse.json({
      totalDives: stats.totalDives,
      lastDiveDate: lastDiveRecord?.date ?? null,
      experienceLevel: user?.experienceLevel ?? null,
      yearsDiving: user?.yearsDiving ?? null,
      homeDiveRegion: user?.homeDiveRegion ?? null,
      primaryDiveTypes,
      certifications: certs.map((c) => ({
        agency: c.certificationDefinition.agency,
        name: c.certificationDefinition.name,
        slug: c.certificationDefinition.slug,
        levelRank: c.certificationDefinition.levelRank,
        category: c.certificationDefinition.category,
      })),
      gear: gear.map((g) => ({
        id: g.id,
        type: g.type,
        manufacturer: g.manufacturer,
        model: g.model,
        nickname: g.nickname,
      })),
    });
  } catch (err) {
    console.error("GET /api/dive-plans/profile-context error", err);
    return NextResponse.json(
      { error: "Failed to load profile context." },
      { status: 500 }
    );
  }
}
