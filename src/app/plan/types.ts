export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";

export type PlanData = {
  region: string;
  siteName: string;
  date: string;
  maxDepth: number;
  bottomTime: number;
  experienceLevel: ExperienceLevel;
};

export type RiskLevel = "Low" | "Moderate" | "High";

export type PastPlan = PlanData & {
  id: string;
  riskLevel: RiskLevel | string;
  aiAdvice?: string | null;
};
