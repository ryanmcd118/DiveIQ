"use client";

import { useState, FormEvent } from "react";
import styles from "./PublicHomePage.module.css";

interface PlanResult {
  aiAdvice: string;
  riskLevel: string;
}

export function PlannerStub() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      region: "Quick Plan",
      siteName: formData.get("location") || "Unspecified",
      date: new Date().toISOString().split("T")[0],
      maxDepth: Number(formData.get("maxDepth")) || 18,
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
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskClass = (riskLevel: string) => {
    if (riskLevel.toLowerCase().includes("high")) return styles.resultRiskHigh;
    if (riskLevel.toLowerCase().includes("moderate"))
      return styles.resultRiskModerate;
    return styles.resultRisk;
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
            <div className={styles.plannerRow}>
              <div className={styles.plannerField}>
                <label htmlFor="maxDepth" className={styles.plannerLabel}>
                  Max Depth (m)
                </label>
                <input
                  type="number"
                  id="maxDepth"
                  name="maxDepth"
                  min={1}
                  max={60}
                  defaultValue={18}
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
                Location (optional)
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="e.g., Cozumel, Great Barrier Reef..."
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

        {/* Right side: CTA Placeholder or Result */}
        <div className={styles.plannerResultPanel}>
          {loading && (
            <div className={styles.plannerResultLoading}>
              <div className={styles.loadingSpinner} />
              <p className={styles.loadingText}>Generating your dive plan...</p>
            </div>
          )}

          {error && !loading && (
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
          )}

          {result && !loading && (
            <div className={styles.plannerResultContent}>
              <div className={styles.resultHeader}>
                <h4 className={styles.resultTitle}>Your dive plan preview</h4>
                <span className={getRiskClass(result.riskLevel)}>
                  {result.riskLevel}
                </span>
              </div>
              <p className={styles.resultAdvice}>{result.aiAdvice}</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className={styles.plannerCtaPlaceholder}>
              <div className={styles.ctaPlaceholderIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L12 22M2 12L22 12" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
                </svg>
              </div>
              <h4 className={styles.ctaPlaceholderTitle}>
                Your AI dive plan will appear here
              </h4>
              <p className={styles.ctaPlaceholderText}>
                Fill in your dive parameters and click <strong>&quot;Start Planning&quot;</strong> to get personalized guidance for your next dive.
              </p>
              <ul className={styles.ctaPlaceholderList}>
                <li>Personalized safety recommendations</li>
                <li>Gas planning guidance</li>
                <li>Site-specific tips</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

