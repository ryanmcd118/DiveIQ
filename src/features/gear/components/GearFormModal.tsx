"use client";

import { useState, useEffect, FormEvent } from "react";
import type { GearItem } from "@prisma/client";
import { GearType, getDefaultServiceInterval, formatGearTypeLabel } from "../constants";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./GearFormModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingGear: GearItem | null;
}

export function GearFormModal({
  isOpen,
  onClose,
  onSave,
  editingGear,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      onSave();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save gear");
    } finally {
      setLoading(false);
    }
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

          {error && <p className={formStyles.error}>{error}</p>}

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

