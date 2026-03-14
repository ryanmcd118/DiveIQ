"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { preferencesToUnitSystem } from "@/lib/units";
import styles from "./PublicHomePage.module.css";
import cardStyles from "@/styles/components/Card.module.css";

export function PlannerStub() {
  // Client-mount guard to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  // Use useUnitPreferences with guest mode for consistent unit handling
  const { prefs, setPrefs } = useUnitPreferences({ mode: "guest" });
  const unitSystem = preferencesToUnitSystem(prefs);

  const [region, setRegion] = useState("");
  const [siteName, setSiteName] = useState("");

  const router = useRouter();

  // Set mounted flag on client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClick = () => {
    try {
      sessionStorage.setItem(
        "diveiq:plannerTeaser",
        JSON.stringify({ region, siteName, unitSystem })
      );
    } catch {
      // sessionStorage may be unavailable — proceed without persisting
    }
    router.push("/dive-plans");
  };

  return (
    <section className={`${styles.section} ${styles.plannerSection}`}>
      <div className={styles.plannerHeader}>
        <h2 className={styles.plannerTitle}>Try the planner</h2>
        <p className={styles.plannerSubtitle}>
          Get AI-assisted dive guidance in seconds.
        </p>
      </div>

      <div className={styles.plannerLayout}>
        {/* Left side: Form */}
        <div className={cardStyles.elevatedForm}>
          <div className={styles.plannerForm}>
            {/* Unit toggle - only render after mount to prevent hydration mismatch */}
            {isMounted && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "var(--space-4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--font-size-xs)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Units
                  </span>
                  <div
                    style={{
                      display: "inline-flex",
                      backgroundColor: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: "var(--radius-md)",
                      padding: "2px",
                      gap: "2px",
                    }}
                    role="group"
                    aria-label="Unit system"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPrefs({
                          depth: "m",
                          temperature: "c",
                          pressure: "bar",
                          weight: "kg",
                        });
                      }}
                      aria-pressed={unitSystem === "metric"}
                      aria-label="Metric units"
                      style={{
                        padding: "var(--space-1) var(--space-3)",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: "var(--font-weight-medium)",
                        color:
                          unitSystem === "metric"
                            ? "var(--color-text-primary)"
                            : "var(--color-text-secondary)",
                        backgroundColor:
                          unitSystem === "metric"
                            ? "var(--color-bg-primary)"
                            : "transparent",
                        border: "none",
                        borderRadius: "calc(var(--radius-md) - 2px)",
                        cursor: "pointer",
                        transition: "all var(--transition-base)",
                        whiteSpace: "nowrap",
                        boxShadow:
                          unitSystem === "metric" ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      Metric
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrefs({
                          depth: "ft",
                          temperature: "f",
                          pressure: "psi",
                          weight: "lb",
                        });
                      }}
                      aria-pressed={unitSystem === "imperial"}
                      aria-label="Imperial units"
                      style={{
                        padding: "var(--space-1) var(--space-3)",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: "var(--font-weight-medium)",
                        color:
                          unitSystem === "imperial"
                            ? "var(--color-text-primary)"
                            : "var(--color-text-secondary)",
                        backgroundColor:
                          unitSystem === "imperial"
                            ? "var(--color-bg-primary)"
                            : "transparent",
                        border: "none",
                        borderRadius: "calc(var(--radius-md) - 2px)",
                        cursor: "pointer",
                        transition: "all var(--transition-base)",
                        whiteSpace: "nowrap",
                        boxShadow:
                          unitSystem === "imperial"
                            ? "var(--shadow-sm)"
                            : "none",
                      }}
                    >
                      Imperial
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.plannerField}>
              <label htmlFor="region" className={styles.plannerLabel}>
                Region
              </label>
              <input
                type="text"
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
                placeholder="Roatán, Red Sea, local quarry…"
                className={styles.plannerInput}
              />
            </div>

            <div className={styles.plannerField}>
              <label htmlFor="siteName" className={styles.plannerLabel}>
                Site name
              </label>
              <input
                type="text"
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Mary's Place, Blue Corner…"
                className={styles.plannerInput}
              />
            </div>

            <div className={styles.plannerSubmit}>
              <button
                type="button"
                disabled={!region.trim()}
                onClick={handleClick}
                className={styles.plannerButton}
              >
                Start Planning →
              </button>
              <span className={styles.plannerHint}>No account needed.</span>
            </div>
          </div>
        </div>

        {/* Right side: empty panel to maintain layout */}
        <div
          className={styles.plannerResultPanel}
          style={{ minHeight: "300px" }}
        />
      </div>
    </section>
  );
}
