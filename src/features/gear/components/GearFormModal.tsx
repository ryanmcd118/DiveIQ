"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import type { GearItem } from "@prisma/client";
import { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import { GearType, getDefaultServiceInterval, formatGearTypeLabel } from "../constants";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./GearFormModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingGear: GearItem | null;
  kits: GearKitWithItems[];
}

export function GearFormModal({
  isOpen,
  onClose,
  onSave,
  editingGear,
  kits,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kitUpdateErrors, setKitUpdateErrors] = useState<string | null>(null);

  const [type, setType] = useState<string>(GearType.BCD);
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [nickname, setNickname] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lastServicedAt, setLastServicedAt] = useState("");
  const [serviceIntervalMonths, setServiceIntervalMonths] = useState<
    number | null
  >(null);
  const [selectedKitIds, setSelectedKitIds] = useState<string[]>([]);

  // Compute initial selected kit IDs based on which kits contain this gear item
  const initialSelectedKitIds = useMemo(() => {
    if (!editingGear) return [];
    return kits
      .filter((kit) =>
        kit.kitItems.some((kitItem) => kitItem.gearItemId === editingGear.id)
      )
      .map((kit) => kit.id);
  }, [editingGear, kits]);

  // Set selectedKitIds when modal opens or editingGear changes
  useEffect(() => {
    if (isOpen) {
      if (editingGear) {
        // When editing, set to kits that contain this gear
        setSelectedKitIds(initialSelectedKitIds);
      } else {
        // When creating new gear, start with empty selection
        setSelectedKitIds([]);
      }
    }
  }, [isOpen, editingGear, initialSelectedKitIds]);

  // Initialize form when editing or modal opens
  useEffect(() => {
    if (editingGear) {
      setType(editingGear.type);
      setManufacturer(editingGear.manufacturer);
      setModel(editingGear.model);
      setNickname(editingGear.nickname || "");
      setPurchaseDate(
        editingGear.purchaseDate
          ? new Date(editingGear.purchaseDate).toISOString().split("T")[0]
          : ""
      );
      setNotes(editingGear.notes || "");
      setLastServicedAt(
        editingGear.lastServicedAt
          ? new Date(editingGear.lastServicedAt).toISOString().split("T")[0]
          : ""
      );
      setServiceIntervalMonths(editingGear.serviceIntervalMonths);
    } else {
      // Reset form
      setType(GearType.BCD);
      setManufacturer("");
      setModel("");
      setNickname("");
      setPurchaseDate("");
      setNotes("");
      setLastServicedAt("");
      setServiceIntervalMonths(null);
    }
    // Note: selectedKitIds is set separately via useEffect based on initialSelectedKitIds
    setKitUpdateErrors(null);
  }, [editingGear, isOpen]);

  // Prefill service interval when type changes (for new items)
  useEffect(() => {
    if (!editingGear && type) {
      const defaultInterval = getDefaultServiceInterval(type as any);
      if (defaultInterval !== null && serviceIntervalMonths === null) {
        setServiceIntervalMonths(defaultInterval);
      }
    }
  }, [type, editingGear, serviceIntervalMonths]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setKitUpdateErrors(null);

    try {
      const payload: any = {
        type,
        manufacturer,
        model,
        nickname: nickname || null,
        purchaseDate: purchaseDate || null,
        notes: notes || null,
        lastServicedAt: lastServicedAt || null,
        serviceIntervalMonths,
      };

      const url = editingGear ? "/api/gear" : "/api/gear";
      const method = editingGear ? "PUT" : "POST";

      if (editingGear) {
        payload.id = editingGear.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const gearData = await res.json();
      const gearId = gearData.item?.id || editingGear?.id;

      if (!gearId) {
        throw new Error("Failed to get gear ID");
      }

      // Handle kit membership updates
      if (gearId) {
        if (editingGear) {
          // Editing: reconcile kit membership
          const previousKitIds = initialSelectedKitIds;
          const currentKitIds = selectedKitIds;

          // Kits to remove gear from (were selected, now unchecked)
          const kitsToRemove = previousKitIds.filter(
            (id) => !currentKitIds.includes(id)
          );

          // Kits to add gear to (were not selected, now checked)
          const kitsToAdd = currentKitIds.filter(
            (id) => !previousKitIds.includes(id)
          );

          const kitUpdatePromises: Promise<void>[] = [];

          // Remove from kits
          for (const kitId of kitsToRemove) {
            kitUpdatePromises.push(
              (async () => {
                try {
                  const kit = kits.find((k) => k.id === kitId);
                  if (!kit) {
                    throw new Error(`Kit ${kitId} not found`);
                  }

                  // Get current gear item IDs and remove this gear
                  const currentGearIds = kit.kitItems
                    .map((ki) => ki.gearItemId)
                    .filter((id) => id !== gearId);

                  const updateRes = await fetch("/api/gear-kits", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "updateItems",
                      id: kitId,
                      gearItemIds: currentGearIds,
                    }),
                  });

                  if (!updateRes.ok) {
                    throw new Error(`Failed to remove from kit: ${kit.name}`);
                  }
                } catch (err) {
                  console.error(`Failed to remove gear from kit ${kitId}:`, err);
                  throw err;
                }
              })()
            );
          }

          // Add to kits
          for (const kitId of kitsToAdd) {
            kitUpdatePromises.push(
              (async () => {
                try {
                  const kit = kits.find((k) => k.id === kitId);
                  if (!kit) {
                    throw new Error(`Kit ${kitId} not found`);
                  }

                  // Get current gear item IDs and add this gear
                  const currentGearIds = kit.kitItems.map((ki) => ki.gearItemId);
                  if (!currentGearIds.includes(gearId)) {
                    const updatedGearIds = [...currentGearIds, gearId];

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
                      throw new Error(`Failed to add to kit: ${kit.name}`);
                    }
                  }
                } catch (err) {
                  console.error(`Failed to add gear to kit ${kitId}:`, err);
                  throw err;
                }
              })()
            );
          }

          // Wait for all kit updates
          if (kitUpdatePromises.length > 0) {
            const results = await Promise.allSettled(kitUpdatePromises);
            const failures = results.filter((r) => r.status === "rejected");

            if (failures.length > 0) {
              setKitUpdateErrors(
                `Gear updated, but couldn't update ${failures.length} kit${failures.length > 1 ? "s" : ""}. Try again.`
              );
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }
        } else {
          // Creating new gear: add to selected kits
          if (selectedKitIds.length > 0) {
            const kitUpdatePromises = selectedKitIds.map(async (kitId) => {
              try {
                // Get current kit to find existing gear items
                const kit = kits.find((k) => k.id === kitId);
                if (!kit) {
                  throw new Error(`Kit ${kitId} not found`);
                }

                // Get current gear item IDs and add the new one
                const currentGearIds = kit.kitItems.map((ki) => ki.gearItemId);
                const updatedGearIds = [...currentGearIds, gearId];

                // Update kit with new gear item
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
                  throw new Error(`Failed to add to kit: ${kit.name}`);
                }
              } catch (err) {
                console.error(`Failed to add gear to kit ${kitId}:`, err);
                throw err;
              }
            });

            // Wait for all kit updates, but don't fail if some fail
            const results = await Promise.allSettled(kitUpdatePromises);
            const failures = results.filter((r) => r.status === "rejected");
            
            if (failures.length > 0) {
              setKitUpdateErrors(
                `Gear added, but couldn't add to ${failures.length} kit${failures.length > 1 ? "s" : ""}. Try again.`
              );
              // Show error briefly before closing
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }
        }
      }

      // Only call onSave if gear creation succeeded
      // (kit update errors are non-blocking)
      onSave();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save gear");
    } finally {
      setLoading(false);
    }
  };

  const toggleKitSelection = (kitId: string) => {
    setSelectedKitIds((prev) =>
      prev.includes(kitId)
        ? prev.filter((id) => id !== kitId)
        : [...prev, kitId]
    );
  };

  if (!isOpen) return null;

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
          {editingGear ? "Edit gear" : "Add gear"}
        </h2>

        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.field}>
            <label htmlFor="type" className={formStyles.label}>
              Type *
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className={formStyles.select}
            >
              {Object.values(GearType).map((t) => (
                <option key={t} value={t}>
                  {formatGearTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.field}>
            <label htmlFor="manufacturer" className={formStyles.label}>
              Manufacturer *
            </label>
            <input
              id="manufacturer"
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              required
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="model" className={formStyles.label}>
              Model *
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="nickname" className={formStyles.label}>
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Optional"
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="purchaseDate" className={formStyles.label}>
              Purchase date
            </label>
            <input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="lastServicedAt" className={formStyles.label}>
              Last serviced
            </label>
            <input
              id="lastServicedAt"
              type="date"
              value={lastServicedAt}
              onChange={(e) => setLastServicedAt(e.target.value)}
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="serviceIntervalMonths" className={formStyles.label}>
              Service interval (months)
            </label>
            <input
              id="serviceIntervalMonths"
              type="number"
              min="0"
              value={serviceIntervalMonths ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setServiceIntervalMonths(
                  val === "" ? null : parseInt(val, 10)
                );
              }}
              placeholder="No schedule"
              className={formStyles.input}
            />
            <p className={formStyles.helpText}>
              Leave empty for no schedule. Default:{" "}
              {getDefaultServiceInterval(type as any) ?? "None"}
            </p>
          </div>

          <div className={formStyles.field}>
            <label htmlFor="notes" className={formStyles.label}>
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={formStyles.textarea}
            />
          </div>

          {/* Kits section */}
          <div className={formStyles.field}>
            <label className={formStyles.label}>Kits</label>
              {kits.length === 0 ? (
                <p className={formStyles.helpText}>
                  No kits yet. Create a kit to group gear items.
                </p>
              ) : (
                <div className={styles.kitList}>
                  {kits.map((kit) => (
                    <label
                      key={kit.id}
                      className={`${styles.kitItem} ${
                        selectedKitIds.includes(kit.id) ? styles.selected : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedKitIds.includes(kit.id)}
                        onChange={() => toggleKitSelection(kit.id)}
                        className={styles.checkbox}
                        disabled={loading}
                      />
                      <div className={styles.kitItemContent}>
                        <span className={styles.kitItemName}>
                          {kit.name}
                        </span>
                        {kit.isDefault && (
                          <span className={styles.defaultBadge}>(Default)</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
          </div>

          {error && <p className={formStyles.error}>{error}</p>}
          {kitUpdateErrors && (
            <p className={formStyles.error} style={{ color: "var(--color-warning)" }}>
              {kitUpdateErrors}
            </p>
          )}

          <div className={formStyles.buttonGroup}>
            <button
              type="submit"
              disabled={loading}
              className={buttonStyles.primaryGradient}
            >
              {loading ? "Saving..." : editingGear ? "Update" : "Add gear"}
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

