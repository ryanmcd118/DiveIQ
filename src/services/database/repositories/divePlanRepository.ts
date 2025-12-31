import { prisma } from "@/lib/prisma";
import type { PlanInput, PastPlan } from "@/features/dive-plan/types";
import type { Prisma } from "@prisma/client";

/**
 * Data access layer for DivePlan operations
 * Provides a clean interface to database operations
 */
export const divePlanRepository = {
  /**
   * Create a new dive plan
   */
  async create(data: PlanInput, userId?: string): Promise<PastPlan> {
    return prisma.divePlan.create({
      data: {
        date: data.date,
        region: data.region,
        siteName: data.siteName,
        maxDepthCm: data.maxDepthCm,
        bottomTime: data.bottomTime,
        experienceLevel: data.experienceLevel,
        riskLevel: data.riskLevel,
        aiAdvice: data.aiAdvice ?? null,
        userId: userId ?? null,
      },
    });
  },

  /**
   * Find a single dive plan by ID
   */
  async findById(id: string, userId?: string): Promise<PastPlan | null> {
    const plan = await prisma.divePlan.findUnique({
      where: { id },
    });
    if (userId && plan && plan.userId !== userId) {
      return null;
    }
    return plan;
  },

  /**
   * Find all dive plans, ordered by creation date (newest first)
   */
  async findMany(options?: {
    orderBy?: "date" | "createdAt";
    take?: number;
    userId?: string;
  }): Promise<PastPlan[]> {
    const where: Prisma.DivePlanWhereInput = {};
    if (options?.userId) {
      where.userId = options.userId;
    }
    return prisma.divePlan.findMany({
      where,
      orderBy: { [options?.orderBy ?? "createdAt"]: "desc" },
      take: options?.take,
    });
  },

  /**
   * Update an existing dive plan
   */
  async update(
    id: string,
    data: PlanInput,
    userId?: string
  ): Promise<PastPlan> {
    if (userId) {
      const existing = await prisma.divePlan.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        throw new Error("Dive plan not found or unauthorized");
      }
    }
    return prisma.divePlan.update({
      where: { id },
      data: {
        date: data.date,
        region: data.region,
        siteName: data.siteName,
        maxDepthCm: data.maxDepthCm,
        bottomTime: data.bottomTime,
        experienceLevel: data.experienceLevel,
        riskLevel: data.riskLevel,
        aiAdvice: data.aiAdvice ?? null,
      },
    });
  },

  /**
   * Delete a dive plan
   */
  async delete(id: string, userId?: string): Promise<void> {
    if (userId) {
      const existing = await prisma.divePlan.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        throw new Error("Dive plan not found or unauthorized");
      }
    }
    await prisma.divePlan.delete({
      where: { id },
    });
  },

  /**
   * Get count of all dive plans
   */
  async count(userId?: string): Promise<number> {
    const where: Prisma.DivePlanWhereInput = {};
    if (userId) {
      where.userId = userId;
    }
    return prisma.divePlan.count({ where });
  },
};
