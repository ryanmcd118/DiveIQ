import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import {
  generateDivePlanBriefing,
  generateUpdatedDivePlanBriefing,
  type DivePlanAnalysisRequest,
} from "@/services/ai/openaiService";
import { calculateRiskLevel } from "@/features/dive-plan/services/riskCalculator";
import { divePlanRepository } from "@/services/database/repositories/divePlanRepository";
import {
  divePlanInputSchema,
  type AIBriefing,
  type PlanInput,
} from "@/features/dive-plan/types";
import type { UnitPreferences } from "@/lib/units";
import { cmToMeters, preferencesToUnitSystem } from "@/lib/units";
import { apiError, apiOk, apiCreated, apiSuccess } from "@/lib/apiResponse";
import { NotFoundError } from "@/lib/errors";

/**
 * POST /api/dive-plans
 * Create a new dive plan with AI-generated structured briefing
 * Requires authentication to save the plan
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized - please sign in to save dive plans", 401);
    }
    const body = (await req.json()) as {
      region: string;
      siteName: string;
      date: string;
      maxDepthCm: number;
      bottomTime: number;
      experienceLevel: "Beginner" | "Intermediate" | "Advanced";
      unitPreferences?: UnitPreferences;
      cachedBriefing?: AIBriefing;
      profile?: DivePlanAnalysisRequest["profile"];
    };

    const parsed = divePlanInputSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400);
    }

    // Convert to meters for risk calculation
    const maxDepthMeters = cmToMeters(body.maxDepthCm);
    const riskLevel = calculateRiskLevel({
      maxDepthMeters,
      bottomTime: body.bottomTime,
      region: body.region,
      siteName: body.siteName,
      certifications: body.profile?.certifications?.map((c) => c.name),
      totalDives: body.profile?.totalDives,
      lastDiveDate: body.profile?.lastDiveDate,
      planDate: body.date,
    });

    const unitSystem = preferencesToUnitSystem(body.unitPreferences);

    // TRUST DECISION: cachedBriefing is accepted from the client to avoid
    // a double OpenAI call when a guest user saves after previewing.
    // The client is trusted to pass back the briefing it received from
    // /api/dive-plans/preview. Server-side re-validation is not performed.
    const aiBriefing: AIBriefing =
      body.cachedBriefing?.keyConsiderations && body.cachedBriefing?.conditions
        ? body.cachedBriefing
        : await generateDivePlanBriefing({
            region: body.region,
            siteName: body.siteName,
            date: body.date,
            maxDepth: maxDepthMeters, // Pass meters to AI service (it expects meters)
            bottomTime: body.bottomTime,
            experienceLevel: body.experienceLevel,
            riskLevel,
            unitSystem,
            profile: body.profile,
          });

    // Extract a summary for legacy aiAdvice field
    const aiAdvice = aiBriefing.keyConsiderations[0] ?? "";

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
      aiBriefing,
    };

    const savedPlan = await divePlanRepository.create(
      planInput,
      session.user.id
    );

    return apiCreated({
      aiAdvice,
      aiBriefing,
      plan: savedPlan,
    });
  } catch (err) {
    console.error("POST /api/dive-plans error", err);
    return apiError("Failed to generate plan advice.", 500);
  }
}

/**
 * PUT /api/dive-plans
 * Update an existing dive plan and regenerate AI briefing
 * Requires authentication
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = (await req.json()) as {
      id: string;
      region: string;
      siteName: string;
      date: string;
      maxDepthCm: number;
      bottomTime: number;
      experienceLevel: "Beginner" | "Intermediate" | "Advanced";
      unitPreferences?: UnitPreferences;
      cachedBriefing?: AIBriefing;
      profile?: DivePlanAnalysisRequest["profile"];
    };

    if (!body.id) {
      return apiError("Missing plan id for update.", 400);
    }

    const parsed = divePlanInputSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400);
    }

    // Convert to meters for risk calculation
    const maxDepthMeters = cmToMeters(body.maxDepthCm);
    const riskLevel = calculateRiskLevel({
      maxDepthMeters,
      bottomTime: body.bottomTime,
      region: body.region,
      siteName: body.siteName,
      certifications: body.profile?.certifications?.map((c) => c.name),
      totalDives: body.profile?.totalDives,
      lastDiveDate: body.profile?.lastDiveDate,
      planDate: body.date,
    });

    const unitSystem = preferencesToUnitSystem(body.unitPreferences);

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
      profile: body.profile,
    });

    // Extract a summary for legacy aiAdvice field
    const aiAdvice = aiBriefing.keyConsiderations[0] ?? "";

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
      aiBriefing,
    };

    const updatedPlan = await divePlanRepository.update(
      body.id,
      planInput,
      session.user.id
    );

    return apiSuccess({
      aiAdvice,
      aiBriefing,
      plan: updatedPlan,
    });
  } catch (err) {
    console.error("PUT /api/dive-plans error", err);
    if (err instanceof NotFoundError) {
      return apiError(err.message, 404);
    }
    return apiError("Failed to update plan.", 500);
  }
}

/**
 * GET /api/dive-plans
 * Retrieve dive plans for the authenticated user (most recent first)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const plans = await divePlanRepository.findMany({
      orderBy: "createdAt",
      take: 100,
      userId: session.user.id,
    });

    return apiSuccess({ plans });
  } catch (err) {
    console.error("GET /api/dive-plans error", err);
    return apiError("Failed to fetch plans.", 500);
  }
}

/**
 * DELETE /api/dive-plans?id={id}
 * Delete a dive plan by ID
 * Requires authentication
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return apiError("Missing plan id", 400);
    }

    await divePlanRepository.delete(id, session.user.id);

    return apiOk();
  } catch (err) {
    console.error("DELETE /api/dive-plans error", err);
    if (err instanceof NotFoundError) {
      return apiError(err.message, 404);
    }
    return apiError("Failed to delete plan", 500);
  }
}
