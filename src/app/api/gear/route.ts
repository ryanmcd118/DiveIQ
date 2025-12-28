import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { gearRepository } from "@/services/database/repositories/gearRepository";

/**
 * GET /api/gear
 * Get all gear items for the authenticated user
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const type = searchParams.get("type") || undefined;

    const items = await gearRepository.findMany(session.user.id, {
      includeInactive,
      type,
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/gear error", err);
    return NextResponse.json(
      { error: "Failed to fetch gear items" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gear
 * Create a new gear item
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
      return NextResponse.json(
        { error: "Missing required fields: type, manufacturer, model" },
        { status: 400 }
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

    return NextResponse.json({ item });
  } catch (err) {
    console.error("POST /api/gear error", err);
    return NextResponse.json(
      { error: "Failed to create gear item" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/gear
 * Update a gear item
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const updateData: any = {};
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

    return NextResponse.json({ item });
  } catch (err) {
    console.error("PUT /api/gear error", err);
    if (err instanceof Error && err.message === "Gear item not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update gear item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gear
 * Delete a gear item
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

    await gearRepository.delete(id, session.user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/gear error", err);
    if (err instanceof Error && err.message === "Gear item not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete gear item" },
      { status: 500 }
    );
  }
}

