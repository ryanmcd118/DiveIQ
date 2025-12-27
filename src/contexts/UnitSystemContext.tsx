"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UnitSystem } from '@/lib/units';

interface UnitSystemContextType {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnitSystem: () => void;
}

const UnitSystemContext = createContext<UnitSystemContextType | undefined>(undefined);

const STORAGE_KEY = 'diveiq-unit-system';

export function UnitSystemProvider({ children }: { children: ReactNode }) {
  // Default to metric
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    // Try to load from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'metric' || stored === 'imperial') {
        return stored;
      }
    }
    return 'metric';
  });

  // Persist to localStorage when unitSystem changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, unitSystem);
    }
  }, [unitSystem]);

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
  };

  const toggleUnitSystem = () => {
    setUnitSystemState((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
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
    throw new Error('useUnitSystem must be used within a UnitSystemProvider');
  }
  return context;
}

