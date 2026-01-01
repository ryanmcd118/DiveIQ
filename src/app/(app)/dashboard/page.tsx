import type { DiveLog, DivePlan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { DashboardPageContent } from "@/features/dashboard/components/DashboardPageContent";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";
import { divePlanRepository } from "@/services/database/repositories/divePlanRepository";
import { redirect } from "next/navigation";

// Force dynamic rendering to ensure session is always checked
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Get the current session to check authentication
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Redirect to home if not authenticated
  if (!userId) {
    redirect("/");
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
