"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUnitSystem } from '@/contexts/UnitSystemContext';
import type { UnitSystem } from '@/lib/units';

/**
 * Hook that uses global context when logged in, or local state when logged out
 * For logged-out users, listens to custom events from NavbarUnitToggleLocal
 */
export function useUnitSystemOrLocal() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const globalUnitSystem = useUnitSystem();

  // Local state for logged-out users
  const [localUnitSystem, setLocalUnitSystem] = useState<UnitSystem>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('diveiq:unitSystem');
      if (stored === 'metric' || stored === 'imperial') {
        return stored;
      }
    }
    return 'metric';
  });

  // Listen to custom events from NavbarUnitToggleLocal when logged out
  useEffect(() => {
    if (isAuthenticated || status === 'loading') return;

    const handleUnitSystemChange = (event: CustomEvent<UnitSystem>) => {
      setLocalUnitSystem(event.detail);
    };

    window.addEventListener('unitSystemChanged', handleUnitSystemChange as EventListener);

    return () => {
      window.removeEventListener('unitSystemChanged', handleUnitSystemChange as EventListener);
    };
  }, [isAuthenticated, status]);

  // Return global context when authenticated, local state when logged out
  if (isAuthenticated) {
    return globalUnitSystem;
  }

  return {
    unitSystem: localUnitSystem,
    setUnitSystem: setLocalUnitSystem,
    toggleUnitSystem: () => {
      setLocalUnitSystem((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
    },
  };
}

