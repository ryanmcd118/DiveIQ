import type { DivePlan } from "@prisma/client";

export type PlanRecord = DivePlan;
export type PlanInput = Omit<PlanRecord, "id" | "createdAt">;
