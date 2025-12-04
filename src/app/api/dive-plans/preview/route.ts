import { NextRequest, NextResponse } from "next/server";
import { generateDivePlanAdvice } from "@/services/ai/openaiService";
import { calculateRiskLevel } from "@/features/dive-plan/services/riskCalculator";

/**
 * POST /api/dive-plans/preview
 * Generate AI advice for a dive plan without saving it
 * Public endpoint - no authentication required (for guest users)
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      region: string;
      siteName: string;
      date: string;
      maxDepth: number;
      bottomTime: number;
      experienceLevel: "Beginner" | "Intermediate" | "Advanced";
    };

    // Calculate risk level
    const riskLevel = calculateRiskLevel(body.maxDepth, body.bottomTime);

    // Generate AI advice
    const aiAdvice = await generateDivePlanAdvice({
      ...body,
      riskLevel,
    });

    return NextResponse.json(
      {
        aiAdvice,
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

