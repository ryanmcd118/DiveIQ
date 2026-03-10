"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { DiveLogEntry } from "@/features/dive-log/types";
import type { SoftWarning } from "@/features/dive-log/types/softWarnings";
import { LogbookForm } from "./LogbookForm";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./AddEditDiveSheet.module.css";

const FORM_ID = "logbook-form";

interface AddEditDiveSheetProps {
  isOpen: boolean;
  mode: "create" | "edit";
  formKey: string;
  activeEntry: DiveLogEntry | null;
  editingEntryId: string | null;
  entries: DiveLogEntry[];
  suggestedDiveNumber?: number;
  saving: boolean;
  error: string | null;
  softWarnings?: SoftWarning[];
  selectedGearIds: string[];
  onGearSelectionChange: (ids: string[]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onDeleteFromForm: () => void;
  onClose: () => void;
}

export function AddEditDiveSheet({
  isOpen,
  mode,
  formKey,
  activeEntry,
  editingEntryId,
  entries = [],
  suggestedDiveNumber = 1,
  saving,
  error,
  softWarnings = [],
  selectedGearIds,
  onGearSelectionChange,
  onSubmit,
  onCancelEdit,
  onDeleteFromForm,
  onClose,
}: AddEditDiveSheetProps) {
  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleOverlayClick = () => {
    onClose();
  };

  const handleSheetClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  };

  const handleCancel = () => {
    onCancelEdit();
    onClose();
  };

  const handleDelete = () => {
    onDeleteFromForm();
  };

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.sheet} onClick={handleSheetClick}>
        <header className={styles.header} data-testid="add-edit-sheet-header">
          <div className={styles.headerTitleBlock}>
            <h2 className={styles.title}>
              {mode === "create" ? "Add dive" : "Edit dive"}
            </h2>
            {softWarnings.length > 0 && (
              <p className={styles.headerWarning} role="alert">
                Missing: {softWarnings.map((w) => w.label).join(", ")}
              </p>
            )}
          </div>
          <div className={styles.headerActions}>
            <button
              type="submit"
              form={FORM_ID}
              disabled={saving}
              className={buttonStyles.primaryGradient}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className={buttonStyles.secondary}
              onClick={handleCancel}
            >
              Cancel
            </button>
            {editingEntryId && (
              <button
                type="button"
                className={buttonStyles.danger}
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <LogbookForm
            formId={FORM_ID}
            formKey={formKey}
            activeEntry={activeEntry}
            editingEntryId={editingEntryId}
            entries={entries}
            suggestedDiveNumber={suggestedDiveNumber}
            saving={saving}
            error={error}
            softWarnings={softWarnings}
            selectedGearIds={selectedGearIds}
            onGearSelectionChange={onGearSelectionChange}
            onSubmit={onSubmit}
            onCancelEdit={onCancelEdit}
            onDeleteFromForm={onDeleteFromForm}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

