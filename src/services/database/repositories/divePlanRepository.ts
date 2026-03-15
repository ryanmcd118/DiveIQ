import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type {
  PlanInput,
  PastPlan,
  ExperienceLevel,
  AIBriefing,
} from "@/features/dive-plan/types";
import { Prisma } from "@prisma/client";

/**
 * Data access layer for DivePlan operations
 * Provides a clean interface to database operations
 */
export const divePlanRepository = {
  /**
   * Create a new dive plan
   */
  async create(data: PlanInput, userId: string): Promise<PastPlan> {
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
        aiBriefing: data.aiBriefing ?? Prisma.JsonNull,
        userId,
      },
    });
    return {
      ...result,
      experienceLevel: result.experienceLevel as ExperienceLevel,
      aiBriefing: (result.aiBriefing as AIBriefing | null) ?? null,
    };
  },

  /**
   * Find a single dive plan by ID
   */
  async findById(id: string, userId: string): Promise<PastPlan | null> {
    const plan = await prisma.divePlan.findFirst({
      where: { id, userId },
    });
    if (!plan) return null;
    return {
      ...plan,
      experienceLevel: plan.experienceLevel as ExperienceLevel,
      aiBriefing: (plan.aiBriefing as AIBriefing | null) ?? null,
    };
  },

  /**
   * Find all dive plans, ordered by creation date (newest first)
   */
  async findMany(options: {
    orderBy?: "date" | "createdAt";
    take?: number;
    userId: string;
  }): Promise<PastPlan[]> {
    const plans = await prisma.divePlan.findMany({
      where: { userId: options.userId },
      orderBy: { [options.orderBy ?? "createdAt"]: "desc" },
      take: options.take,
    });
    return plans.map((plan) => ({
      ...plan,
      experienceLevel: plan.experienceLevel as ExperienceLevel,
      aiBriefing: (plan.aiBriefing as AIBriefing | null) ?? null,
    }));
  },

  /**
   * Update an existing dive plan
   */
  async update(id: string, data: PlanInput, userId: string): Promise<PastPlan> {
    const existing = await prisma.divePlan.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError("Dive plan not found or unauthorized");
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
        aiBriefing: data.aiBriefing ?? Prisma.JsonNull,
      },
    });
    return {
      ...result,
      experienceLevel: result.experienceLevel as ExperienceLevel,
      aiBriefing: (result.aiBriefing as AIBriefing | null) ?? null,
    };
  },

  /**
   * Delete a dive plan
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.divePlan.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError("Dive plan not found or unauthorized");
    }
    await prisma.divePlan.delete({
      where: { id },
    });
  },

  /**
   * Get count of all dive plans
   */
  async count(userId: string): Promise<number> {
    return prisma.divePlan.count({ where: { userId } });
  },
};
