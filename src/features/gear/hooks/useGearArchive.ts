"use client";

import { useState, useCallback } from "react";
import type { GearItem } from "@prisma/client";
import type { GearKitWithItems } from "@/services/database/repositories/gearRepository";

interface UseGearArchiveParams {
  gearItems: GearItem[];
  setGearItems: React.Dispatch<React.SetStateAction<GearItem[]>>;
  kits: GearKitWithItems[];
  setKits: React.Dispatch<React.SetStateAction<GearKitWithItems[]>>;
  loadData: (showLoading?: boolean) => Promise<void>;
  setToast: (toast: { message: string; onUndo?: () => void } | null) => void;
}

export function useGearArchive({
  gearItems,
  setGearItems,
  kits,
  setKits,
  loadData,
  setToast,
}: UseGearArchiveParams) {
  const [archivedGearId, setArchivedGearId] = useState<string | null>(null);
  void archivedGearId;
  const [autoExpandArchived, setAutoExpandArchived] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState<{
    itemId: string;
    kitIds: string[];
  } | null>(null);

  // Robust kit-membership lookup (NO stale closures)
  const kitsContainingItem = useCallback(
    (itemId: string) =>
      kits.filter((k) => k.kitItems?.some((ki) => ki.gearItemId === itemId)),
    [kits]
  );

  const performUnarchive = useCallback(
    async (itemId: string) => {
      // Optimistic: setGearItems -> mark isActive true
      setGearItems((prev) =>
        prev.map((g) => (g.id === itemId ? { ...g, isActive: true } : g))
      );

      try {
        const res = await fetch("/api/gear", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: itemId, isActive: true }),
        });

        if (!res.ok) {
          throw new Error("Failed to update");
        }

        setToast({ message: "Gear unarchived" });
        await loadData(false);
      } catch (err) {
        console.error(err);
        // Revert optimistic update on error
        setGearItems((prev) =>
          prev.map((g) => (g.id === itemId ? { ...g, isActive: false } : g))
        );
        setToast({ message: "Failed to unarchive gear item" });
      }
    },
    [setGearItems, loadData, setToast]
  );

  const performArchive = useCallback(
    async (itemId: string, kitIds: string[]) => {
      // (1) Optimistic: setGearItems -> mark isActive false
      setGearItems((prev) =>
        prev.map((g) => (g.id === itemId ? { ...g, isActive: false } : g))
      );

      // (2) Optimistic: setKits -> remove kitItems with that gearItemId for those kitIds
      if (kitIds.length > 0) {
        setKits((prev) =>
          prev.map((k) => {
            if (!kitIds.includes(k.id)) return k;
            return {
              ...k,
              kitItems: (k.kitItems ?? []).filter(
                (ki) => ki.gearItemId !== itemId
              ),
            };
          })
        );
      }

      // Auto-expand archived section
      setAutoExpandArchived(true);

      try {
        // (3) await API: update gear item isActive false
        const res = await fetch("/api/gear", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: itemId, isActive: false }),
        });

        if (!res.ok) {
          throw new Error("Failed to archive gear");
        }

        // (4) await API: for each kitId, persist updated kitItems list
        if (kitIds.length > 0) {
          const kitUpdatePromises = kitIds.map(async (kitId) => {
            const kit = kits.find((k) => k.id === kitId);
            if (!kit) return;

            const updatedGearIds = (kit.kitItems ?? [])
              .filter((ki) => ki.gearItemId !== itemId)
              .map((ki) => ki.gearItemId);

            const updateRes = await fetch("/api/gear-kits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "updateItems",
                id: kitId,
                gearItemIds: updatedGearIds,
              }),
            });

            if (!updateRes.ok) {
              throw new Error(`Failed to remove from kit: ${kit.name}`);
            }
          });

          const results = await Promise.allSettled(kitUpdatePromises);
          const failures = results.filter((r) => r.status === "rejected");

          if (failures.length > 0) {
            setToast({
              message: `Gear archived, but couldn't remove from ${failures.length} kit${failures.length > 1 ? "s" : ""}.`,
            });
          }
        }

        // Show success toast
        setArchivedGearId(itemId);
        setToast({
          message: "Gear archived",
          onUndo: async () => {
            try {
              const undoRes = await fetch("/api/gear", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: itemId, isActive: true }),
              });

              if (undoRes.ok) {
                setArchivedGearId(null);
                setToast(null);
                // Optimistically revert
                setGearItems((prev) =>
                  prev.map((g) =>
                    g.id === itemId ? { ...g, isActive: true } : g
                  )
                );
                void loadData(false);
              }
            } catch (err) {
              console.error(err);
              setToast({ message: "Failed to undo archive" });
            }
          },
        });

        // (5) loadData(false)
        await loadData(false);
      } catch (err) {
        console.error(err);
        // Revert optimistic updates on error
        setGearItems((prev) =>
          prev.map((g) => (g.id === itemId ? { ...g, isActive: true } : g))
        );
        if (kitIds.length > 0) {
          void loadData(false);
        }
        setToast({ message: "Failed to archive gear item" });
      }
    },
    [setGearItems, setKits, kits, loadData, setToast]
  );

  const handleArchiveGear = useCallback(
    (itemId: string) => {
      const item = gearItems.find((g) => g.id === itemId);

      console.log(
        "[toggleArchive] clicked",
        itemId,
        "found?",
        !!item,
        "isActive?",
        item?.isActive
      );

      if (!item) {
        console.warn("[toggleArchive] item not found in gearItems", itemId);
        return;
      }

      if (item.isActive === true) {
        // ARCHIVE action
        const affected = kitsContainingItem(itemId);

        if (affected.length > 0) {
          setArchiveConfirm({
            itemId,
            kitIds: affected.map((k) => k.id),
          });
          return;
        } else {
          void performArchive(itemId, []);
        }
      } else {
        // UNARCHIVE action
        void performUnarchive(itemId);
      }
    },
    [gearItems, kitsContainingItem, performArchive, performUnarchive]
  );

  const confirmArchive = useCallback(async () => {
    if (!archiveConfirm) return;
    const { itemId, kitIds } = archiveConfirm;
    setArchiveConfirm(null);
    await performArchive(itemId, kitIds);
  }, [archiveConfirm, performArchive]);

  return {
    archiveConfirm,
    setArchiveConfirm,
    autoExpandArchived,
    setAutoExpandArchived,
    handleArchiveGear,
    confirmArchive,
  };
}
