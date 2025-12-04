import { prisma } from "@/lib/prisma";
import type { PlanInput, PastPlan } from "@/features/dive-plan/types";

/**
 * Data access layer for DivePlan operations
 * Provides a clean interface to database operations
 */
export const divePlanRepository = {
  /**
   * Create a new dive plan
   */
  async create(data: PlanInput): Promise<PastPlan> {
    return prisma.divePlan.create({
      data: {
        date: data.date,
        region: data.region,
        siteName: data.siteName,
        maxDepth: data.maxDepth,
        bottomTime: data.bottomTime,
        experienceLevel: data.experienceLevel,
        riskLevel: data.riskLevel,
        aiAdvice: data.aiAdvice ?? null,
      },
    });
  },

  /**
   * Find a single dive plan by ID
   */
  async findById(id: string): Promise<PastPlan | null> {
    return prisma.divePlan.findUnique({
      where: { id },
    });
  },

  /**
   * Find all dive plans, ordered by creation date (newest first)
   */
  async findMany(options?: {
    orderBy?: "date" | "createdAt";
    take?: number;
  }): Promise<PastPlan[]> {
    return prisma.divePlan.findMany({
      orderBy: { [options?.orderBy ?? "createdAt"]: "desc" },
      take: options?.take,
    });
  },

  /**
   * Update an existing dive plan
   */
  async update(id: string, data: PlanInput): Promise<PastPlan> {
    return prisma.divePlan.update({
      where: { id },
      data: {
        date: data.date,
        region: data.region,
        siteName: data.siteName,
        maxDepth: data.maxDepth,
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
  async delete(id: string): Promise<void> {
    await prisma.divePlan.delete({
      where: { id },
    });
  },

  /**
   * Get count of all dive plans
   */
  async count(): Promise<number> {
    return prisma.divePlan.count();
  },
};

