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
  async create(
    data: DiveLogInput,
    userId?: string
  ): Promise<DiveLogEntry> {
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
        userId: userId ?? null,
      },
    });
  },

  /**
   * Find a single dive log entry by ID
   */
  async findById(id: string, userId?: string): Promise<DiveLogEntry | null> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }
    return prisma.diveLog.findUnique({
      where,
    });
  },

  /**
   * Find all dive log entries, ordered by date (newest first)
   */
  async findMany(options?: {
    orderBy?: "date" | "createdAt";
    take?: number;
    userId?: string;
  }): Promise<DiveLogEntry[]> {
    const where: any = {};
    if (options?.userId) {
      where.userId = options.userId;
    }
    return prisma.diveLog.findMany({
      where,
      orderBy: { [options?.orderBy ?? "date"]: "desc" },
      take: options?.take,
    });
  },

  /**
   * Update an existing dive log entry
   */
  async update(
    id: string,
    data: DiveLogInput,
    userId?: string
  ): Promise<DiveLogEntry> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }
    return prisma.diveLog.update({
      where,
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
  async delete(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }
    await prisma.diveLog.delete({
      where,
    });
  },

  /**
   * Get count of all dive log entries
   */
  async count(userId?: string): Promise<number> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    return prisma.diveLog.count({ where });
  },

  /**
   * Get aggregate statistics for dive logs
   */
  async getStatistics(userId?: string): Promise<{
    totalDives: number;
    totalBottomTime: number;
    deepestDive: number;
  }> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    const [count, aggregates] = await Promise.all([
      prisma.diveLog.count({ where }),
      prisma.diveLog.aggregate({
        where,
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

