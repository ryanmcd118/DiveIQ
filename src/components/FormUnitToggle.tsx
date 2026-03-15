"use client";

import { useUnitSystem } from "@/contexts/UnitSystemContext";
import { UnitToggleButtons } from "./UnitToggleButtons";

/**
 * Form-level unit toggle positioned at the top of forms.
 * Uses the global UnitSystemContext — works for both authenticated and guest users.
 */
export function FormUnitToggle() {
  const { unitSystem, setUnitSystem } = useUnitSystem();

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
        <UnitToggleButtons unitSystem={unitSystem} onChange={setUnitSystem} />
      </div>
    </div>
  );
}
