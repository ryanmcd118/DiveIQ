"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useMe } from '@/features/auth/hooks/useMe';
import {
  DEFAULT_UNIT_PREFERENCES,
  unitSystemToPreferences,
  preferencesToUnitSystem,
  type UnitPreferences,
  type UnitSystem,
} from '@/lib/units';

const STORAGE_KEY = 'diveiq:unitSystem';

type UnitPreferencesMode = 'auto' | 'guest' | 'authed';

interface UseUnitPreferencesOptions {
  mode?: UnitPreferencesMode;
}

/**
 * Hook that provides unified unit preferences for both authenticated and guest users
 * - Authenticated: loads from API, persists to DB
 * - Guest: loads from localStorage, persists to localStorage
 * 
 * @param options.mode - 'auto' (default): detect from session, 'guest': force guest mode, 'authed': force authenticated mode
 */
export function useUnitPreferences(options?: UseUnitPreferencesOptions) {
  const mode = options?.mode ?? 'auto';
  const { data: session, status } = useSession();
  const { me, isLoading: meLoading } = useMe();
  
  // Determine if we should use authenticated mode
  const isAuthenticated = mode === 'authed' || (mode === 'auto' && status === 'authenticated');
  const isGuestMode = mode === 'guest' || (mode === 'auto' && status !== 'authenticated' && status !== 'loading');

  // State for preferences
  const [preferences, setPreferencesState] = useState<UnitPreferences>(DEFAULT_UNIT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences for authenticated users
  useEffect(() => {
    if (!isAuthenticated || meLoading) {
      if (!isAuthenticated && mode !== 'auto') {
        setIsLoading(false);
      }
      return;
    }

    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferencesState(data.preferences || DEFAULT_UNIT_PREFERENCES);
        } else {
          // Fallback to defaults if API fails
          setPreferencesState(DEFAULT_UNIT_PREFERENCES);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setPreferencesState(DEFAULT_UNIT_PREFERENCES);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPreferences();
  }, [isAuthenticated, meLoading, mode]);

  // Load preferences for guest users from localStorage
  useEffect(() => {
    if (!isGuestMode) return;

    const loadGuestPreferences = () => {
      if (typeof window === 'undefined') return;

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'metric' || stored === 'imperial') {
        setPreferencesState(unitSystemToPreferences(stored));
      } else {
        setPreferencesState(DEFAULT_UNIT_PREFERENCES);
      }
      setIsLoading(false);
    };

    loadGuestPreferences();

    // Listen to custom events from guest toggles
    const handleUnitSystemChange = (event: CustomEvent<UnitSystem>) => {
      setPreferencesState(unitSystemToPreferences(event.detail));
    };

    window.addEventListener('unitSystemChanged', handleUnitSystemChange as EventListener);

    return () => {
      window.removeEventListener('unitSystemChanged', handleUnitSystemChange as EventListener);
    };
  }, [isGuestMode]);

  // Update preferences (different behavior for authenticated vs guest)
  const setPrefs = useCallback(async (partial: Partial<UnitPreferences>) => {
    const newPrefs = { ...preferences, ...partial };
    setPreferencesState(newPrefs);

    if (isAuthenticated) {
      // Persist to DB via API
      try {
        const response = await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPrefs),
        });

        if (!response.ok) {
          console.error('Failed to save preferences');
          // Revert on error
          setPreferencesState(preferences);
        }
      } catch (error) {
        console.error('Error saving preferences:', error);
        // Revert on error
        setPreferencesState(preferences);
      }
    } else if (isGuestMode) {
      // Persist to localStorage and dispatch event for guest users
      if (typeof window !== 'undefined') {
        const unitSystem = preferencesToUnitSystem(newPrefs);
        localStorage.setItem(STORAGE_KEY, unitSystem);
        const event = new CustomEvent('unitSystemChanged', { detail: unitSystem });
        window.dispatchEvent(event);
      }
    }
  }, [preferences, isAuthenticated, isGuestMode]);

  return {
    prefs: preferences,
    setPrefs,
    isLoading,
  };
}

