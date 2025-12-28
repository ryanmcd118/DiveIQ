"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UnitSystem } from '@/lib/units';

interface UnitSystemContextType {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnitSystem: () => void;
  isMounted: boolean;
}

const UnitSystemContext = createContext<UnitSystemContextType | undefined>(undefined);

const STORAGE_KEY = 'diveiq:unitSystem';

export function UnitSystemProvider({ children }: { children: ReactNode }) {
  // Always start with 'metric' for SSR/client consistency
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>('metric');
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'metric' || stored === 'imperial') {
      setUnitSystemState(stored);
    }
  }, []);

  // Persist to localStorage when unitSystem changes (only after mount)
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, unitSystem);
    }
  }, [unitSystem, isMounted]);

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
        isMounted,
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

