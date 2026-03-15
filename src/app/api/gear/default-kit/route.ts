import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { gearKitRepository } from "@/services/database/repositories/gearRepository";
import { apiError, apiSuccess } from "@/lib/apiResponse";

/**
 * GET /api/gear/default-kit
 * Get the default kit for the authenticated user
 */
export async function GET(_req: NextRequest) {
  void _req;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const defaultKit = await gearKitRepository.findDefault(session.user.id);
    return apiSuccess({ kit: defaultKit });
  } catch (err) {
    console.error("GET /api/gear/default-kit error", err);
    return apiError("Failed to fetch default kit", 500);
  }
}
