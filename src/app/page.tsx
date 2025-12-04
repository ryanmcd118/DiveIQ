import type { DiveLog, DivePlan } from "@prisma/client";
import { DashboardPageContent } from "@/features/dashboard/components/DashboardPageContent";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";
import { divePlanRepository } from "@/services/database/repositories/divePlanRepository";

export default async function DashboardPage() {
  // Fetch data using repository pattern
  const [recentDives, statistics, recentPlans] = await Promise.all([
    diveLogRepository.findMany({
      orderBy: "date",
      take: 3,
    }),
    diveLogRepository.getStatistics(),
    divePlanRepository.findMany({
      orderBy: "createdAt",
      take: 3,
    }),
  ]);

  return (
    <DashboardPageContent
      recentDives={recentDives as DiveLog[]}
      totalCount={statistics.totalDives}
      totalBottomTime={statistics.totalBottomTime}
      deepestDive={statistics.deepestDive}
      recentPlans={recentPlans as DivePlan[]}
    />
  );
}
