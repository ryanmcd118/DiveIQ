"use client";

import { useState, FormEvent, useEffect } from "react";
import { AIDiveBriefing } from "@/features/dive-plan/components/AIDiveBriefing";
import type { AIBriefing, RiskLevel } from "@/features/dive-plan/types";
import type { UnitSystem } from "@/lib/units";
import { uiToMetric, getUnitLabel } from "@/lib/units";
import styles from "./PublicHomePage.module.css";
import cardStyles from "@/styles/components/Card.module.css";

interface PlanResult {
  aiBriefing: AIBriefing;
  riskLevel: RiskLevel;
}

export function PlannerStub() {
  // Client-mount guard to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  // Use local state for logged-out planner stub (not global context)
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    // Try to load from localStorage, but this is local to this component
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("diveiq:unitSystem");
      if (stored === "metric" || stored === "imperial") {
        return stored;
      }
    }
    return "metric";
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState<string>("18");
  const [prevUnitSystem, setPrevUnitSystem] = useState<UnitSystem>(unitSystem);

  // Set mounted flag on client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Persist to localStorage when unitSystem changes (local preference for logged-out users)
  // Also dispatch custom event so AIDiveBriefing can pick it up
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("diveiq:unitSystem", unitSystem);
      // Dispatch event so AIDiveBriefing (via useUnitSystemOrLocal) can react to changes
      const event = new CustomEvent("unitSystemChanged", {
        detail: unitSystem,
      });
      window.dispatchEvent(event);
    }
  }, [unitSystem]);

  // Handle unit system change - convert current values
  useEffect(() => {
    if (prevUnitSystem !== unitSystem && maxDepth) {
      const numValue = parseFloat(maxDepth);
      if (!isNaN(numValue)) {
        const metric =
          prevUnitSystem === "metric" ? numValue : numValue / 3.28084;
        const newUI = unitSystem === "metric" ? metric : metric * 3.28084;
        setMaxDepth(String(Math.round(newUI)));
      }
      setPrevUnitSystem(unitSystem);
    }
  }, [unitSystem, prevUnitSystem, maxDepth]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Get the date or use today
    const dateValue = formData.get("diveDate") as string;
    const date = dateValue || new Date().toISOString().split("T")[0];

    // Convert UI unit values to metric for API
    const maxDepthUI = formData.get("maxDepth");

    const payload = {
      region: (formData.get("location") as string) || "Quick Plan",
      siteName: formData.get("location") || "Unspecified",
      date,
      maxDepth:
        uiToMetric(maxDepthUI as string | null, unitSystem, "depth") ?? 18,
      bottomTime: Number(formData.get("bottomTime")) || 45,
      experienceLevel: formData.get("experienceLevel") || "Intermediate",
      unitSystem, // Pass unit system to AI
    };

    try {
      const response = await fetch("/api/dive-plans/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const data = await response.json();
      setResult({
        aiBriefing: data.aiBriefing,
        riskLevel: data.riskLevel,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <form onSubmit={handleSubmit} className={styles.plannerForm}>
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
                      onClick={() => setUnitSystem("metric")}
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
                      onClick={() => setUnitSystem("imperial")}
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
            <div className={styles.plannerRow}>
              <div className={styles.plannerField}>
                <label htmlFor="maxDepth" className={styles.plannerLabel}>
                  Max Depth{" "}
                  {isMounted ? `(${getUnitLabel("depth", unitSystem)})` : ""}
                </label>
                <input
                  type="number"
                  id="maxDepth"
                  name="maxDepth"
                  min={1}
                  max={isMounted ? (unitSystem === "metric" ? 60 : 200) : 200}
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(e.target.value)}
                  required
                  className={styles.plannerInput}
                />
              </div>

              <div className={styles.plannerField}>
                <label htmlFor="bottomTime" className={styles.plannerLabel}>
                  Bottom Time (min)
                </label>
                <input
                  type="number"
                  id="bottomTime"
                  name="bottomTime"
                  min={1}
                  max={120}
                  defaultValue={45}
                  required
                  className={styles.plannerInput}
                />
              </div>
            </div>

            <div className={styles.plannerField}>
              <label htmlFor="experienceLevel" className={styles.plannerLabel}>
                Experience Level
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                defaultValue="Intermediate"
                className={styles.plannerSelect}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className={styles.plannerField}>
              <label htmlFor="location" className={styles.plannerLabel}>
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="e.g., Cozumel, Great Barrier Reef..."
                className={styles.plannerInput}
              />
            </div>

            <div className={styles.plannerField}>
              <label htmlFor="diveDate" className={styles.plannerLabel}>
                Dive Date (optional)
              </label>
              <input
                type="date"
                id="diveDate"
                name="diveDate"
                className={styles.plannerInput}
              />
            </div>

            <div className={styles.plannerSubmit}>
              <button
                type="submit"
                disabled={loading}
                className={styles.plannerButton}
              >
                {loading ? "Generating..." : "Start Planning →"}
              </button>
              <span className={styles.plannerHint}>No account needed.</span>
            </div>
          </form>
        </div>

        {/* Right side: Result Panel (scrollable) */}
        <div className={styles.plannerResultPanel}>
          <div className={styles.plannerResultScroll}>
            {/* Loading state with skeleton */}
            {loading && (
              <AIDiveBriefing
                briefing={null}
                loading={true}
                compact={true}
                scrollable={true}
              />
            )}

            {/* Error state */}
            {error && !loading && (
              <div className={styles.plannerResultInner}>
                <div className={styles.plannerResultError}>
                  <div className={styles.errorIcon}>!</div>
                  <p className={styles.errorText}>{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className={styles.errorDismiss}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Result with AI Briefing */}
            {result && !loading && (
              <AIDiveBriefing
                briefing={result.aiBriefing}
                compact={true}
                showExpander={true}
                scrollable={true}
              />
            )}

            {/* Empty state / CTA */}
            {!result && !loading && !error && (
              <div className={styles.plannerResultInner}>
                <div className={styles.plannerCtaPlaceholder}>
                  <div className={styles.ctaPlaceholderIcon}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M12 2L12 22M2 12L22 12" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
                    </svg>
                  </div>
                  <h4 className={styles.ctaPlaceholderTitle}>
                    Your AI dive briefing will appear here
                  </h4>
                  <p className={styles.ctaPlaceholderText}>
                    Fill in your dive parameters and click{" "}
                    <strong>&quot;Start Planning&quot;</strong> to get a
                    personalized dive briefing.
                  </p>
                  <ul className={styles.ctaPlaceholderList}>
                    <li>Location-specific conditions</li>
                    <li>Seasonal insights</li>
                    <li>Site hazards & tips</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
