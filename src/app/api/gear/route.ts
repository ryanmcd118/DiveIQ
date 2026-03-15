import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { gearRepository } from "@/services/database/repositories/gearRepository";
import { NotFoundError } from "@/lib/errors";
import { apiError, apiSuccess, apiCreated, apiOk } from "@/lib/apiResponse";

/**
 * GET /api/gear
 * Get all gear items for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const type = searchParams.get("type") || undefined;

    const items = await gearRepository.findMany(session.user.id, {
      includeInactive,
      type,
    });

    return apiSuccess({ items });
  } catch (err) {
    console.error("GET /api/gear error", err);
    return apiError("Failed to fetch gear items", 500);
  }
}

/**
 * POST /api/gear
 * Create a new gear item
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const {
      type,
      manufacturer,
      model,
      nickname,
      purchaseDate,
      notes,
      isActive,
      lastServicedAt,
      serviceIntervalMonths,
    } = body;

    if (!type || !manufacturer || !model) {
      return apiError(
        "Missing required fields: type, manufacturer, model",
        400
      );
    }

    const item = await gearRepository.create(
      {
        userId: session.user.id,
        type,
        manufacturer,
        model,
        nickname: nickname || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        notes: notes || null,
        isActive: isActive !== false,
        lastServicedAt: lastServicedAt ? new Date(lastServicedAt) : null,
        serviceIntervalMonths:
          serviceIntervalMonths !== null && serviceIntervalMonths !== undefined
            ? Number(serviceIntervalMonths)
            : null,
      },
      session.user.id
    );

    return apiCreated({ item });
  } catch (err) {
    console.error("POST /api/gear error", err);
    return apiError("Failed to create gear item", 500);
  }
}

/**
 * PUT /api/gear
 * Update a gear item
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const {
      id,
      type,
      manufacturer,
      model,
      nickname,
      purchaseDate,
      notes,
      isActive,
      lastServicedAt,
      serviceIntervalMonths,
    } = body;

    if (!id) {
      return apiError("Missing id", 400);
    }

    const updateData: {
      type?: string;
      manufacturer?: string;
      model?: string;
      nickname?: string | null;
      purchaseDate?: Date | null;
      notes?: string | null;
      isActive?: boolean;
      lastServicedAt?: Date | null;
      serviceIntervalMonths?: number | null;
    } = {};
    if (type !== undefined) updateData.type = type;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
    if (model !== undefined) updateData.model = model;
    if (nickname !== undefined) updateData.nickname = nickname || null;
    if (purchaseDate !== undefined)
      updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (lastServicedAt !== undefined)
      updateData.lastServicedAt = lastServicedAt
        ? new Date(lastServicedAt)
        : null;
    if (serviceIntervalMonths !== undefined)
      updateData.serviceIntervalMonths =
        serviceIntervalMonths !== null && serviceIntervalMonths !== undefined
          ? Number(serviceIntervalMonths)
          : null;

    const item = await gearRepository.update(id, updateData, session.user.id);

    return apiSuccess({ item });
  } catch (err) {
    console.error("PUT /api/gear error", err);
    if (err instanceof NotFoundError) {
      return apiError(err.message, 404);
    }
    return apiError("Failed to update gear item", 500);
  }
}

/**
 * DELETE /api/gear
 * Delete a gear item
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("Missing id", 400);
    }

    await gearRepository.delete(id, session.user.id);

    return apiOk();
  } catch (err) {
    console.error("DELETE /api/gear error", err);
    if (err instanceof NotFoundError) {
      return apiError(err.message, 404);
    }
    return apiError("Failed to delete gear item", 500);
  }
}
