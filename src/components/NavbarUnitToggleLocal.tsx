"use client";

import { useState, useEffect } from "react";
import type { UnitSystem } from "@/lib/units";
import styles from "./NavbarUnitToggle.module.css";

/**
 * Local-state unit toggle for logged-out users in the navbar
 * Uses local component state (not global context)
 */
export function NavbarUnitToggleLocal() {
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

  // Persist to localStorage when unitSystem changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("diveiq:unitSystem", unitSystem);
    }
  }, [unitSystem]);

  // Dispatch custom event so PlanForm can listen to changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Small delay to ensure listeners are set up
      const timer = setTimeout(() => {
        const event = new CustomEvent("unitSystemChanged", {
          detail: unitSystem,
        });
        window.dispatchEvent(event);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [unitSystem]);

  // Render with actual unitSystem state
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
