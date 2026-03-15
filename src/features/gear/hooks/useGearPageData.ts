"use client";

import { useState, useEffect, useCallback } from "react";
import type { GearItem } from "@prisma/client";
import type { GearKitWithItems } from "@/services/database/repositories/gearRepository";

export function useGearPageData() {
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [kits, setKits] = useState<GearKitWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      // Always load all gear (active + inactive) so we can split them
      const [gearRes, kitsRes] = await Promise.all([
        fetch("/api/gear?includeInactive=true"),
        fetch("/api/gear-kits"),
      ]);

      if (!gearRes.ok || !kitsRes.ok) {
        throw new Error("Failed to load data");
      }

      const gearData = await gearRes.json();
      const kitsData = await kitsRes.json();

      setGearItems(gearData.items);
      setKits(kitsData.kits);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load gear data");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const deleteGearOrKit = useCallback(
    async (id: string, type: "gear" | "kit") => {
      const endpoint = type === "gear" ? "/api/gear" : "/api/gear-kits";
      const res = await fetch(`${endpoint}?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Failed to delete ${type}`);
      }

      void loadData();
    },
    [loadData]
  );

  const setDefaultKit = useCallback(
    async (id: string) => {
      const res = await fetch("/api/gear-kits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to set default kit");
      }

      void loadData();
    },
    [loadData]
  );

  return {
    gearItems,
    setGearItems,
    kits,
    setKits,
    loading,
    error,
    loadData,
    deleteGearOrKit,
    setDefaultKit,
  };
}
