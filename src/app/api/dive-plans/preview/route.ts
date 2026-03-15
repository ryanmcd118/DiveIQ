import { NextRequest } from "next/server";
import { apiError } from "@/lib/apiResponse";
import {
  generateDivePlanBriefingStream,
  type DivePlanAnalysisRequest,
} from "@/services/ai/openaiService";
import { calculateRiskLevel } from "@/features/dive-plan/services/riskCalculator";
import type { UnitPreferences } from "@/lib/units";
import { cmToMeters, preferencesToUnitSystem } from "@/lib/units";

/**
 * POST /api/dive-plans/preview
 * Stream AI structured briefing for a dive plan without saving it.
 * Public endpoint - no authentication required (for guest users).
 * riskLevel is returned in the X-Risk-Level response header.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      region: string;
      siteName: string;
      date: string;
      maxDepthCm: number; // Depth in centimeters (canonical fixed-point)
      bottomTime: number;
      experienceLevel: "Beginner" | "Intermediate" | "Advanced";
      unitPreferences?: UnitPreferences; // User's unit preferences for AI formatting
      profile?: DivePlanAnalysisRequest["profile"];
      manualExperience?: DivePlanAnalysisRequest["manualExperience"];
    };

    // Convert to meters for risk calculation
    const maxDepthMeters = cmToMeters(body.maxDepthCm);
    const riskLevel = calculateRiskLevel({
      maxDepthMeters,
      bottomTime: body.bottomTime,
      region: body.region,
      siteName: body.siteName,
      certifications: body.profile?.certifications?.map((c) => c.name),
      highestCert: body.manualExperience?.highestCert,
      totalDives: body.profile?.totalDives,
      diveCountRange: body.manualExperience?.diveCountRange,
      lastDiveDate: body.profile?.lastDiveDate,
      lastDiveRecency: body.manualExperience?.lastDiveRecency,
      planDate: body.date,
    });

    const unitSystem = preferencesToUnitSystem(body.unitPreferences);

    const stream = await generateDivePlanBriefingStream({
      region: body.region,
      siteName: body.siteName,
      date: body.date,
      maxDepth: maxDepthMeters,
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
      unitSystem,
      profile: body.profile,
      manualExperience: body.manualExperience,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Risk-Level": riskLevel,
      },
    });
  } catch (err) {
    console.error("POST /api/dive-plans/preview error", err);
    return apiError("Failed to generate plan advice.", 500);
  }
}
