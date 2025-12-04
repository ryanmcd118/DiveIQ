import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";
import type { DiveLogInput } from "@/features/dive-log/types";

/**
 * GET /api/dive-logs
 * Retrieve dive logs for the authenticated user
 * - With ?id={id}: get a single log entry
 * - Without id: get all log entries (newest first)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const entry = await diveLogRepository.findById(id, session.user.id);
      return NextResponse.json({ entry });
    }

    const entries = await diveLogRepository.findMany({
      orderBy: "date",
      userId: session.user.id,
    });

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("GET /api/dive-logs error", err);
    return NextResponse.json(
      { error: "Failed to fetch dive logs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dive-logs
 * Handle dive log operations (create, update, delete)
 * Requires authentication
 * 
 * Body format:
 * {
 *   action: "create" | "update" | "delete",
 *   id?: string,  // required for update/delete
 *   payload?: DiveLogInput  // required for create/update
 * }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, id, payload } = body as {
      action: "create" | "update" | "delete";
      id?: string;
      payload?: DiveLogInput;
    };

    // CREATE
    if (action === "create") {
      if (!payload) {
        return NextResponse.json(
          { error: "Missing payload for create" },
          { status: 400 }
        );
      }

      const created = await diveLogRepository.create(payload, session.user.id);
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

      const updated = await diveLogRepository.update(id, payload, session.user.id);
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

      await diveLogRepository.delete(id, session.user.id);
      return NextResponse.json({ ok: true });
    }

    // Unknown action
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (err) {
    console.error("POST /api/dive-logs error", err);
    return NextResponse.json(
      { error: "Failed to process dive log request" },
      { status: 500 }
    );
  }
}
