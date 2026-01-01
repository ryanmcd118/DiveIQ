"use client";

import { useState, useEffect, FormEvent } from "react";
import type { GearItem } from "@prisma/client";
import { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import { formatGearTypeLabel, GearType } from "../constants";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./KitFormModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingKit: GearKitWithItems | null;
  availableGearItems: GearItem[];
}

export function KitFormModal({
  isOpen,
  onClose,
  onSave,
  editingKit,
  availableGearItems,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>([]);

  // Initialize form
  useEffect(() => {
    if (editingKit) {
      setName(editingKit.name);
      setIsDefault(editingKit.isDefault);
      setSelectedGearIds(editingKit.kitItems.map((ki) => ki.gearItemId));
    } else {
      setName("");
      setIsDefault(false);
      setSelectedGearIds([]);
    }
  }, [editingKit, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleGearItem = (id: string) => {
    setSelectedGearIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingKit) {
        // Update kit
        const updateRes = await fetch("/api/gear-kits", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingKit.id,
            name,
            isDefault,
          }),
        });

        if (!updateRes.ok) {
          throw new Error("Failed to update kit");
        }

        // Update items
        const itemsRes = await fetch("/api/gear-kits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateItems",
            id: editingKit.id,
            gearItemIds: selectedGearIds,
          }),
        });

        if (!itemsRes.ok) {
          throw new Error("Failed to update kit items");
        }
      } else {
        // Create kit
        const res = await fetch("/api/gear-kits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            name,
            isDefault,
            gearItemIds: selectedGearIds,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create kit");
        }
      }

      onSave();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save kit");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeGearItems = availableGearItems.filter((item) => item.isActive);

  const getPrimaryTitle = (item: GearItem): string => {
    // Priority: manufacturer + model > manufacturer alone > model alone > nickname > gear type
    if (item.manufacturer && item.model) {
      return `${item.manufacturer} ${item.model}`;
    }
    if (item.manufacturer) {
      return item.manufacturer;
    }
    if (item.model) {
      return item.model;
    }
    if (item.nickname) {
      return item.nickname;
    }
    // Final fallback to gear type
    return formatGearTypeLabel(item.type as GearType);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className={styles.title}>
          {editingKit ? "Edit kit" : "Create kit"}
        </h2>

        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.field}>
            <label htmlFor="name" className={formStyles.label}>
              Kit name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className={styles.checkbox}
              />
              Set as default kit
            </label>
            <p className={formStyles.helpText}>
              The default kit will be pre-selected when logging dives.
            </p>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Gear items</label>
            {activeGearItems.length === 0 ? (
              <p className={styles.emptyGear}>
                No active gear items. Add gear items first.
              </p>
            ) : (
              <div className={styles.gearList}>
                {activeGearItems.map((item) => (
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
                      <span className={styles.gearItemName}>
                        {getPrimaryTitle(item)}
                      </span>
                      <span className={styles.gearItemType}>
                        {formatGearTypeLabel(item.type as GearType)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className={formStyles.error}>{error}</p>}

          <div className={formStyles.buttonGroup}>
            <button
              type="submit"
              disabled={loading}
              className={buttonStyles.primaryGradient}
            >
              {loading ? "Saving..." : editingKit ? "Update" : "Create kit"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={buttonStyles.secondary}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
