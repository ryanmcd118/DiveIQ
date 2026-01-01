"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { UnitSystem } from "@/lib/units";

interface UnitSystemContextType {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnitSystem: () => void;
}

const UnitSystemContext = createContext<UnitSystemContextType | undefined>(
  undefined
);

const STORAGE_KEY = "diveiq:unitSystem";

export function UnitSystemProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available (client-side only)
  // On SSR, window is undefined so this returns "metric" for consistency
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "metric" || stored === "imperial") {
        return stored;
      }
    }
    return "metric";
  });

  // Persist to localStorage when unitSystem changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, unitSystem);
    }
  }, [unitSystem]);

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
  };

  const toggleUnitSystem = () => {
    setUnitSystemState((prev) => (prev === "metric" ? "imperial" : "metric"));
  };

  return (
    <UnitSystemContext.Provider
      value={{
        unitSystem,
        setUnitSystem,
        toggleUnitSystem,
      }}
    >
      {children}
    </UnitSystemContext.Provider>
  );
}

export function useUnitSystem() {
  const context = useContext(UnitSystemContext);
  if (context === undefined) {
    throw new Error("useUnitSystem must be used within a UnitSystemProvider");
  }
  return context;
}
