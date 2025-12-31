"use client";

import { signIn } from "next-auth/react";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./LinkGoogleModal.module.css";

interface LinkGoogleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LinkGoogleModal({ isOpen, onClose }: LinkGoogleModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    // Sign in with Google, which will link to the current user's account
    // The callbackUrl ensures we return to settings with a success indicator
    signIn("google", {
      callbackUrl: "/settings?linked=google",
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Link Google Account</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <p>
            You&apos;ll be redirected to Google to authorize linking your Google
            account to this DiveIQ account.
          </p>
          <p>
            After linking, you&apos;ll be able to sign in with either your password
            or your Google account.
          </p>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={buttonStyles.secondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={buttonStyles.primary}
          >
            Continue to Google
          </button>
        </div>
      </div>
    </div>
  );
}

