"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { UserCertification, CertificationDefinition } from "../types";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./CertificationFormModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingCert: UserCertification | null;
  definitions: CertificationDefinition[];
}

export function CertificationFormModal({
  isOpen,
  onClose,
  onSave,
  editingCert,
  definitions,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agency, setAgency] = useState<"PADI" | "SSI" | "">("");
  const [certificationDefinitionId, setCertificationDefinitionId] = useState("");
  const [earnedDate, setEarnedDate] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [diveShop, setDiveShop] = useState("");
  const [location, setLocation] = useState("");
  const [instructor, setInstructor] = useState("");
  const [notes, setNotes] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Filter definitions by selected agency
  const filteredDefinitions = useMemo(() => {
    if (!agency) return [];
    return definitions
      .filter((def) => def.agency === agency)
      .sort((a, b) => {
        // Sort by category (core first), then levelRank, then name
        const categoryOrder = { core: 0, specialty: 1, professional: 2 };
        const catDiff =
          (categoryOrder[a.category as keyof typeof categoryOrder] ?? 999) -
          (categoryOrder[b.category as keyof typeof categoryOrder] ?? 999);
        if (catDiff !== 0) return catDiff;
        if (a.levelRank !== b.levelRank) return a.levelRank - b.levelRank;
        return a.name.localeCompare(b.name);
      });
  }, [agency, definitions]);

  // Initialize form when editing or modal opens
  useEffect(() => {
    if (editingCert) {
      const def = editingCert.certificationDefinition;
      setAgency(def.agency);
      setCertificationDefinitionId(editingCert.certificationDefinitionId);
      setEarnedDate(
        editingCert.earnedDate
          ? new Date(editingCert.earnedDate).toISOString().split("T")[0]
          : ""
      );
      setCertNumber(editingCert.certNumber || "");
      setDiveShop(editingCert.diveShop || "");
      setLocation(editingCert.location || "");
      setInstructor(editingCert.instructor || "");
      setNotes(editingCert.notes || "");
      setIsFeatured(editingCert.isFeatured);
    } else {
      // Reset form
      setAgency("");
      setCertificationDefinitionId("");
      setEarnedDate("");
      setCertNumber("");
      setDiveShop("");
      setLocation("");
      setInstructor("");
      setNotes("");
      setIsFeatured(false);
    }
    setError(null);
  }, [editingCert, isOpen]);

  // Reset certification selection when agency changes
  useEffect(() => {
    if (!editingCert) {
      setCertificationDefinitionId("");
    }
  }, [agency, editingCert]);

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
      if (editingCert) {
        // Update existing certification
        const payload: any = {};
        if (earnedDate) payload.earnedDate = earnedDate;
        else payload.earnedDate = null;
        if (certNumber.trim()) payload.certNumber = certNumber.trim();
        else payload.certNumber = null;
        if (diveShop.trim()) payload.diveShop = diveShop.trim();
        else payload.diveShop = null;
        if (location.trim()) payload.location = location.trim();
        else payload.location = null;
        if (instructor.trim()) payload.instructor = instructor.trim();
        else payload.instructor = null;
        if (notes.trim()) payload.notes = notes.trim();
        else payload.notes = null;
        payload.isFeatured = isFeatured;

        const res = await fetch(`/api/certifications/${editingCert.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update");
        }
      } else {
        // Create new certification
        if (!agency || !certificationDefinitionId) {
          throw new Error("Agency and certification are required");
        }

        const payload: any = {
          certificationDefinitionId,
          isFeatured,
        };
        if (earnedDate) payload.earnedDate = earnedDate;
        if (certNumber.trim()) payload.certNumber = certNumber.trim();
        if (diveShop.trim()) payload.diveShop = diveShop.trim();
        if (location.trim()) payload.location = location.trim();
        if (instructor.trim()) payload.instructor = instructor.trim();
        if (notes.trim()) payload.notes = notes.trim();

        const res = await fetch("/api/certifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create");
        }
      }

      onSave();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save certification");
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
          {editingCert ? "Edit certification" : "Add certification"}
        </h2>

        <form onSubmit={handleSubmit} className={formStyles.form}>
          {!editingCert && (
            <>
              <div className={formStyles.field}>
                <label htmlFor="agency" className={formStyles.label}>
                  Agency *
                </label>
                <select
                  id="agency"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value as "PADI" | "SSI" | "")}
                  required
                  className={formStyles.select}
                >
                  <option value="">Select agency</option>
                  <option value="PADI">PADI</option>
                  <option value="SSI">SSI</option>
                </select>
              </div>

              <div className={formStyles.field}>
                <label htmlFor="certification" className={formStyles.label}>
                  Certification *
                </label>
                <select
                  id="certification"
                  value={certificationDefinitionId}
                  onChange={(e) => setCertificationDefinitionId(e.target.value)}
                  required
                  disabled={!agency}
                  className={formStyles.select}
                >
                  <option value="">
                    {agency ? "Select certification" : "Select agency first"}
                  </option>
                  {filteredDefinitions.map((def) => (
                    <option key={def.id} value={def.id}>
                      {def.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {editingCert && (
            <div className={formStyles.field}>
              <label className={formStyles.label}>Certification</label>
              <div className={styles.readOnlyField}>
                {editingCert.certificationDefinition.name} ({editingCert.certificationDefinition.agency})
              </div>
              <p className={formStyles.helpText}>
                Certification cannot be changed after creation
              </p>
            </div>
          )}

          <div className={formStyles.field}>
            <label htmlFor="earnedDate" className={formStyles.label}>
              Earned date
            </label>
            <input
              id="earnedDate"
              type="date"
              value={earnedDate}
              onChange={(e) => setEarnedDate(e.target.value)}
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="certNumber" className={formStyles.label}>
              Certification number
            </label>
            <input
              id="certNumber"
              type="text"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              placeholder="Optional"
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="diveShop" className={formStyles.label}>
              Dive shop
            </label>
            <input
              id="diveShop"
              type="text"
              value={diveShop}
              onChange={(e) => setDiveShop(e.target.value)}
              placeholder="Optional"
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="location" className={formStyles.label}>
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="instructor" className={formStyles.label}>
              Instructor
            </label>
            <input
              id="instructor"
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="Optional"
              className={formStyles.input}
            />
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
              placeholder="Optional"
            />
          </div>

          <div className={formStyles.field}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>Featured</span>
            </label>
            <p className={formStyles.hint} style={{ marginTop: "var(--space-1)" }}>
              Featured certifications appear at the top of your list
            </p>
          </div>

          {error && <p className={formStyles.error}>{error}</p>}

          <div className={formStyles.buttonGroup}>
            <button
              type="submit"
              disabled={loading}
              className={buttonStyles.primaryGradient}
            >
              {loading
                ? "Saving..."
                : editingCert
                ? "Update"
                : "Add certification"}
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

