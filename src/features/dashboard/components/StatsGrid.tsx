"use client";

import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { displayDepth } from "@/lib/units";
import styles from "./StatsGrid.module.css";

interface StatsGridProps {
  totalDives: number;
  totalBottomTime: number;
  deepestDive: number; // In centimeters (canonical)
  avgDepth?: number; // In centimeters (canonical)
  avgBottomTime?: number;
  divesThisMonth?: number;
}

export function StatsGrid({
  totalDives,
  totalBottomTime,
  deepestDive,
  avgDepth,
  avgBottomTime,
  divesThisMonth = 0,
}: StatsGridProps) {
  const { prefs } = useUnitPreferences();

  const deepestDiveDisplay = displayDepth(deepestDive, prefs.depth);
  const avgDepthDisplay = avgDepth ? displayDepth(avgDepth, prefs.depth) : null;

  return (
    <section className={styles.statsSection}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionTitleText}>At a Glance</span>
      </h2>
      <div className={styles.grid}>
        {/* Hero stat - spans 2 columns on desktop */}
        <div
          className={`${styles.statCard} ${styles.statCardTier2} ${styles.statCardHero}`}
        >
          <p className={styles.statLabel}>Total dives</p>
          <p className={styles.statValue}>{totalDives}</p>
        </div>

        <div className={`${styles.statCard} ${styles.statCardTier2}`}>
          <p className={styles.statLabel}>Total bottom time</p>
          <p className={styles.statValue}>
            {totalBottomTime}
            <span className={styles.statUnit}>min</span>
          </p>
        </div>

        <div className={`${styles.statCard} ${styles.statCardTier2}`}>
          <p className={styles.statLabel}>Deepest dive</p>
          <p className={styles.statValue}>
            {deepestDiveDisplay.value}
            <span className={styles.statUnit}>{deepestDiveDisplay.unit}</span>
          </p>
        </div>

        {avgDepthDisplay && (
          <div className={`${styles.statCard} ${styles.statCardTier2}`}>
            <p className={styles.statLabel}>Avg depth</p>
            <p className={styles.statValue}>
              {avgDepthDisplay.value}
              <span className={styles.statUnit}>{avgDepthDisplay.unit}</span>
            </p>
          </div>
        )}

        {avgBottomTime && (
          <div className={`${styles.statCard} ${styles.statCardTier2}`}>
            <p className={styles.statLabel}>Avg bottom time</p>
            <p className={styles.statValue}>
              {avgBottomTime}
              <span className={styles.statUnit}>min</span>
            </p>
          </div>
        )}

        <div className={`${styles.statCard} ${styles.statCardTier2}`}>
          <p className={styles.statLabel}>Dives this month</p>
          <p className={styles.statValue}>{divesThisMonth}</p>
        </div>
      </div>
    </section>
  );
}
