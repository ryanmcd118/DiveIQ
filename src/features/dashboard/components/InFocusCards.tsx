"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DiveLog, DivePlan } from "@prisma/client";
import { useUnitSystem } from "@/contexts/UnitSystemContext";
import { displayDepth, displayTemperature } from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./InFocusCards.module.css";

interface InFocusCardsProps {
  nextPlannedDive?: DivePlan;
  mostRecentDive?: DiveLog;
  divesThisMonth?: number;
  surfaceInterval?: number;
}

export function InFocusCards({
  nextPlannedDive,
  mostRecentDive,
  divesThisMonth = 0,
  surfaceInterval,
}: InFocusCardsProps) {
  const { unitSystem } = useUnitSystem();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className={styles.inFocus}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionTitleText}>In Focus</span>
      </h2>
      <div className={styles.cardsGrid}>
        {/* Next planned dive - Primary card (spans 2 cols on desktop) */}
        <div className={`${styles.card} ${styles.cardTier1} ${styles.cardPrimary}`}>
          <h3 className={styles.cardTitle}>Next planned dive</h3>
          {nextPlannedDive ? (
            <div className={styles.cardContent}>
              <p className={styles.siteName}>
                {nextPlannedDive.siteName}
                <span className={styles.region}> ({nextPlannedDive.region})</span>
              </p>
              <p className={styles.meta}>
                {(() => {
                  const depth = displayDepth(
                    nextPlannedDive.maxDepth,
                    isMounted ? unitSystem : "metric"
                  );
                  return `${depth.value}${depth.unit} · ${nextPlannedDive.bottomTime}min`;
                })()}
              </p>
              <p className={styles.meta}>
                <span className={styles.capitalize}>{nextPlannedDive.experienceLevel}</span> ·{" "}
                {nextPlannedDive.riskLevel}
              </p>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No upcoming dives</p>
              <Link href="/dive-plans" className={buttonStyles.ghost}>
                Plan a dive
              </Link>
            </div>
          )}
        </div>

        {/* Most recent dive */}
        <div className={`${styles.card} ${styles.cardTier1}`}>
          <h3 className={styles.cardTitle}>Most recent dive</h3>
          {mostRecentDive ? (
            <div className={styles.cardContent}>
              <p className={styles.siteName}>
                {mostRecentDive.siteName}
                <span className={styles.region}> ({mostRecentDive.region})</span>
              </p>
              <p className={styles.meta}>
                {(() => {
                  const depth = displayDepth(
                    mostRecentDive.maxDepth,
                    isMounted ? unitSystem : "metric"
                  );
                  const temp = mostRecentDive.waterTemp
                    ? displayTemperature(
                        mostRecentDive.waterTemp,
                        isMounted ? unitSystem : "metric"
                      )
                    : null;
                  return `${depth.value}${depth.unit} · ${mostRecentDive.bottomTime}min${
                    temp ? ` · ${temp.value}${temp.unit}` : ""
                  }`;
                })()}
              </p>
              <p className={styles.meta}>{mostRecentDive.date}</p>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No dives logged yet</p>
              <Link href="/dive-logs" className={buttonStyles.ghost}>
                Log a dive
              </Link>
            </div>
          )}
        </div>

        {/* Readiness / Activity */}
        <div className={`${styles.card} ${styles.cardTier1}`}>
          <h3 className={styles.cardTitle}>Activity</h3>
          <div className={styles.cardContent}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Dives this month</span>
              <span className={styles.statValue}>{divesThisMonth}</span>
            </div>
            {surfaceInterval !== undefined && surfaceInterval > 0 && (
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Surface interval</span>
                <span className={styles.statValue}>{surfaceInterval}h</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile setup / Gear/Cert status */}
        <div className={`${styles.card} ${styles.cardTier1}`}>
          <h3 className={styles.cardTitle}>Profile setup</h3>
          <div className={styles.cardContent}>
            <p className={styles.setupText}>2 items incomplete</p>
            <ul className={styles.setupList}>
              <li>
                <Link href="/certifications" className={styles.setupLink}>
                  Add certifications
                </Link>
              </li>
              <li>
                <Link href="/gear" className={styles.setupLink}>
                  Add primary gear
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

