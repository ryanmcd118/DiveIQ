import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { gearKitRepository } from "@/services/database/repositories/gearRepository";

/**
 * GET /api/gear-kits
 * Get all kits for the authenticated user
 */
export async function GET(_req: NextRequest) {
  void _req;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const kits = await gearKitRepository.findMany(session.user.id);
    return NextResponse.json({ kits });
  } catch (err) {
    console.error("GET /api/gear-kits error", err);
    return NextResponse.json(
      { error: "Failed to fetch gear kits" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gear-kits
 * Create a new kit or update kit items
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, id, name, isDefault, gearItemIds } = body;

    // Create new kit
    if (action === "create") {
      if (!name) {
        return NextResponse.json(
          { error: "Missing required field: name" },
          { status: 400 }
        );
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

      return NextResponse.json({ kit: kitWithItems });
    }

    // Update kit items
    if (action === "updateItems") {
      if (!id || !Array.isArray(gearItemIds)) {
        return NextResponse.json(
          { error: "Missing id or gearItemIds" },
          { status: 400 }
        );
      }

      await gearKitRepository.setItems(id, gearItemIds, session.user.id);

      const kit = await gearKitRepository.findById(id, session.user.id);
      return NextResponse.json({ kit });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/gear-kits error", err);
    return NextResponse.json(
      { error: "Failed to process kit request" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/gear-kits
 * Update a kit (name, default status)
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
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

    return NextResponse.json({ kit: kitWithItems });
  } catch (err) {
    console.error("PUT /api/gear-kits error", err);
    if (err instanceof Error && err.message === "Kit not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update kit" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gear-kits
 * Delete a kit
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await gearKitRepository.delete(id, session.user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/gear-kits error", err);
    if (err instanceof Error && err.message === "Kit not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete kit" },
      { status: 500 }
    );
  }
}
