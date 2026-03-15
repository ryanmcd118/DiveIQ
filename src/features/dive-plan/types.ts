// Dive Plan Types

import { z } from "zod";
import type { ExperienceLevel } from "@/types";

export type { ExperienceLevel } from "@/types";
export type RiskLevel = "Low" | "Moderate" | "High" | "Extreme";

export type PlanData = {
  region: string;
  siteName: string;
  date: string;
  maxDepth: number; // UI value (in user's preferred units, not canonical)
  bottomTime: number;
  experienceLevel: ExperienceLevel;
};

export type PlanInput = {
  date: string;
  region: string;
  siteName: string;
  maxDepthCm: number; // Canonical fixed-point (centimeters)
  bottomTime: number;
  experienceLevel: ExperienceLevel;
  riskLevel: RiskLevel;
  aiAdvice?: string | null;
  aiBriefing?: AIBriefing | null;
};

export type PastPlan = {
  id: string;
  date: string;
  region: string;
  siteName: string;
  maxDepthCm: number; // Canonical fixed-point (centimeters)
  bottomTime: number;
  experienceLevel: ExperienceLevel;
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

export type ConditionBadge = "seasonal" | "forecast" | "inferred" | null;

export type AIBriefing = {
  keyConsiderations: string[]; // max 3
  conditions: {
    waterTemp: { value: string; badge: ConditionBadge };
    visibility: { value: string; badge: ConditionBadge };
    seaState: { value: string; badge: ConditionBadge };
  };
  siteConditions: string[];
  hazards: string[];
  experienceNotes: string[];
  gearNotes: string[];
};

// Preview result type for logged-out users
export type PreviewResult = {
  aiBriefing: AIBriefing;
  riskLevel: RiskLevel;
};

// Profile context fetched from /api/dive-plans/profile-context
export type ProfileContext = {
  totalDives: number;
  lastDiveDate: string | null;
  experienceLevel: string | null;
  yearsDiving: number | null;
  homeDiveRegion: string | null;
  primaryDiveTypes: string[];
  certifications: {
    agency: string;
    name: string;
    slug: string;
    levelRank: number;
    category: string;
  }[];
  gear: {
    id: string;
    type: string;
    manufacturer: string | null;
    model: string | null;
    nickname: string | null;
  }[];
};

// Zod validation schema for dive plan API input
export const divePlanInputSchema = z.object({
  region: z.string().min(1),
  siteName: z.string().min(1),
  date: z.string().min(1),
  maxDepthCm: z.number().int().positive(),
  bottomTime: z.number().int().positive(),
  experienceLevel: z.string().min(1),
});
