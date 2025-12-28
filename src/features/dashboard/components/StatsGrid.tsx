"use client";

import { useState, useEffect } from "react";
import { useUnitSystem } from "@/contexts/UnitSystemContext";
import { displayDepth } from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import styles from "./StatsGrid.module.css";

interface StatsGridProps {
  totalDives: number;
  totalBottomTime: number;
  deepestDive: number;
  avgDepth?: number;
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
  const { unitSystem } = useUnitSystem();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const deepestDiveDisplay = displayDepth(deepestDive, isMounted ? unitSystem : "metric");
  const avgDepthDisplay = avgDepth
    ? displayDepth(avgDepth, isMounted ? unitSystem : "metric")
    : null;

  return (
    <section className={styles.statsSection}>
      <h2 className={styles.sectionTitle}>At a Glance</h2>
      <div className={styles.grid}>
        <div className={`${cardStyles.card} ${cardStyles.cardCompact} ${styles.statCard}`}>
          <p className={cardStyles.statLabel}>Total dives</p>
          <p className={cardStyles.statValue}>{totalDives}</p>
        </div>

        <div className={`${cardStyles.card} ${cardStyles.cardCompact} ${styles.statCard}`}>
          <p className={cardStyles.statLabel}>Total bottom time</p>
          <p className={cardStyles.statValue}>
            {totalBottomTime}
            <span className={cardStyles.statUnit}>min</span>
          </p>
        </div>

        <div className={`${cardStyles.card} ${cardStyles.cardCompact} ${styles.statCard}`}>
          <p className={cardStyles.statLabel}>Deepest dive</p>
          <p className={cardStyles.statValue}>
            {deepestDiveDisplay.value}
            <span className={cardStyles.statUnit}>{deepestDiveDisplay.unit}</span>
          </p>
        </div>

        {avgDepthDisplay && (
          <div className={`${cardStyles.card} ${cardStyles.cardCompact} ${styles.statCard}`}>
            <p className={cardStyles.statLabel}>Avg depth</p>
            <p className={cardStyles.statValue}>
              {avgDepthDisplay.value}
              <span className={cardStyles.statUnit}>{avgDepthDisplay.unit}</span>
            </p>
          </div>
        )}

        {avgBottomTime && (
          <div className={`${cardStyles.card} ${cardStyles.cardCompact} ${styles.statCard}`}>
            <p className={cardStyles.statLabel}>Avg bottom time</p>
            <p className={cardStyles.statValue}>
              {avgBottomTime}
              <span className={cardStyles.statUnit}>min</span>
            </p>
          </div>
        )}

        <div className={`${cardStyles.card} ${cardStyles.cardCompact} ${styles.statCard}`}>
          <p className={cardStyles.statLabel}>Dives this month</p>
          <p className={cardStyles.statValue}>{divesThisMonth}</p>
        </div>
      </div>
    </section>
  );
}

