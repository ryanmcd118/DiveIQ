import { NextRequest, NextResponse } from "next/server";
import { generateDivePlanBriefing } from "@/services/ai/openaiService";
import { calculateRiskLevel } from "@/features/dive-plan/services/riskCalculator";
import type { UnitSystem, UnitPreferences } from "@/lib/units";
import { cmToMeters } from "@/lib/units";

/**
 * POST /api/dive-plans/preview
 * Generate AI structured briefing for a dive plan without saving it
 * Public endpoint - no authentication required (for guest users)
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
    };

    // Convert to meters for risk calculation
    const maxDepthMeters = cmToMeters(body.maxDepthCm);
    const riskLevel = calculateRiskLevel(maxDepthMeters, body.bottomTime);

    // Get unit system from preferences (default to metric if not provided)
    const unitSystem: UnitSystem = body.unitPreferences
      ? body.unitPreferences.depth === "m" &&
        body.unitPreferences.temperature === "c" &&
        body.unitPreferences.pressure === "bar" &&
        body.unitPreferences.weight === "kg"
        ? "metric"
        : "imperial"
      : "metric";

    // Generate AI structured briefing with unit system
    const aiBriefing = await generateDivePlanBriefing({
      region: body.region,
      siteName: body.siteName,
      date: body.date,
      maxDepth: maxDepthMeters, // Pass meters to AI service
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
      unitSystem,
    });

    // Also include legacy aiAdvice for backward compatibility
    const aiAdvice = aiBriefing.whatMattersMost;

    return NextResponse.json(
      {
        aiAdvice,
        aiBriefing,
        riskLevel,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in POST /api/dive-plans/preview:", err);
    return NextResponse.json(
      { error: "Failed to generate plan advice." },
      { status: 500 }
    );
  }
}
