"use client";

import { useState, useEffect } from "react";
import type { GearItem, GearKitItem } from "@prisma/client";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./GearSelection.module.css";

interface Props {
  selectedGearIds: string[];
  onSelectionChange: (ids: string[]) => void; // REQUIRED - must be a function
  editingEntryId?: string | null;
}

export function GearSelection({
  selectedGearIds = [],
  onSelectionChange,
  editingEntryId = null,
}: Props) {
  // Ensure selectedGearIds is always an array
  const selectedGearIdsSafe = selectedGearIds ?? [];
  
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
              (ki: GearKitItem) => ki.gearItemId
            );
            setDefaultKitGearIds(kitGearIds);
            // No auto-prefill - user must explicitly click "Use default kit" button
          }
        }
      } catch (err) {
        console.error("Failed to load gear data", err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [editingEntryId, onSelectionChange]);

  const toggleGearItem = (id: string) => {
    if (typeof onSelectionChange !== 'function') {
      console.error('GearSelection: onSelectionChange is not a function');
      return;
    }
    const newSelection = selectedGearIdsSafe.includes(id)
      ? selectedGearIdsSafe.filter((i) => i !== id)
      : [...selectedGearIdsSafe, id];
    onSelectionChange(newSelection);
  };

  const handleUseDefaultKit = () => {
    if (typeof onSelectionChange !== 'function') {
      console.error('GearSelection: onSelectionChange is not a function');
      return;
    }
    if (defaultKitGearIds.length > 0) {
      onSelectionChange(defaultKitGearIds);
    }
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
              selectedGearIdsSafe.includes(item.id) ? styles.selected : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selectedGearIdsSafe.includes(item.id)}
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
      {selectedGearIdsSafe.length === 0 && defaultKitGearIds.length > 0 && (
        <div className={styles.defaultKitCta}>
          <button
            type="button"
            onClick={handleUseDefaultKit}
            className={buttonStyles.ghost}
          >
            Use default kit
          </button>
        </div>
      )}
      {selectedGearIdsSafe.length === 0 && defaultKitGearIds.length === 0 && (
        <p className={styles.helpText}>
          Select the gear you used on this dive.
        </p>
      )}
    </div>
  );
}

