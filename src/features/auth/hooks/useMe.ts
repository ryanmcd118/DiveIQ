"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface MeData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  image: string | null;
}

export function useMe() {
  const { data: session, status } = useSession();
  const [me, setMe] = useState<MeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setIsLoading(false);
      setMe(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/me");
      if (!response.ok) {
        if (response.status === 401) {
          setMe(null);
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();
      setMe(data);
    } catch (err) {
      console.error("[useMe] Error fetching /api/me:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user data"
      );
      setMe(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status]);

  // Fetch on mount and when session becomes available
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Listen for custom event to refresh
  useEffect(() => {
    const handleRefresh = () => {
      fetchMe();
    };

    window.addEventListener("diveiq:me-updated", handleRefresh);
    return () => {
      window.removeEventListener("diveiq:me-updated", handleRefresh);
    };
  }, [fetchMe]);

  const refreshMe = useCallback(() => {
    fetchMe();
  }, [fetchMe]);

  return {
    me,
    isLoading,
    error,
    refreshMe,
  };
}
