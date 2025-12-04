import { prisma } from "@/lib/prisma";
import type { DiveLogInput, DiveLogEntry } from "@/features/dive-log/types";

/**
 * Data access layer for DiveLog operations
 * Provides a clean interface to database operations
 */
export const diveLogRepository = {
  /**
   * Create a new dive log entry
   */
  async create(data: DiveLogInput): Promise<DiveLogEntry> {
    return prisma.diveLog.create({
      data: {
        date: data.date,
        region: data.region,
        siteName: data.siteName,
        maxDepth: data.maxDepth,
        bottomTime: data.bottomTime,
        waterTemp: data.waterTemp ?? null,
        visibility: data.visibility ?? null,
        buddyName: data.buddyName ?? null,
        notes: data.notes ?? null,
      },
    });
  },

  /**
   * Find a single dive log entry by ID
   */
  async findById(id: string): Promise<DiveLogEntry | null> {
    return prisma.diveLog.findUnique({
      where: { id },
    });
  },

  /**
   * Find all dive log entries, ordered by date (newest first)
   */
  async findMany(options?: {
    orderBy?: "date" | "createdAt";
    take?: number;
  }): Promise<DiveLogEntry[]> {
    return prisma.diveLog.findMany({
      orderBy: { [options?.orderBy ?? "date"]: "desc" },
      take: options?.take,
    });
  },

  /**
   * Update an existing dive log entry
   */
  async update(id: string, data: DiveLogInput): Promise<DiveLogEntry> {
    return prisma.diveLog.update({
      where: { id },
      data: {
        date: data.date,
        region: data.region,
        siteName: data.siteName,
        maxDepth: data.maxDepth,
        bottomTime: data.bottomTime,
        waterTemp: data.waterTemp ?? null,
        visibility: data.visibility ?? null,
        buddyName: data.buddyName ?? null,
        notes: data.notes ?? null,
      },
    });
  },

  /**
   * Delete a dive log entry
   */
  async delete(id: string): Promise<void> {
    await prisma.diveLog.delete({
      where: { id },
    });
  },

  /**
   * Get count of all dive log entries
   */
  async count(): Promise<number> {
    return prisma.diveLog.count();
  },

  /**
   * Get aggregate statistics for dive logs
   */
  async getStatistics(): Promise<{
    totalDives: number;
    totalBottomTime: number;
    deepestDive: number;
  }> {
    const [count, aggregates] = await Promise.all([
      prisma.diveLog.count(),
      prisma.diveLog.aggregate({
        _sum: { bottomTime: true },
        _max: { maxDepth: true },
      }),
    ]);

    return {
      totalDives: count,
      totalBottomTime: aggregates._sum.bottomTime ?? 0,
      deepestDive: aggregates._max.maxDepth ?? 0,
    };
  },
};

