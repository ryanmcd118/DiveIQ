import { NextRequest, NextResponse } from "next/server";
import { generateDivePlanAdvice, generateUpdatedDivePlanAdvice } from "@/services/ai/openaiService";
import { calculateRiskLevel } from "@/features/dive-plan/services/riskCalculator";
import { divePlanRepository } from "@/services/database/repositories/divePlanRepository";
import type { PlanInput } from "@/features/dive-plan/types";

/**
 * POST /api/dive-plans
 * Create a new dive plan with AI-generated safety advice
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

    // Save to database
    const planInput: PlanInput = {
      date: body.date,
      region: body.region,
      siteName: body.siteName,
      maxDepth: body.maxDepth,
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
      aiAdvice,
    };

    const savedPlan = await divePlanRepository.create(planInput);

    return NextResponse.json(
      {
        aiAdvice,
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
 * Update an existing dive plan and regenerate AI advice
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id: string;
      region: string;
      siteName: string;
      date: string;
      maxDepth: number;
      bottomTime: number;
      experienceLevel: "Beginner" | "Intermediate" | "Advanced";
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Missing plan id for update." },
        { status: 400 }
      );
    }

    // Calculate risk level
    const riskLevel = calculateRiskLevel(body.maxDepth, body.bottomTime);

    // Generate updated AI advice
    const aiAdvice = await generateUpdatedDivePlanAdvice({
      region: body.region,
      siteName: body.siteName,
      date: body.date,
      maxDepth: body.maxDepth,
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
    });

    // Update in database
    const planInput: PlanInput = {
      date: body.date,
      region: body.region,
      siteName: body.siteName,
      maxDepth: body.maxDepth,
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
      aiAdvice,
    };

    const updatedPlan = await divePlanRepository.update(body.id, planInput);

    return NextResponse.json(
      {
        aiAdvice,
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
 * Retrieve all dive plans (most recent first)
 */
export async function GET() {
  try {
    const plans = await divePlanRepository.findMany({
      orderBy: "createdAt",
      take: 10,
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
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing plan id" },
        { status: 400 }
      );
    }

    await divePlanRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting dive plan:", err);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
