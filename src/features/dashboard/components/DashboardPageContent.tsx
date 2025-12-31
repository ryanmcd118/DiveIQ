"use client";

import type { DiveLog, DivePlan } from "@prisma/client";
import { DashboardHeader } from "./DashboardHeader";
import { InFocusCards } from "./InFocusCards";
import { StatsGrid } from "./StatsGrid";
import { ActivityTabs } from "./ActivityTabs";
import { RightRail } from "./RightRail";
import { Trends } from "./Trends";
import styles from "./DashboardPageContent.module.css";

type Props = {
  recentDives: DiveLog[];
  totalCount: number;
  totalBottomTime: number;
  deepestDive: number;
  recentPlans: DivePlan[];
  isAuthenticated?: boolean;
};

export function DashboardPageContent({
  recentDives,
  totalCount,
  totalBottomTime,
  deepestDive,
  recentPlans,
  isAuthenticated: _isAuthenticated = false,
}: Props) {
  const mostRecentDive = recentDives[0];
  const nextPlannedDive = recentPlans[0]; // Assuming plans are ordered by date

  // Calculate additional stats
  const avgDepth =
    recentDives.length > 0
      ? recentDives.reduce((sum, dive) => sum + dive.maxDepthCm, 0) /
        recentDives.length
      : undefined;
  const avgBottomTime =
    recentDives.length > 0
      ? recentDives.reduce((sum, dive) => sum + dive.bottomTime, 0) /
        recentDives.length
      : undefined;

  // Calculate dives this month (mock for now, would need date filtering)
  const divesThisMonth = recentDives.length; // Simplified

  // Get last dive date
  const lastDiveDate = mostRecentDive?.date;

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardContent}>
        {/* Hero block - greeting area with guaranteed spacing */}
        <div className={styles.heroBlock}>
          <DashboardHeader
            totalDives={totalCount}
            totalBottomTime={totalBottomTime}
            lastDiveDate={lastDiveDate}
            divesThisMonth={divesThisMonth}
          />
        </div>

        {/* Main grid: 8 cols main, 4 cols right rail */}
        <div className={styles.mainGrid}>
          <div className={styles.mainContent}>
            {/* In Focus */}
            <InFocusCards
              nextPlannedDive={nextPlannedDive}
              mostRecentDive={mostRecentDive}
              divesThisMonth={divesThisMonth}
            />

            {/* At a Glance */}
            <StatsGrid
              totalDives={totalCount}
              totalBottomTime={totalBottomTime}
              deepestDive={deepestDive}
              avgDepth={avgDepth}
              avgBottomTime={avgBottomTime}
              divesThisMonth={divesThisMonth}
            />

            {/* Activity section */}
            <ActivityTabs
              recentDives={recentDives}
              plannedDives={recentPlans}
            />

            {/* Trends */}
            <Trends />
          </div>

          {/* Right rail */}
          <div className={styles.rightRail}>
            <RightRail />
          </div>
        </div>
      </div>
    </div>
  );
}
