"use client";

import { useState, useEffect } from "react";
import type { UnitSystem } from "@/lib/units";
import styles from "./NavbarUnitToggle.module.css";

/**
 * Local-state unit toggle for logged-out users in the navbar
 * Uses local component state (not global context)
 */
export function NavbarUnitToggleLocal() {
  // Always start with 'metric' for SSR/client consistency
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("diveiq:unitSystem");
    if (stored === "metric" || stored === "imperial") {
      setUnitSystem(stored);
    }
  }, []);

  // Persist to localStorage when unitSystem changes (only after mount)
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("diveiq:unitSystem", unitSystem);
    }
  }, [unitSystem, isMounted]);

  // Dispatch custom event so PlanForm can listen to changes
  // Dispatch on mount and whenever unitSystem changes (only after mount)
  useEffect(() => {
    if (!isMounted) return;
    // Small delay to ensure listeners are set up
    const timer = setTimeout(() => {
      const event = new CustomEvent("unitSystemChanged", {
        detail: unitSystem,
      });
      window.dispatchEvent(event);
    }, 0);
    return () => clearTimeout(timer);
  }, [unitSystem, isMounted]);

  // Before mount, render with no active state to match SSR
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
