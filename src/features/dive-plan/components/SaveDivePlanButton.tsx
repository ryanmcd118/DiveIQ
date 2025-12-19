"use client";

import { useState, useEffect, useCallback } from "react";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./SaveDivePlanButton.module.css";

interface SaveDivePlanButtonProps {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether a plan has been generated (enables the button) */
  hasPlanDraft: boolean;
  /** Called when authenticated user clicks save */
  onSaveAuthed: () => Promise<void>;
  /** Called when unauthenticated user clicks save */
  onRequireAuth: () => void;
  /** Whether we're currently saving */
  isSaving?: boolean;
  /** Placement variant */
  variant?: "header" | "inline";
}

export function SaveDivePlanButton({
  isAuthenticated,
  hasPlanDraft,
  onSaveAuthed,
  onRequireAuth,
  isSaving = false,
  variant = "header",
}: SaveDivePlanButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [internalSaving, setInternalSaving] = useState(false);

  const isCurrentlySaving = isSaving || internalSaving;

  // Reset success state when plan draft changes
  useEffect(() => {
    setShowSuccess(false);
  }, [hasPlanDraft]);

  const handleClick = useCallback(async () => {
    if (!hasPlanDraft || isCurrentlySaving) return;

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    setInternalSaving(true);
    try {
      await onSaveAuthed();
      setShowSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save plan:", error);
    } finally {
      setInternalSaving(false);
    }
  }, [hasPlanDraft, isCurrentlySaving, isAuthenticated, onSaveAuthed, onRequireAuth]);

  // Don't render if no plan is generated
  if (!hasPlanDraft) {
    return null;
  }

  const buttonClass = variant === "header" 
    ? `${buttonStyles.primary} ${styles.saveButton}`
    : buttonStyles.primary;

  if (showSuccess) {
    return (
      <div className={styles.successContainer}>
        <span className={styles.successIcon}>✓</span>
        <span className={styles.successText}>Saved</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isCurrentlySaving}
      className={buttonClass}
    >
      {isCurrentlySaving ? (
        <>
          <span className={styles.spinner} />
          Saving...
        </>
      ) : (
        "Save Dive Plan"
      )}
    </button>
  );
}

