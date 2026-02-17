"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { DiveLogEntry } from "@/features/dive-log/types";
import { DiveLogForm } from "./DiveLogForm";
import styles from "./AddEditDiveSheet.module.css";

interface AddEditDiveSheetProps {
  isOpen: boolean;
  mode: "create" | "edit";
  formKey: string;
  activeEntry: DiveLogEntry | null;
  editingEntryId: string | null;
  saving: boolean;
  error: string | null;
  selectedGearIds: string[];
  onGearSelectionChange: (ids: string[]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancelEdit: (form?: HTMLFormElement | null) => void;
  onDeleteFromForm: (form: HTMLFormElement) => void;
  onClose: () => void;
}

export function AddEditDiveSheet({
  isOpen,
  mode,
  formKey,
  activeEntry,
  editingEntryId,
  saving,
  error,
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

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.sheet} onClick={handleSheetClick}>
        <header
          className={styles.header}
          data-testid="add-edit-sheet-header"
        >
          <h2 className={styles.title}>
            {mode === "create" ? "Add dive" : "Edit dive"}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          <DiveLogForm
            formKey={formKey}
            activeEntry={activeEntry}
            editingEntryId={editingEntryId}
            saving={saving}
            error={error}
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

