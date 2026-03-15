import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";
import { diveGearRepository } from "@/services/database/repositories/gearRepository";
import type { DiveLogInput } from "@/features/dive-log/types";
import { apiError, apiSuccess, apiCreated, apiOk } from "@/lib/apiResponse";
import { NotFoundError } from "@/lib/errors";

/**
 * GET /api/dive-logs
 * Retrieve dive logs for the authenticated user
 * - With ?id={id}: get a single log entry
 * - Without id: get all log entries (newest first)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const entry = await diveLogRepository.findById(id, session.user.id);
      if (entry) {
        const gearItems = await diveGearRepository.getGearForDive(
          entry.id,
          session.user.id
        );
        return apiSuccess({
          entry,
          gearItems: gearItems.map((dgi) => dgi.gearItem),
        });
      }
      return apiSuccess({ entry: null });
    }

    const entries = await diveLogRepository.findMany({
      orderBy: "date",
      userId: session.user.id,
    });

    // Load gear for all entries
    const entriesWithGear = await Promise.all(
      entries.map(async (entry) => {
        const gearItems = await diveGearRepository.getGearForDive(
          entry.id,
          session.user.id
        );
        return {
          ...entry,
          gearItems: gearItems.map((dgi) => dgi.gearItem),
        };
      })
    );

    return apiSuccess({ entries: entriesWithGear });
  } catch (err) {
    console.error("GET /api/dive-logs error", err);
    if (err instanceof NotFoundError) {
      return apiError(err.message, 404);
    }
    return apiError("Failed to fetch dive logs", 500);
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
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const { action, id, payload } = body as {
      action: "create" | "update" | "delete";
      id?: string;
      payload?: DiveLogInput;
    };

    // CREATE
    if (action === "create") {
      if (!payload) {
        return apiError("Missing payload for create", 400);
      }

      const { gearItemIds, ...diveLogData } = payload as DiveLogInput & {
        gearItemIds?: string[];
      };

      const createdRaw = await diveLogRepository.create(
        diveLogData,
        session.user.id
      );

      // Recompute chronological dive numbers after any structural change
      await diveLogRepository.recomputeDiveNumbersForUser(session.user.id);

      const created =
        (await diveLogRepository.findById(createdRaw.id, session.user.id)) ??
        createdRaw;

      // Handle gear associations
      if (gearItemIds && Array.isArray(gearItemIds) && gearItemIds.length > 0) {
        await diveGearRepository.setGearForDive(
          created.id,
          gearItemIds,
          session.user.id
        );
      }

      // Load gear items for response
      const gearItems = await diveGearRepository.getGearForDive(
        created.id,
        session.user.id
      );

      return apiCreated({
        entry: created,
        gearItems: gearItems.map((dgi) => dgi.gearItem),
      });
    }

    // UPDATE
    if (action === "update") {
      if (!id || !payload) {
        return apiError("Missing id or payload for update", 400);
      }

      const { gearItemIds, ...diveLogData } = payload as DiveLogInput & {
        gearItemIds?: string[];
      };

      const updatedRaw = await diveLogRepository.update(
        id,
        diveLogData,
        session.user.id
      );

      await diveLogRepository.recomputeDiveNumbersForUser(session.user.id);

      const updated =
        (await diveLogRepository.findById(id, session.user.id)) ?? updatedRaw;

      // Handle gear associations
      if (gearItemIds !== undefined) {
        await diveGearRepository.setGearForDive(
          id,
          gearItemIds || [],
          session.user.id
        );
      }

      // Load gear items for response
      const gearItems = await diveGearRepository.getGearForDive(
        id,
        session.user.id
      );

      return apiSuccess({
        entry: updated,
        gearItems: gearItems.map((dgi) => dgi.gearItem),
      });
    }

    // DELETE
    if (action === "delete") {
      if (!id) {
        return apiError("Missing id for delete", 400);
      }

      await diveLogRepository.delete(id, session.user.id);

      await diveLogRepository.recomputeDiveNumbersForUser(session.user.id);
      return apiOk();
    }

    // Unknown action
    return apiError("Invalid action", 400);
  } catch (err) {
    console.error("POST /api/dive-logs error", err);
    if (err instanceof NotFoundError) {
      return apiError(err.message, 404);
    }
    return apiError("Failed to process dive log request", 500);
  }
}
