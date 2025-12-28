"use client";

import { useUnitSystem } from "@/contexts/UnitSystemContext";
import styles from "./NavbarUnitToggle.module.css";

/**
 * Compact unit toggle for the logged-in navbar
 * Only renders when user is authenticated
 */
export function NavbarUnitToggle() {
  const { unitSystem, setUnitSystem, isMounted } = useUnitSystem();

  // Before mount, render with no active state to match SSR
  // This ensures server and client render match exactly
  if (!isMounted) {
    return (
      <div className={styles.container} role="group" aria-label="Unit system">
        <button
          type="button"
          className={styles.segment}
          onClick={() => setUnitSystem("metric")}
          aria-pressed={false}
          aria-label="Metric units"
          title="Metric units (m, °C)"
        >
          Metric
        </button>
        <button
          type="button"
          className={styles.segment}
          onClick={() => setUnitSystem("imperial")}
          aria-pressed={false}
          aria-label="Imperial units"
          title="Imperial units (ft, °F)"
        >
          Imperial
        </button>
      </div>
    );
  }

  // After mount, render with actual unitSystem state
  return (
    <div className={styles.container} role="group" aria-label="Unit system">
      <button
        type="button"
        className={`${styles.segment} ${unitSystem === "metric" ? styles.active : ""}`}
        onClick={() => setUnitSystem("metric")}
        aria-pressed={unitSystem === "metric"}
        aria-label="Metric units"
        title="Metric units (m, °C)"
      >
        Metric
      </button>
      <button
        type="button"
        className={`${styles.segment} ${unitSystem === "imperial" ? styles.active : ""}`}
        onClick={() => setUnitSystem("imperial")}
        aria-pressed={unitSystem === "imperial"}
        aria-label="Imperial units"
        title="Imperial units (ft, °F)"
      >
        Imperial
      </button>
    </div>
  );
}
