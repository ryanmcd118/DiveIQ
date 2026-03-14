import { prisma } from "@/lib/prisma";
import type { DiveLogInput, DiveLogEntry } from "@/features/dive-log/types";
import type { Prisma } from "@prisma/client";

/** Coalesce undefined to null for optional Prisma fields. */
const n = <T>(val: T | undefined): T | null => val ?? null;

/**
 * Data access layer for DiveLog operations
 * Provides a clean interface to database operations
 */
export const diveLogRepository = {
  /**
   * Create a new dive log entry
   */
  async create(data: DiveLogInput, userId: string): Promise<DiveLogEntry> {
    return prisma.diveLog.create({
      data: {
        date: data.date,
        startTime: n(data.startTime),
        endTime: n(data.endTime),
        // diveNumber and auto/override will be normalized by recomputeDiveNumbersForUser
        diveNumber: n(data.diveNumber),
        diveNumberAuto: n(data.diveNumberAuto),
        diveNumberOverride: n(data.diveNumberOverride),
        region: n(data.region),
        siteName: data.siteName,
        buddyName: n(data.buddyName),
        diveTypeTags: n(data.diveTypeTags),
        maxDepthCm: n(data.maxDepthCm),
        bottomTime: n(data.bottomTime),
        safetyStopDepthCm: n(data.safetyStopDepthCm),
        safetyStopDurationMin: n(data.safetyStopDurationMin),
        surfaceIntervalMin: n(data.surfaceIntervalMin),
        waterTempCx10: n(data.waterTempCx10),
        waterTempBottomCx10: n(data.waterTempBottomCx10),
        visibilityCm: n(data.visibilityCm),
        current: n(data.current),
        gasType: n(data.gasType),
        fO2: n(data.fO2),
        tankCylinder: n(data.tankCylinder),
        startPressureBar: n(data.startPressureBar),
        endPressureBar: n(data.endPressureBar),
        exposureProtection: n(data.exposureProtection),
        weightUsedKg: n(data.weightUsedKg),
        gearKitId: n(data.gearKitId),
        gearNotes: n(data.gearNotes),
        isTrainingDive: data.isTrainingDive ?? false,
        trainingCourse: n(data.trainingCourse),
        trainingInstructor: n(data.trainingInstructor),
        trainingSkills: n(data.trainingSkills),
        notes: n(data.notes),
        userId,
      },
    });
  },

  /**
   * Find a single dive log entry by ID
   */
  async findById(id: string, userId: string): Promise<DiveLogEntry | null> {
    return prisma.diveLog.findFirst({
      where: { id, userId },
    });
  },

  /**
   * Find all dive log entries, ordered by date (newest first)
   */
  async findMany(options: {
    orderBy?: "date" | "createdAt";
    take?: number;
    userId: string;
  }): Promise<DiveLogEntry[]> {
    return prisma.diveLog.findMany({
      where: { userId: options.userId },
      orderBy: { [options.orderBy ?? "date"]: "desc" },
      take: options.take,
    });
  },

  /**
   * Update an existing dive log entry
   */
  async update(
    id: string,
    data: DiveLogInput,
    userId: string
  ): Promise<DiveLogEntry> {
    const existing = await prisma.diveLog.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error("Dive log not found or unauthorized");
    }
    return prisma.diveLog.update({
      where: { id },
      data: {
        date: data.date,
        startTime: n(data.startTime),
        endTime: n(data.endTime),
        // diveNumber and auto/override will be normalized by recomputeDiveNumbersForUser
        diveNumber: n(data.diveNumber),
        diveNumberAuto: n(data.diveNumberAuto),
        diveNumberOverride: n(data.diveNumberOverride),
        region: n(data.region),
        siteName: data.siteName,
        buddyName: n(data.buddyName),
        diveTypeTags: n(data.diveTypeTags),
        maxDepthCm: n(data.maxDepthCm),
        bottomTime: n(data.bottomTime),
        safetyStopDepthCm: n(data.safetyStopDepthCm),
        safetyStopDurationMin: n(data.safetyStopDurationMin),
        surfaceIntervalMin: n(data.surfaceIntervalMin),
        waterTempCx10: n(data.waterTempCx10),
        waterTempBottomCx10: n(data.waterTempBottomCx10),
        visibilityCm: n(data.visibilityCm),
        current: n(data.current),
        gasType: n(data.gasType),
        fO2: n(data.fO2),
        tankCylinder: n(data.tankCylinder),
        startPressureBar: n(data.startPressureBar),
        endPressureBar: n(data.endPressureBar),
        exposureProtection: n(data.exposureProtection),
        weightUsedKg: n(data.weightUsedKg),
        gearKitId: n(data.gearKitId),
        gearNotes: n(data.gearNotes),
        isTrainingDive: data.isTrainingDive ?? false,
        trainingCourse: n(data.trainingCourse),
        trainingInstructor: n(data.trainingInstructor),
        trainingSkills: n(data.trainingSkills),
        notes: n(data.notes),
      },
    });
  },

  /**
   * Delete a dive log entry
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.diveLog.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error("Dive log not found or unauthorized");
    }
    await prisma.diveLog.delete({
      where: { id },
    });
  },

  /**
   * Get count of all dive log entries
   */
  async count(userId: string): Promise<number> {
    return prisma.diveLog.count({ where: { userId } });
  },

  /**
   * Recompute chronological dive numbers for all dives for a user.
   * Oldest dive gets auto #1, next #2, etc.
   * Keeps existing diveNumberOverride values stable while updating
   * diveNumberAuto and effective diveNumber.
   *
   * Updates are batched in chunks of 100 to avoid hitting database
   * transaction limits for users with large dive histories.
   */
  async recomputeDiveNumbersForUser(userId: string): Promise<void> {
    const dives = await prisma.diveLog.findMany({
      where: { userId },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
        { createdAt: "asc" },
        { id: "asc" },
      ],
    });

    if (!dives.length) return;

    const CHUNK_SIZE = 100;
    const updates = dives.map((dive, index) => {
      const autoNumber = index + 1;
      const override = dive.diveNumberOverride ?? null;
      const effective = override ?? autoNumber;
      return prisma.diveLog.update({
        where: { id: dive.id },
        data: {
          diveNumberAuto: autoNumber,
          diveNumber: effective,
        },
      });
    });

    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      await prisma.$transaction(updates.slice(i, i + CHUNK_SIZE));
    }
  },

  /**
   * Get aggregate statistics for dive logs
   */
  async getStatistics(userId: string): Promise<{
    totalDives: number;
    totalBottomTime: number;
    deepestDive: number;
  }> {
    const where: Prisma.DiveLogWhereInput = { userId };
    const [count, aggregates] = await Promise.all([
      prisma.diveLog.count({ where }),
      prisma.diveLog.aggregate({
        where,
        _sum: { bottomTime: true },
        _max: { maxDepthCm: true },
      }),
    ]);

    return {
      totalDives: count,
      totalBottomTime: aggregates._sum.bottomTime ?? 0,
      deepestDive: aggregates._max.maxDepthCm ?? 0,
    };
  },
};
