"use client";

import { useState, useEffect } from "react";
import type { GearItem, GearKit } from "@prisma/client";
import { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import { MaintenanceDueSection } from "./MaintenanceDueSection";
import { KitsSection } from "./KitsSection";
import { GearListSection } from "./GearListSection";
import { GearFormModal } from "./GearFormModal";
import { KitFormModal } from "./KitFormModal";
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [gearRes, kitsRes] = await Promise.all([
        fetch("/api/gear?includeInactive=false"),
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
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleGearCreated = () => {
    setShowGearForm(false);
    setEditingGear(null);
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

  const handleDeleteGear = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gear item?")) {
      return;
    }

    try {
      const res = await fetch(`/api/gear?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      void loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete gear item");
    }
  };

  const handleArchiveGear = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/gear", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      void loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to update gear item");
    }
  };

  const handleDeleteKit = async (id: string) => {
    if (!confirm("Are you sure you want to delete this kit?")) {
      return;
    }

    try {
      const res = await fetch(`/api/gear-kits?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      void loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete kit");
    }
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
              onEditGear={handleEditGear}
              onDeleteGear={handleDeleteGear}
              onArchiveGear={handleArchiveGear}
              onRefresh={loadData}
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
      </div>
    </main>
  );
}

