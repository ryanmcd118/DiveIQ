"use client";

import { useState } from "react";
import Link from "next/link";
import type { DiveLog, DivePlan } from "@prisma/client";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { displayDepth } from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import navStyles from "@/styles/components/Navigation.module.css";
import listStyles from "@/styles/components/List.module.css";
import styles from "./ActivityTabs.module.css";

interface ActivityTabsProps {
  recentDives: DiveLog[];
  plannedDives: DivePlan[];
}

export function ActivityTabs({ recentDives, plannedDives }: ActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "planned">("recent");
  const { prefs } = useUnitPreferences();

  return (
    <section className={styles.activitySection}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "recent" ? styles.active : ""}`}
          onClick={() => setActiveTab("recent")}
        >
          Recent dives
        </button>
        <button
          className={`${styles.tab} ${activeTab === "planned" ? styles.active : ""}`}
          onClick={() => setActiveTab("planned")}
        >
          Planned dives
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "recent" ? (
          <>
            <div className={styles.header}>
              <h3 className={cardStyles.title}>Recent dives</h3>
              <Link href="/dive-logs" className={navStyles.linkAccentSmall}>
                View full log
              </Link>
            </div>
            {recentDives.length === 0 ? (
              <p className={listStyles.empty}>No dives logged yet.</p>
            ) : (
              <ul className={listStyles.listCompact}>
                {recentDives.map((dive) => {
                  const depth = displayDepth(dive.maxDepthCm, prefs.depth);
                  return (
                    <li key={dive.id} className={cardStyles.listItem}>
                      <div className={styles.row}>
                        <div className={styles.left}>
                          <span className={styles.siteName}>
                            {dive.siteName}{" "}
                            <span className={styles.region}>
                              ({dive.region})
                            </span>
                          </span>
                          <p className={styles.meta}>
                            {depth.value}
                            {depth.unit} · {dive.bottomTime}min
                            {dive.buddyName && ` · ${dive.buddyName}`}
                          </p>
                        </div>
                        <span className={listStyles.diveDate}>{dive.date}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <>
            <div className={styles.header}>
              <h3 className={cardStyles.title}>Planned dives</h3>
              <Link href="/plan" className={navStyles.linkAccentSmall}>
                Open planner
              </Link>
            </div>
            {plannedDives.length === 0 ? (
              <p className={listStyles.empty}>No planned dives yet.</p>
            ) : (
              <ul className={listStyles.listCompact}>
                {plannedDives.map((plan) => {
                  const depth = displayDepth(plan.maxDepthCm, prefs.depth);
                  return (
                    <li key={plan.id} className={cardStyles.listItem}>
                      <div className={styles.row}>
                        <div className={styles.left}>
                          <span className={styles.siteName}>
                            {plan.siteName}{" "}
                            <span className={styles.region}>
                              ({plan.region})
                            </span>
                          </span>
                          <p className={styles.meta}>
                            {depth.value}
                            {depth.unit} · {plan.bottomTime}min ·{" "}
                            <span className={styles.capitalize}>
                              {plan.experienceLevel}
                            </span>
                          </p>
                        </div>
                        <span className={listStyles.diveDate}>{plan.date}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
