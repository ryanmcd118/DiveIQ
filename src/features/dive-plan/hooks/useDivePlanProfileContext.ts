import { useState, useEffect } from "react";
import type { ProfileContext } from "@/features/dive-plan/types";

export function useDivePlanProfileContext() {
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(
    null
  );
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dive-plans/profile-context")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data: ProfileContext) => setProfileContext(data))
      .catch((err) => {
        console.error("GET /api/dive-plans/profile-context error", err);
        setProfileError("Failed to load profile context.");
      })
      .finally(() => setProfileLoading(false));
  }, []);

  return { profileContext, profileLoading, profileError };
}
