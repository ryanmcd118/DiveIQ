import { prisma } from "@/lib/prisma";
import type { DiveLog, DivePlan } from "@prisma/client";
import { DashboardPageContent } from "@/features/dashboard/components/DashboardPageContent";

export default async function DashboardPage() {
  const [recentDives, totalCount, aggregates, recentPlans] = await Promise.all([
    prisma.diveLog.findMany({
      orderBy: { date: "desc" },
      take: 3,
    }),
    prisma.diveLog.count(),
    prisma.diveLog.aggregate({
      _sum: { bottomTime: true },
      _max: { maxDepth: true },
    }),
    prisma.divePlan.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const totalBottomTime = aggregates._sum.bottomTime ?? 0;
  const deepestDive = aggregates._max.maxDepth ?? 0;

  return (
    <DashboardPageContent
      recentDives={recentDives as DiveLog[]}
      totalCount={totalCount}
      totalBottomTime={totalBottomTime}
      deepestDive={deepestDive}
      recentPlans={recentPlans as DivePlan[]}
    />
  );
}
