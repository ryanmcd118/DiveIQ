"use client";

import { useState, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import buttonStyles from "@/styles/components/Button.module.css";
import formStyles from "@/styles/components/Form.module.css";
import styles from "./ChangePasswordModal.module.css";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset all modal state
  const resetState = useCallback(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setIsSubmitting(false);
  }, []);

  // Handle close with state reset
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, handleClose]);

  // Prevent body scroll when modal is open
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

  // Validation
  const getValidationError = (): string | null => {
    if (!currentPassword) {
      return "Current password is required";
    }
    if (newPassword.length < 8) {
      return "New password must be at least 8 characters";
    }
    if (newPassword === currentPassword) {
      return "New password must be different from current password";
    }
    if (newPassword !== confirmPassword) {
      return "New passwords do not match";
    }
    return null;
  };

  const validationError = getValidationError();
  const canSubmit =
    !validationError &&
    !isSubmitting &&
    currentPassword &&
    newPassword &&
    confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErr = getValidationError();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/account/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("You need to be signed in.");
          return;
        }
        if (response.status === 400) {
          setError(
            data.error || "Invalid request. Please check your current password."
          );
          return;
        }
        throw new Error(
          data.error || `Failed to change password (${response.status})`
        );
      }

      // Success - close modal and show toast
      // State will be reset when modal closes (via handleClose) or when it reopens (via useEffect)
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong changing your password. Please try again."
      );
    } finally {
      // Always reset submitting state, even on success or error
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={isSubmitting ? undefined : handleClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!isSubmitting && (
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        )}

        <div className={styles.header}>
          <h2 className={styles.title}>Change password</h2>
          <p className={styles.description}>
            Enter your current password and choose a new one. Your other
            sessions will be signed out.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.content}>
          <div className={formStyles.field}>
            <label htmlFor="current-password" className={formStyles.label}>
              Current password
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setError(null);
                }}
                className={formStyles.input}
                autoComplete="current-password"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isSubmitting}
                aria-label={
                  showCurrentPassword ? "Hide password" : "Show password"
                }
              >
                {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className={formStyles.field}>
            <label htmlFor="new-password" className={formStyles.label}>
              New password
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                }}
                className={formStyles.input}
                autoComplete="new-password"
                disabled={isSubmitting}
                required
                minLength={8}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isSubmitting}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <span className={formStyles.hint}>
              Must be at least 8 characters
            </span>
          </div>

          <div className={formStyles.field}>
            <label htmlFor="confirm-password" className={formStyles.label}>
              Confirm new password
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                className={formStyles.input}
                autoComplete="new-password"
                disabled={isSubmitting}
                required
                minLength={8}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {newPassword &&
              confirmPassword &&
              newPassword !== confirmPassword && (
                <span className={formStyles.error}>Passwords do not match</span>
              )}
          </div>

          {validationError && !error && (
            <div className={formStyles.error} role="alert">
              {validationError}
            </div>
          )}

          {error && (
            <div className={formStyles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              className={buttonStyles.secondary}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={buttonStyles.primary}
            >
              {isSubmitting ? "Changing password..." : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
