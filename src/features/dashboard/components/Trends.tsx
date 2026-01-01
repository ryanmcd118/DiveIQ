"use client";

import styles from "./Trends.module.css";

interface TrendsProps {
  divesOverTime?: { month: string; count: number }[];
  bottomTimeTrend?: { dive: number; bottomTime: number }[];
}

export function Trends({ divesOverTime, bottomTimeTrend }: TrendsProps) {
  // Mock data if not provided
  const mockDivesOverTime = divesOverTime || [
    { month: "Jan", count: 2 },
    { month: "Feb", count: 4 },
    { month: "Mar", count: 3 },
    { month: "Apr", count: 5 },
    { month: "May", count: 4 },
    { month: "Jun", count: 6 },
  ];

  const mockBottomTimeTrend = bottomTimeTrend || [
    { dive: 1, bottomTime: 45 },
    { dive: 2, bottomTime: 50 },
    { dive: 3, bottomTime: 48 },
    { dive: 4, bottomTime: 55 },
    { dive: 5, bottomTime: 52 },
    { dive: 6, bottomTime: 60 },
  ];

  const maxDives = Math.max(...mockDivesOverTime.map((d) => d.count), 1);
  const maxBottomTime = Math.max(
    ...mockBottomTimeTrend.map((d) => d.bottomTime),
    1
  );

  return (
    <section className={styles.trends}>
      <h2 className={styles.sectionTitle}>Trends</h2>
      <div className={styles.chartsGrid}>
        {/* Dives over time */}
        <div className={`${styles.chartCard} ${styles.chartCardTier2}`}>
          <h3 className={styles.chartTitle}>Dives over time</h3>
          <div className={styles.chart}>
            {mockDivesOverTime.map((item, index) => (
              <div key={index} className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{
                    height: `${(item.count / maxDives) * 100}%`,
                  }}
                  title={`${item.month}: ${item.count} dives`}
                />
                <span className={styles.barLabel}>{item.month}</span>
              </div>
            ))}
          </div>
          {!divesOverTime && (
            <p className={styles.placeholderNote}>(mock data)</p>
          )}
        </div>

        {/* Bottom time trend */}
        <div className={`${styles.chartCard} ${styles.chartCardTier2}`}>
          <h3 className={styles.chartTitle}>Bottom time trend</h3>
          <div className={styles.chart}>
            {mockBottomTimeTrend.map((item, index) => (
              <div key={index} className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{
                    height: `${(item.bottomTime / maxBottomTime) * 100}%`,
                  }}
                  title={`Dive ${item.dive}: ${item.bottomTime} min`}
                />
                <span className={styles.barLabel}>{item.dive}</span>
              </div>
            ))}
          </div>
          {!bottomTimeTrend && (
            <p className={styles.placeholderNote}>(mock data)</p>
          )}
        </div>
      </div>
    </section>
  );
}
