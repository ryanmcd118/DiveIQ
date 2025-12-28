"use client";

import { useState, useEffect } from "react";
import type { GearItem, GearKit } from "@prisma/client";
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
  const [hideArchived, setHideArchived] = useState(true);
  const [autoExpandInactive, setAutoExpandInactive] = useState(false);

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

  const handleArchiveGear = async (id: string, isActive: boolean) => {
    const wasActive = isActive;
    const previousActiveState = !isActive;

    // Optimistically update local state
    setGearItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, isActive } : item
      )
    );

    // If archiving, ensure archived section is visible
    if (wasActive) {
      setHideArchived(false);
      setAutoExpandInactive(true);
    }

    try {
      const res = await fetch("/api/gear", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      if (!wasActive) {
        // Unarchiving - just show success
        setToast({ message: "Gear unarchived" });
        // Refresh data in background without scroll jump
        void loadData(false);
      } else {
        // Archiving - show undo toast
        setArchivedGearId(id);
        setToast({
          message: "Gear archived",
          onUndo: async () => {
            try {
              const undoRes = await fetch("/api/gear", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isActive: previousActiveState }),
              });

              if (undoRes.ok) {
                setArchivedGearId(null);
                setToast(null);
                // Optimistically revert
                setGearItems((prevItems) =>
                  prevItems.map((item) =>
                    item.id === id ? { ...item, isActive: previousActiveState } : item
                  )
                );
                // Refresh in background
                void loadData(false);
              }
            } catch (err) {
              console.error(err);
            }
          },
        });
        // Refresh data in background without scroll jump
        void loadData(false);
      }
    } catch (err) {
      console.error(err);
      // Revert optimistic update on error
      setGearItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, isActive: previousActiveState } : item
        )
      );
      alert("Failed to update gear item");
    }
  };

  const handleDeleteKit = (id: string) => {
    setDeleteConfirm({ id, type: "kit" });
  };

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
              className={buttonStyles.secondary}
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
              onEditGear={handleEditGear}
            />

            <KitsSection
              kits={kits}
              onEditKit={handleEditKit}
              onDeleteKit={handleDeleteKit}
              onSetDefaultKit={handleSetDefaultKit}
            />

            <GearListSection
              gearItems={gearItems}
              kits={kits}
              onEditGear={handleEditGear}
              onDeleteGear={handleDeleteGear}
              onArchiveGear={handleArchiveGear}
              onRefresh={loadData}
              hideArchived={hideArchived}
              onHideArchivedChange={setHideArchived}
              autoExpandInactive={autoExpandInactive}
              onAutoExpandInactiveComplete={() => setAutoExpandInactive(false)}
              onAddGear={() => {
                setEditingGear(null);
                setShowGearForm(true);
              }}
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

