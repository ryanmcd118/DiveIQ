"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import buttonStyles from "@/styles/components/Button.module.css";
import formStyles from "@/styles/components/Form.module.css";
import styles from "./DeleteAccountModal.module.css";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isValid = confirmText === "DELETE" && !isDeleting;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isDeleting]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Clear input and error when modal closes
      setConfirmText("");
      setError(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDelete = async () => {
    if (!isValid || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("You need to be signed in.");
          setIsDeleting(false);
          return;
        }

        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to delete account (${response.status})`);
      }

      // Success - sign out and redirect to homepage
      // signOut will handle the redirect
      await signOut({ redirect: true, callbackUrl: "/" });
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong deleting your account. Please try again."
      );
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={isDeleting ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!isDeleting && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        )}

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
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError(null);
              }}
              className={formStyles.input}
              placeholder="DELETE"
              autoComplete="off"
              disabled={isDeleting}
            />
          </div>

          {error && (
            <div className={formStyles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={buttonStyles.secondary}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isValid}
              className={buttonStyles.danger}
            >
              {isDeleting ? "Deleting..." : "Delete account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

