import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { gearKitRepository } from "@/services/database/repositories/gearRepository";
import { NotFoundError } from "@/lib/errors";
import { apiError, apiSuccess, apiCreated, apiOk } from "@/lib/apiResponse";

/**
 * GET /api/gear-kits
 * Get all kits for the authenticated user
 */
export async function GET(_req: NextRequest) {
  void _req;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const kits = await gearKitRepository.findMany(session.user.id);
    return apiSuccess({ kits });
  } catch (err) {
    console.error("GET /api/gear-kits error", err);
    return apiError("Failed to fetch gear kits", 500);
  }
}

/**
 * POST /api/gear-kits
 * Create a new kit or update kit items
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const { action, id, name, isDefault, gearItemIds } = body;

    // Create new kit
    if (action === "create") {
      if (!name) {
        return apiError("Missing required field: name", 400);
      }

      const kit = await gearKitRepository.create(
        {
          userId: session.user.id,
          name,
          isDefault: isDefault === true,
        },
        session.user.id
      );

      // Add items if provided
      if (gearItemIds && Array.isArray(gearItemIds) && gearItemIds.length > 0) {
        await gearKitRepository.setItems(kit.id, gearItemIds, session.user.id);
      }

      const kitWithItems = await gearKitRepository.findById(
        kit.id,
        session.user.id
      );

      return apiCreated({ kit: kitWithItems });
    }

    // Update kit items
    if (action === "updateItems") {
      if (!id || !Array.isArray(gearItemIds)) {
        return apiError("Missing id or gearItemIds", 400);
      }

      await gearKitRepository.setItems(id, gearItemIds, session.user.id);

      const kit = await gearKitRepository.findById(id, session.user.id);
      return apiSuccess({ kit });
    }

    return apiError("Invalid action", 400);
  } catch (err) {
    console.error("POST /api/gear-kits error", err);
    return apiError("Failed to process kit request", 500);
  }
}

/**
 * PUT /api/gear-kits
 * Update a kit (name, default status)
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const { id, name, isDefault } = body;

    if (!id) {
      return apiError("Missing id", 400);
    }

    const updateData: {
      name?: string;
      isDefault?: boolean;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const kit = await gearKitRepository.update(id, updateData, session.user.id);

    const kitWithItems = await gearKitRepository.findById(
      kit.id,
      session.user.id
    );

    return apiSuccess({ kit: kitWithItems });
  } catch (err) {
    console.error("PUT /api/gear-kits error", err);
    if (err instanceof NotFoundError) {
      return apiError(err.message, 404);
    }
    return apiError("Failed to update kit", 500);
  }
}

/**
 * DELETE /api/gear-kits
 * Delete a kit
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

    await gearKitRepository.delete(id, session.user.id);

    return apiOk();
  } catch (err) {
    console.error("DELETE /api/gear-kits error", err);
    if (err instanceof NotFoundError) {
      return apiError(err.message, 404);
    }
    return apiError("Failed to delete kit", 500);
  }
}
