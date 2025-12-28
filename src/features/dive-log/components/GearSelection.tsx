"use client";

import { useState, useEffect } from "react";
import type { GearItem } from "@prisma/client";
import formStyles from "@/styles/components/Form.module.css";
import styles from "./GearSelection.module.css";

interface Props {
  selectedGearIds: string[];
  onSelectionChange: (ids: string[]) => void;
  editingEntryId: string | null;
}

export function GearSelection({
  selectedGearIds,
  onSelectionChange,
  editingEntryId,
}: Props) {
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [defaultKitGearIds, setDefaultKitGearIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [gearRes, defaultKitRes] = await Promise.all([
          fetch("/api/gear?includeInactive=false"),
          fetch("/api/gear/default-kit"),
        ]);

        if (gearRes.ok) {
          const gearData = await gearRes.json();
          setGearItems(gearData.items);
        }

        if (defaultKitRes.ok) {
          const kitData = await defaultKitRes.json();
          if (kitData.kit) {
            const kitGearIds = kitData.kit.kitItems.map(
              (ki: any) => ki.gearItemId
            );
            setDefaultKitGearIds(kitGearIds);
            // Pre-populate with default kit if creating new entry (not editing)
            if (!editingEntryId && selectedGearIds.length === 0) {
              onSelectionChange(kitGearIds);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load gear data", err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [editingEntryId, selectedGearIds.length, onSelectionChange]);

  const toggleGearItem = (id: string) => {
    const newSelection = selectedGearIds.includes(id)
      ? selectedGearIds.filter((i) => i !== id)
      : [...selectedGearIds, id];
    onSelectionChange(newSelection);
  };

  const getDisplayName = (item: GearItem): string => {
    return item.nickname || `${item.manufacturer} ${item.model}`;
  };

  if (loading) {
    return (
      <div className={formStyles.field}>
        <label className={formStyles.label}>Gear used</label>
        <p className={styles.loading}>Loading gear...</p>
      </div>
    );
  }

  if (gearItems.length === 0) {
    return (
      <div className={formStyles.field}>
        <label className={formStyles.label}>Gear used</label>
        <p className={styles.emptyState}>
          No gear items yet.{" "}
          <a href="/gear" className={styles.link}>
            Add gear
          </a>{" "}
          to track what you use on dives.
        </p>
      </div>
    );
  }

  return (
    <div className={formStyles.field}>
      <label className={formStyles.label}>Gear used</label>
      <div className={styles.gearList}>
        {gearItems.map((item) => (
          <label
            key={item.id}
            className={`${styles.gearItem} ${
              selectedGearIds.includes(item.id) ? styles.selected : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selectedGearIds.includes(item.id)}
              onChange={() => toggleGearItem(item.id)}
              className={styles.checkbox}
            />
            <div className={styles.gearItemContent}>
              <span className={styles.gearItemName}>{getDisplayName(item)}</span>
              <span className={styles.gearItemType}>{item.type}</span>
            </div>
          </label>
        ))}
      </div>
      {selectedGearIds.length === 0 && (
        <p className={styles.helpText}>
          Select the gear you used on this dive. Your default kit is pre-selected
          if available.
        </p>
      )}
    </div>
  );
}

