// Dive Plan Types

export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";
export type RiskLevel = "Low" | "Moderate" | "High";

export type PlanData = {
  region: string;
  siteName: string;
  date: string;
  maxDepth: number;
  bottomTime: number;
  experienceLevel: ExperienceLevel;
};

export type PlanInput = PlanData & {
  riskLevel: RiskLevel;
  aiAdvice?: string | null;
};

export type PastPlan = PlanData & {
  id: string;
  riskLevel: RiskLevel | string;
  aiAdvice?: string | null;
  createdAt?: Date;
};

// API Response Types
export type PlanApiResponse = {
  aiAdvice: string;
  plan: PastPlan;
};
