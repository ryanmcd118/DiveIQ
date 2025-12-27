"use client";

import { useState, FormEvent, useEffect } from "react";
import { AIDiveBriefing } from "@/features/dive-plan/components/AIDiveBriefing";
import type { AIBriefing, RiskLevel } from "@/features/dive-plan/types";
import { useUnitSystem } from "@/contexts/UnitSystemContext";
import { uiToMetric, getUnitLabel } from "@/lib/units";
import { UnitToggle } from "@/components/UnitToggle";
import styles from "./PublicHomePage.module.css";

interface PlanResult {
  aiBriefing: AIBriefing;
  riskLevel: RiskLevel;
}

export function PlannerStub() {
  const { unitSystem } = useUnitSystem();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState<string>("18");
  const [prevUnitSystem, setPrevUnitSystem] = useState<typeof unitSystem>(unitSystem);

  // Handle unit system change - convert current values
  useEffect(() => {
    if (prevUnitSystem !== unitSystem && maxDepth) {
      const numValue = parseFloat(maxDepth);
      if (!isNaN(numValue)) {
        const metric = prevUnitSystem === 'metric' ? numValue : numValue / 3.28084;
        const newUI = unitSystem === 'metric' ? metric : metric * 3.28084;
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
      maxDepth: uiToMetric(maxDepthUI, unitSystem, 'depth') ?? 18,
      bottomTime: Number(formData.get("bottomTime")) || 45,
      experienceLevel: formData.get("experienceLevel") || "Intermediate",
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
        <div className={styles.plannerCard}>
          <form onSubmit={handleSubmit} className={styles.plannerForm}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-4)" }}>
              <UnitToggle showLabel={true} />
            </div>
            <div className={styles.plannerRow}>
              <div className={styles.plannerField}>
                <label htmlFor="maxDepth" className={styles.plannerLabel}>
                  Max Depth ({getUnitLabel('depth', unitSystem)})
                </label>
                <input
                  type="number"
                  id="maxDepth"
                  name="maxDepth"
                  min={1}
                  max={unitSystem === 'metric' ? 60 : 200}
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
              <AIDiveBriefing briefing={null} loading={true} compact={true} scrollable={true} />
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2L12 22M2 12L22 12" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
                    </svg>
                  </div>
                  <h4 className={styles.ctaPlaceholderTitle}>
                    Your AI dive briefing will appear here
                  </h4>
                  <p className={styles.ctaPlaceholderText}>
                    Fill in your dive parameters and click <strong>&quot;Start Planning&quot;</strong> to get a personalized dive briefing.
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
