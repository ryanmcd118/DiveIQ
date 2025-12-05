"use client";

import { useRouter } from "next/navigation";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./SignUpPrompt.module.css";

interface SignUpPromptProps {
  onClose: () => void;
  message?: string;
}

export default function SignUpPrompt({
  onClose,
  message = "Sign up to save your dive plan and access it later!",
}: SignUpPromptProps) {
  const router = useRouter();

  const handleSignUp = () => {
    router.push("/signup");
  };

  const handleSignIn = () => {
    router.push("/signin");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create an Account</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>{message}</p>

          <div className={styles.actions}>
            <button
              onClick={handleSignUp}
              className={`${buttonStyles.button} ${buttonStyles.primary}`}
            >
              Sign Up
            </button>
            <button
              onClick={handleSignIn}
              className={`${buttonStyles.button} ${buttonStyles.secondary}`}
            >
              Sign In
            </button>
          </div>

          <button onClick={onClose} className={styles.cancelButton}>
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}


