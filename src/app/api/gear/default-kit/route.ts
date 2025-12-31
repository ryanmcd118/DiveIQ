import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { gearKitRepository } from "@/services/database/repositories/gearRepository";

/**
 * GET /api/gear/default-kit
 * Get the default kit for the authenticated user
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const defaultKit = await gearKitRepository.findDefault(session.user.id);
    return NextResponse.json({ kit: defaultKit });
  } catch (err) {
    console.error("GET /api/gear/default-kit error", err);
    return NextResponse.json(
      { error: "Failed to fetch default kit" },
      { status: 500 }
    );
  }
}

