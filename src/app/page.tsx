import type { DiveLog, DivePlan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { DashboardPageContent } from "@/features/dashboard/components/DashboardPageContent";
import { PublicHomePage } from "@/features/public-home";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";
import { divePlanRepository } from "@/services/database/repositories/divePlanRepository";

// Force dynamic rendering to ensure session is always checked
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Get the current session to check authentication
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // If not authenticated, show the public marketing homepage
  if (!userId) {
    return <PublicHomePage />;
  }

  // Authenticated users get the dashboard
  const [recentDives, statistics, recentPlans] = await Promise.all([
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
  ]);

  return (
    <DashboardPageContent
      recentDives={recentDives as DiveLog[]}
      totalCount={statistics.totalDives}
      totalBottomTime={statistics.totalBottomTime}
      deepestDive={statistics.deepestDive}
      recentPlans={recentPlans as DivePlan[]}
      isAuthenticated={true}
    />
  );
}
