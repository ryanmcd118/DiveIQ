"use client";

import { useState, useRef, useCallback } from "react";
import type { GearItem } from "@prisma/client";
import { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import { useGearPageData } from "../hooks/useGearPageData";
import { useGearArchive } from "../hooks/useGearArchive";
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
  const {
    gearItems,
    setGearItems,
    kits,
    setKits,
    loading,
    error,
    loadData,
    deleteGearOrKit,
    setDefaultKit,
  } = useGearPageData();

  const [showGearForm, setShowGearForm] = useState(false);
  const [showKitForm, setShowKitForm] = useState(false);
  const [editingGear, setEditingGear] = useState<GearItem | null>(null);
  const [editingKit, setEditingKit] = useState<GearKitWithItems | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    onUndo?: () => void;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: "gear" | "kit";
  } | null>(null);
  const [highlightedGearId, setHighlightedGearId] = useState<string | null>(
    null
  );
  const gearCardRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const {
    archiveConfirm,
    setArchiveConfirm,
    autoExpandArchived,
    setAutoExpandArchived,
    handleArchiveGear,
    confirmArchive,
  } = useGearArchive({
    gearItems,
    setGearItems,
    kits,
    setKits,
    loadData,
    setToast,
  });

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

  const handleDeleteKit = (id: string) => {
    setDeleteConfirm({ id, type: "kit" });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteGearOrKit(deleteConfirm.id, deleteConfirm.type);
      setDeleteConfirm(null);
      setToast({
        message: deleteConfirm.type === "gear" ? "Gear deleted" : "Kit deleted",
      });
    } catch (err) {
      console.error(err);
      setDeleteConfirm(null);
      alert(`Failed to delete ${deleteConfirm.type}`);
    }
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
      await setDefaultKit(id);
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
                <ul
                  style={{
                    marginTop: "1rem",
                    marginBottom: 0,
                    paddingLeft: "1.5rem",
                  }}
                >
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
