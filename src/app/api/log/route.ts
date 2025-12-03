import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapPayloadToData(payload: any) {
  return {
    date: payload.date,
    region: payload.region,
    siteName: payload.siteName,
    maxDepth: payload.maxDepth,
    bottomTime: payload.bottomTime,
    waterTemp: payload.waterTemp ?? null,
    visibility: payload.visibility ?? null,
    buddyName: payload.buddyName ?? null,
    notes: payload.notes ?? null,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const entry = await prisma.diveLog.findUnique({ where: { id } });
      return NextResponse.json({ entry });
    }

    const entries = await prisma.diveLog.findMany({
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("GET /api/log error", err);
    return NextResponse.json(
      { error: "Failed to fetch dive logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, payload } = body as {
      action: "create" | "update" | "delete";
      id?: string;
      payload?: any;
    };

    // CREATE
    if (action === "create") {
      if (!payload) {
        return NextResponse.json(
          { error: "Missing payload for create" },
          { status: 400 }
        );
      }

      const created = await prisma.diveLog.create({
        data: mapPayloadToData(payload),
      });

      return NextResponse.json({ entry: created });
    }

    // UPDATE
    if (action === "update") {
      if (!id || !payload) {
        return NextResponse.json(
          { error: "Missing id or payload for update" },
          { status: 400 }
        );
      }

      const updated = await prisma.diveLog.update({
        where: { id },
        data: mapPayloadToData(payload),
      });

      return NextResponse.json({ entry: updated });
    }

    // DELETE
    if (action === "delete") {
      if (!id) {
        return NextResponse.json(
          { error: "Missing id for delete" },
          { status: 400 }
        );
      }

      await prisma.diveLog.delete({
        where: { id },
      });

      return NextResponse.json({ ok: true });
    }

    // Unknown action
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/log error", err);
    return NextResponse.json(
      { error: "Failed to process dive log request" },
      { status: 500 }
    );
  }
}
