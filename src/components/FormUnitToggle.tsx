"use client";

import { useState, useEffect } from "react";
import type { UnitSystem } from "@/lib/units";
import styles from "./UnitToggle.module.css";

/**
 * Form-level unit toggle for logged-out users
 * Uses local state and dispatches events for useUnitSystemOrLocal hook
 * Positioned at the top of forms (not in navbar)
 */
export function FormUnitToggle() {
  // Initialize from localStorage if available (client-side only)
  // On SSR, window is undefined so this returns "metric" for consistency
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("diveiq:unitSystem");
      if (stored === "metric" || stored === "imperial") {
        return stored;
      }
    }
    return "metric";
  });

  // Persist to localStorage when unitSystem changes (only after mount)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("diveiq:unitSystem", unitSystem);
      // Dispatch event so useUnitSystemOrLocal can react to changes
      const event = new CustomEvent("unitSystemChanged", {
        detail: unitSystem,
      });
      window.dispatchEvent(event);
    }
  }, [unitSystem]);

  // Render toggle with active state based on unitSystem
  const renderToggle = () => {
    return (
      <div className={styles.toggle} role="group" aria-label="Unit system">
        <button
          type="button"
          className={`${styles.segment} ${unitSystem === "metric" ? styles.active : ""}`}
          onClick={() => setUnitSystem("metric")}
          aria-pressed={unitSystem === "metric"}
          aria-label="Metric units"
        >
          Metric
        </button>
        <button
          type="button"
          className={`${styles.segment} ${unitSystem === "imperial" ? styles.active : ""}`}
          onClick={() => setUnitSystem("imperial")}
          aria-pressed={unitSystem === "imperial"}
          aria-label="Imperial units"
        >
          Imperial
        </button>
      </div>
    );
  };

  return (
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
        {renderToggle()}
      </div>
    </div>
  );
}
