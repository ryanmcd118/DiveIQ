"use client";

import type { UnitSystem } from "@/lib/units";
import styles from "./UnitToggleButtons.module.css";

interface UnitToggleButtonsProps {
  unitSystem: UnitSystem;
  onChange: (system: UnitSystem) => void;
}

/**
 * Pure presentational segmented toggle for Imperial/Metric.
 * No state, no context, no localStorage — caller owns all behavior.
 */
export function UnitToggleButtons({
  unitSystem,
  onChange,
}: UnitToggleButtonsProps) {
  return (
    <div className={styles.container} role="group" aria-label="Unit system">
      <button
        type="button"
        className={`${styles.segment} ${unitSystem === "metric" ? styles.active : ""}`}
        onClick={() => onChange("metric")}
        aria-pressed={unitSystem === "metric"}
        aria-label="Metric units"
        title="Metric units (m, °C)"
      >
        Metric
      </button>
      <button
        type="button"
        className={`${styles.segment} ${unitSystem === "imperial" ? styles.active : ""}`}
        onClick={() => onChange("imperial")}
        aria-pressed={unitSystem === "imperial"}
        aria-label="Imperial units"
        title="Imperial units (ft, °F)"
      >
        Imperial
      </button>
    </div>
  );
}
