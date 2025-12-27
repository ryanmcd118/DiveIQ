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
  aiBriefing?: AIBriefing | null;
};

export type PastPlan = PlanData & {
  id: string;
  riskLevel: RiskLevel | string;
  aiAdvice?: string | null;
  aiBriefing?: AIBriefing | null;
  createdAt?: Date;
};

// API Response Types
export type PlanApiResponse = {
  aiAdvice: string;
  aiBriefing: AIBriefing;
  plan: PastPlan;
};

// =========================================
// AI BRIEFING STRUCTURED RESPONSE TYPES
// =========================================

export type SourceTag = "Forecast" | "Seasonal" | "Inferred";
export type ConfidenceLevel = "High" | "Medium" | "Low";

export type QuickLookItem = {
  value: string; // Original display string from AI (for fallback/narrative)
  reason?: string;
  sourceTag?: SourceTag;
  // Canonical numeric values (in metric) for unit-aware formatting
  numericValue?: {
    min: number;
    max: number;
  };
};

export type QuickLook = {
  difficulty: QuickLookItem;
  suggestedExperience: QuickLookItem;
  waterTemp: QuickLookItem;
  visibility: QuickLookItem;
  seaStateWind: QuickLookItem;
  confidence: {
    level: ConfidenceLevel;
    reason: string;
  };
};

export type BriefingSection = {
  title: string;
  sourceTags?: SourceTag[];
  bullets?: string[];
  paragraphs?: string[];
};

export type AIBriefing = {
  conditionsSnapshot: string;
  quickLook: QuickLook;
  whatMattersMost: string;
  highlights: string[];
  sections: BriefingSection[];
};

// Preview result type for logged-out users
export type PreviewResult = {
  aiBriefing: AIBriefing;
  riskLevel: RiskLevel;
};
