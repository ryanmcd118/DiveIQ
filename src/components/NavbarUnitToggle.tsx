"use client";

import { useUnitSystem } from "@/contexts/UnitSystemContext";
import { UnitToggleButtons } from "./UnitToggleButtons";

/**
 * Compact unit toggle for the navbar.
 * Works for both authenticated and unauthenticated users —
 * UnitSystemProvider wraps the entire app.
 */
export function NavbarUnitToggle() {
  const { unitSystem, setUnitSystem } = useUnitSystem();

  return <UnitToggleButtons unitSystem={unitSystem} onChange={setUnitSystem} />;
}
