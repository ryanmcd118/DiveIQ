"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GearItem } from "@prisma/client";
import { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import { MaintenanceDueSection } from "./MaintenanceDueSection";
import { KitsSection } from "./KitsSection";
import { GearListSection } from "./GearListSection";
import { GearFormModal } from "./GearFormModal";
import { KitFormModal } from "./KitFormModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Toast } from "@/components/Toast";
import layoutStyles from "@/styles/components/Layout.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./GearPageContent.module.css";

export function GearPageContent() {
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [kits, setKits] = useState<GearKitWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGearForm, setShowGearForm] = useState(false);
  const [showKitForm, setShowKitForm] = useState(false);
  const [editingGear, setEditingGear] = useState<GearItem | null>(null);
  const [editingKit, setEditingKit] = useState<GearKitWithItems | null>(null);
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "gear" | "kit" } | null>(null);
  const [archivedGearId, setArchivedGearId] = useState<string | null>(null);
  const [autoExpandArchived, setAutoExpandArchived] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState<{
    itemId: string;
    kitIds: string[];
  } | null>(null);
  const [highlightedGearId, setHighlightedGearId] = useState<string | null>(null);
  const gearCardRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const loadData = async (showLoading = true) => {
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
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleGearCreated = () => {
    setShowGearForm(false);
    setEditingGear(null);
    setToast({ message: "Gear added" });
    void loadData();
  };

  const handleGearUpdated = () => {
    setShowGearForm(false);
    setEditingGear(null);
    void loadData();
  };

  const handleKitCreated = () => {
    setShowKitForm(false);
    setEditingKit(null);
    setToast({ message: "Kit created" });
    void loadData();
  };

  const handleKitUpdated = () => {
    setShowKitForm(false);
    setEditingKit(null);
    void loadData();
  };

  const handleEditGear = (item: GearItem) => {
    setEditingGear(item);
    setShowGearForm(true);
  };

  const handleEditKit = (kit: GearKitWithItems) => {
    setEditingKit(kit);
    setShowKitForm(true);
  };

  const handleDeleteGear = (id: string) => {
    setDeleteConfirm({ id, type: "gear" });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const endpoint = deleteConfirm.type === "gear" ? "/api/gear" : "/api/gear-kits";
      const res = await fetch(`${endpoint}?id=${deleteConfirm.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      setDeleteConfirm(null);
      setToast({ message: deleteConfirm.type === "gear" ? "Gear deleted" : "Kit deleted" });
      void loadData();
    } catch (err) {
      console.error(err);
      setDeleteConfirm(null);
      alert(`Failed to delete ${deleteConfirm.type}`);
    }
  };

  // Robust kit-membership lookup (NO stale closures)
  const kitsContainingItem = (itemId: string) =>
    kits.filter((k) => k.kitItems?.some((ki) => ki.gearItemId === itemId));

  const handleArchiveGear = (itemId: string) => {
    // Look up the item from current state
    const item = gearItems.find((g) => g.id === itemId);
    
    // Hard debug logs
    console.log("[toggleArchive] clicked", itemId, "found?", !!item, "isActive?", item?.isActive);
    
    if (!item) {
      console.warn("[toggleArchive] item not found in gearItems", itemId);
      return;
    }

    // Decide archive vs unarchive based on current state
    if (item.isActive === true) {
      // ARCHIVE action
      const affected = kitsContainingItem(itemId);
      
      if (affected.length > 0) {
        // Item is in kits - show confirmation modal
        setArchiveConfirm({
          itemId,
          kitIds: affected.map((k) => k.id),
        });
        return;
      } else {
        // Item not in kits - archive immediately
        void performArchive(itemId, []);
      }
    } else {
      // UNARCHIVE action
      void performUnarchive(itemId);
    }
  };

  const performUnarchive = async (itemId: string) => {
    // Optimistic: setGearItems -> mark isActive true
    setGearItems((prev) =>
      prev.map((g) => (g.id === itemId ? { ...g, isActive: true } : g))
    );

    try {
      // await API: update gear item isActive true
      const res = await fetch("/api/gear", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, isActive: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      setToast({ message: "Gear unarchived" });
      // loadData(false)
      await loadData(false);
    } catch (err) {
      console.error(err);
      // Revert optimistic update on error
      setGearItems((prev) =>
        prev.map((g) => (g.id === itemId ? { ...g, isActive: false } : g))
      );
      alert("Failed to unarchive gear item");
    }
  };

  const performArchive = async (itemId: string, kitIds: string[]) => {
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
                prev.map((g) => (g.id === itemId ? { ...g, isActive: true } : g))
              );
              void loadData(false);
            }
          } catch (err) {
            console.error(err);
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
      alert("Failed to archive gear item");
    }
  };

  const confirmArchive = async () => {
    if (!archiveConfirm) return;
    const { itemId, kitIds } = archiveConfirm;
    setArchiveConfirm(null);
    await performArchive(itemId, kitIds);
  };

  const handleDeleteKit = (id: string) => {
    setDeleteConfirm({ id, type: "kit" });
  };

  const handleJumpToGear = useCallback((gearId: string) => {
    const cardElement = gearCardRefs.current.get(gearId);
    if (cardElement) {
      cardElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setHighlightedGearId(gearId);
      setTimeout(() => {
        setHighlightedGearId(null);
      }, 1500);
    }
  }, []);

  const handleSetDefaultKit = async (id: string) => {
    try {
      const res = await fetch("/api/gear-kits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      void loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to set default kit");
    }
  };

  return (
    <main className={layoutStyles.page}>
      <div className={layoutStyles.pageContent}>
        <header className={layoutStyles.pageHeader}>
          <div>
            <h1 className={layoutStyles.pageTitle}>Gear</h1>
          </div>
          <div className={layoutStyles.headerActions}>
            <button
              onClick={() => {
                setEditingGear(null);
                setShowGearForm(true);
              }}
              className={buttonStyles.primaryGradient}
            >
              Add gear
            </button>
            <button
              onClick={() => {
                setEditingKit(null);
                setShowKitForm(true);
              }}
              className={buttonStyles.secondaryGradient}
            >
              Create kit
            </button>
          </div>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <MaintenanceDueSection
              gearItems={gearItems}
              onJumpToGear={handleJumpToGear}
            />

            <KitsSection
              kits={kits}
              gearItems={gearItems}
              onEditKit={handleEditKit}
              onDeleteKit={handleDeleteKit}
              onSetDefaultKit={handleSetDefaultKit}
              onCreateKit={() => {
                setEditingKit(null);
                setShowKitForm(true);
              }}
            />

            <GearListSection
              gearItems={gearItems}
              kits={kits}
              onEditGear={handleEditGear}
              onDeleteGear={handleDeleteGear}
              onArchiveGear={handleArchiveGear}
              onRefresh={loadData}
              autoExpandArchived={autoExpandArchived}
              onAutoExpandArchivedComplete={() => setAutoExpandArchived(false)}
              onAddGear={() => {
                setEditingGear(null);
                setShowGearForm(true);
              }}
              highlightedGearId={highlightedGearId}
              gearCardRefs={gearCardRefs}
            />
          </>
        )}

        {showGearForm && (
          <GearFormModal
            isOpen={showGearForm}
            onClose={() => {
              setShowGearForm(false);
              setEditingGear(null);
            }}
            onSave={editingGear ? handleGearUpdated : handleGearCreated}
            editingGear={editingGear}
            kits={kits}
          />
        )}

        {showKitForm && (
          <KitFormModal
            isOpen={showKitForm}
            onClose={() => {
              setShowKitForm(false);
              setEditingKit(null);
            }}
            onSave={editingKit ? handleKitUpdated : handleKitCreated}
            editingKit={editingKit}
            availableGearItems={gearItems}
          />
        )}

        {deleteConfirm && (
          <ConfirmModal
            isOpen={true}
            title={`Delete ${deleteConfirm.type}?`}
            message={
              deleteConfirm.type === "gear"
                ? "This permanently removes this item. This cannot be undone."
                : "This permanently removes this kit. This cannot be undone."
            }
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}

        {archiveConfirm && (
          <ConfirmModal
            isOpen={true}
            title="Archive gear?"
            message={
              <>
                This item will be removed from the following saved kits:
                <ul style={{ marginTop: "1rem", marginBottom: 0, paddingLeft: "1.5rem" }}>
                  {kits
                    .filter((k) => archiveConfirm.kitIds.includes(k.id))
                    .map((kit) => (
                      <li key={kit.id} style={{ marginTop: "0.5rem" }}>
                        {kit.name}
                        {kit.isDefault && (
                          <span
                            style={{
                              marginLeft: "0.5rem",
                              fontSize: "0.75rem",
                              color: "var(--color-accent-light)",
                              background: "rgba(6, 182, 212, 0.2)",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "9999px",
                            }}
                          >
                            (Default)
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </>
            }
            confirmLabel="Yes, archive this item"
            onConfirm={confirmArchive}
            onCancel={() => setArchiveConfirm(null)}
          />
        )}

        {toast && (
          <Toast
            message={toast.message}
            onUndo={toast.onUndo}
            onClose={() => setToast(null)}
            duration={toast.onUndo ? 5000 : 3000}
          />
        )}
      </div>
    </main>
  );
}

