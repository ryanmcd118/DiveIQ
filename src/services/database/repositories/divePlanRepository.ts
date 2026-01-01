import { prisma } from "@/lib/prisma";
import type {
  PlanInput,
  PastPlan,
  ExperienceLevel,
} from "@/features/dive-plan/types";
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
    const result = await prisma.divePlan.create({
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
    return {
      ...result,
      experienceLevel: result.experienceLevel as ExperienceLevel,
    };
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
    if (!plan) return null;
    return {
      ...plan,
      experienceLevel: plan.experienceLevel as ExperienceLevel,
    };
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
    const plans = await prisma.divePlan.findMany({
      where,
      orderBy: { [options?.orderBy ?? "createdAt"]: "desc" },
      take: options?.take,
    });
    return plans.map((plan) => ({
      ...plan,
      experienceLevel: plan.experienceLevel as ExperienceLevel,
    }));
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
    const result = await prisma.divePlan.update({
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
    return {
      ...result,
      experienceLevel: result.experienceLevel as ExperienceLevel,
    };
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
