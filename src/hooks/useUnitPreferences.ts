"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useMe } from "@/features/auth/hooks/useMe";
import { useUnitSystem } from "@/contexts/UnitSystemContext";
import {
  DEFAULT_UNIT_PREFERENCES,
  unitSystemToPreferences,
  preferencesToUnitSystem,
  type UnitPreferences,
} from "@/lib/units";

type UnitPreferencesMode = "auto" | "guest" | "authed";

interface UseUnitPreferencesOptions {
  mode?: UnitPreferencesMode;
}

/**
 * Hook that provides unified unit preferences for both authenticated and guest users
 * - Authenticated: loads from API, persists to DB
 * - Guest: syncs from UnitSystemContext (which persists to localStorage)
 *
 * @param options.mode - 'auto' (default): detect from session, 'guest': force guest mode, 'authed': force authenticated mode
 */
export function useUnitPreferences(options?: UseUnitPreferencesOptions) {
  const mode = options?.mode ?? "auto";
  const { status } = useSession();
  const { isLoading: meLoading } = useMe();
  const { unitSystem: contextUnitSystem, setUnitSystem: setContextUnitSystem } =
    useUnitSystem();

  // Determine if we should use authenticated mode
  const isAuthenticated =
    mode === "authed" || (mode === "auto" && status === "authenticated");
  const isGuestMode =
    mode === "guest" ||
    (mode === "auto" && status !== "authenticated" && status !== "loading");

  // State for preferences
  const [preferences, setPreferencesState] = useState<UnitPreferences>(
    DEFAULT_UNIT_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences for authenticated users
  useEffect(() => {
    if (!isAuthenticated || meLoading) {
      if (!isAuthenticated && mode !== "auto") {
        setIsLoading(false);
      }
      return;
    }

    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const data = await response.json();
          setPreferencesState(data.preferences || DEFAULT_UNIT_PREFERENCES);
        } else {
          // Fallback to defaults if API fails
          setPreferencesState(DEFAULT_UNIT_PREFERENCES);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        setPreferencesState(DEFAULT_UNIT_PREFERENCES);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPreferences();
  }, [isAuthenticated, meLoading, mode]);

  // Sync preferences from UnitSystemContext for guest users
  useEffect(() => {
    if (!isGuestMode) return;

    setPreferencesState(unitSystemToPreferences(contextUnitSystem));
    setIsLoading(false);
  }, [isGuestMode, contextUnitSystem]);

  // Update preferences (different behavior for authenticated vs guest)
  const setPrefs = useCallback(
    async (partial: Partial<UnitPreferences>) => {
      const newPrefs = { ...preferences, ...partial };
      setPreferencesState(newPrefs);

      if (isAuthenticated) {
        // Persist to DB via API
        try {
          const response = await fetch("/api/user/preferences", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newPrefs),
          });

          if (!response.ok) {
            console.error("Failed to save preferences");
            // Revert on error
            setPreferencesState(preferences);
          }
        } catch (error) {
          console.error("Error saving preferences:", error);
          // Revert on error
          setPreferencesState(preferences);
        }
      } else if (isGuestMode) {
        // Update UnitSystemContext — it persists to localStorage automatically
        setContextUnitSystem(preferencesToUnitSystem(newPrefs));
      }
    },
    [preferences, isAuthenticated, isGuestMode, setContextUnitSystem]
  );

  return {
    prefs: preferences,
    setPrefs,
    isLoading,
  };
}
