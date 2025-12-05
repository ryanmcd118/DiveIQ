import type { DiveLog, DivePlan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { DashboardPageContent } from "@/features/dashboard/components/DashboardPageContent";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";
import { divePlanRepository } from "@/services/database/repositories/divePlanRepository";

// Force dynamic rendering to ensure session is always checked
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Get the current session to check authentication
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Only fetch user-specific data if logged in, otherwise show empty state
  const [recentDives, statistics, recentPlans] = userId
    ? await Promise.all([
        diveLogRepository.findMany({
          orderBy: "date",
          take: 3,
          userId,
        }),
        diveLogRepository.getStatistics(userId),
        divePlanRepository.findMany({
          orderBy: "createdAt",
          take: 3,
          userId,
        }),
      ])
    : [[], { totalDives: 0, totalBottomTime: 0, deepestDive: 0 }, []];

  return (
    <DashboardPageContent
      recentDives={recentDives as DiveLog[]}
      totalCount={statistics.totalDives}
      totalBottomTime={statistics.totalBottomTime}
      deepestDive={statistics.deepestDive}
      recentPlans={recentPlans as DivePlan[]}
      isAuthenticated={!!userId}
    />
  );
}
