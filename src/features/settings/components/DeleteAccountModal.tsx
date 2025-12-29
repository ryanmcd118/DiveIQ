"use client";

import { useState, useEffect } from "react";
import buttonStyles from "@/styles/components/Button.module.css";
import formStyles from "@/styles/components/Form.module.css";
import styles from "./DeleteAccountModal.module.css";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const isValid = confirmText === "DELETE";

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Clear input when modal closes
      setConfirmText("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDelete = () => {
    if (!isValid) return;

    // TODO: Implement account deletion API call in Prompt 2
    // For now, just show placeholder message and close modal
    console.log("Account deletion will be implemented next.");
    
    // Close modal and clear input
    onClose();
    setConfirmText("");
    
    // Show placeholder toast message (could be enhanced with a toast system)
    // For now, just log - can be replaced with toast in future
    alert("Account deletion will be implemented next.");
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>Delete your account?</h2>
          <p className={styles.description}>
            This permanently deletes your DiveIQ account and all associated dive data. This cannot be undone.
          </p>
        </div>

        <div className={styles.content}>
          <div className={formStyles.field}>
            <label htmlFor="delete-confirm" className={formStyles.label}>
              Type DELETE to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={formStyles.input}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={buttonStyles.secondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isValid}
              className={buttonStyles.danger}
            >
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

