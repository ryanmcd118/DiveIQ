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
      <div className={styles.plannerContainer}>
        <div className={styles.plannerHeader}>
          <h2 className={styles.plannerTitle}>Try the planner</h2>
          <p className={styles.plannerSubtitle}>
            Get AI-assisted dive guidance in seconds.
          </p>
        </div>

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

          {error && (
            <div className={styles.plannerResult}>
              <p style={{ color: "var(--color-danger-text)" }}>{error}</p>
            </div>
          )}

          {result && (
            <div className={styles.plannerResult}>
              <div className={styles.resultHeader}>
                <h4 className={styles.resultTitle}>Your dive plan preview</h4>
                <span className={getRiskClass(result.riskLevel)}>
                  {result.riskLevel}
                </span>
              </div>
              <p className={styles.resultAdvice}>{result.aiAdvice}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

