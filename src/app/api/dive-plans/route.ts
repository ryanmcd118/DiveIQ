import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { generateDivePlanBriefing, generateUpdatedDivePlanBriefing } from "@/services/ai/openaiService";
import { calculateRiskLevel } from "@/features/dive-plan/services/riskCalculator";
import { divePlanRepository } from "@/services/database/repositories/divePlanRepository";
import type { PlanInput } from "@/features/dive-plan/types";
import type { UnitSystem, UnitPreferences } from "@/lib/units";
import { cmToMeters } from "@/lib/units";

/**
 * POST /api/dive-plans
 * Create a new dive plan with AI-generated structured briefing
 * Requires authentication to save the plan
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized - please sign in to save dive plans" },
      { status: 401 }
    );
  }

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

    // Get user preferences for AI formatting (default to metric if not provided)
    const unitSystem: UnitSystem = body.unitPreferences
      ? (body.unitPreferences.depth === 'm' && body.unitPreferences.temperature === 'c' && body.unitPreferences.pressure === 'bar' && body.unitPreferences.weight === 'kg' ? 'metric' : 'imperial')
      : 'metric';

    // Generate AI structured briefing with unit system
    const aiBriefing = await generateDivePlanBriefing({
      region: body.region,
      siteName: body.siteName,
      date: body.date,
      maxDepth: maxDepthMeters, // Pass meters to AI service (it expects meters)
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
      unitSystem,
    });

    // Extract a summary for legacy aiAdvice field
    const aiAdvice = aiBriefing.whatMattersMost;

    // Save to database with user ID (using canonical centimeters)
    const planInput: PlanInput = {
      date: body.date,
      region: body.region,
      siteName: body.siteName,
      maxDepthCm: body.maxDepthCm,
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
      aiAdvice,
    };

    const savedPlan = await divePlanRepository.create(planInput, session.user.id);

    return NextResponse.json(
      {
        aiAdvice,
        aiBriefing,
        plan: savedPlan,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in POST /api/dive-plans:", err);
    return NextResponse.json(
      { error: "Failed to generate plan advice." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dive-plans
 * Update an existing dive plan and regenerate AI briefing
 * Requires authentication
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      id: string;
      region: string;
      siteName: string;
      date: string;
      maxDepthCm: number; // Depth in centimeters (canonical fixed-point)
      bottomTime: number;
      experienceLevel: "Beginner" | "Intermediate" | "Advanced";
      unitPreferences?: UnitPreferences; // User's unit preferences for AI formatting
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Missing plan id for update." },
        { status: 400 }
      );
    }

    // Convert to meters for risk calculation
    const maxDepthMeters = cmToMeters(body.maxDepthCm);
    const riskLevel = calculateRiskLevel(maxDepthMeters, body.bottomTime);

    // Get user preferences for AI formatting (default to metric if not provided)
    const unitSystem: UnitSystem = body.unitPreferences
      ? (body.unitPreferences.depth === 'm' && body.unitPreferences.temperature === 'c' && body.unitPreferences.pressure === 'bar' && body.unitPreferences.weight === 'kg' ? 'metric' : 'imperial')
      : 'metric';

    // Generate updated AI structured briefing with unit system
    const aiBriefing = await generateUpdatedDivePlanBriefing({
      region: body.region,
      siteName: body.siteName,
      date: body.date,
      maxDepth: maxDepthMeters, // Pass meters to AI service
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
      unitSystem,
    });

    // Extract a summary for legacy aiAdvice field
    const aiAdvice = aiBriefing.whatMattersMost;

    // Update in database (using canonical centimeters)
    const planInput: PlanInput = {
      date: body.date,
      region: body.region,
      siteName: body.siteName,
      maxDepthCm: body.maxDepthCm,
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
      aiAdvice,
    };

    const updatedPlan = await divePlanRepository.update(body.id, planInput, session.user.id);

    return NextResponse.json(
      {
        aiAdvice,
        aiBriefing,
        plan: updatedPlan,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in PUT /api/dive-plans:", err);
    return NextResponse.json(
      { error: "Failed to update plan." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dive-plans
 * Retrieve dive plans for the authenticated user (most recent first)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const plans = await divePlanRepository.findMany({
      orderBy: "createdAt",
      take: 10,
      userId: session.user.id,
    });

    return NextResponse.json({ plans });
  } catch (err) {
    console.error("Error in GET /api/dive-plans:", err);
    return NextResponse.json(
      { error: "Failed to fetch plans." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dive-plans?id={id}
 * Delete a dive plan by ID
 * Requires authentication
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing plan id" },
        { status: 400 }
      );
    }

    await divePlanRepository.delete(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting dive plan:", err);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
