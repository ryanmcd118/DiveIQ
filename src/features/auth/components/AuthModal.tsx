"use client";

import { useState, FormEvent, useEffect } from "react";
import { signIn } from "next-auth/react";
import styles from "./AuthModal.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

type AuthMode = "signup" | "login";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  initialMode?: AuthMode;
}

interface AuthModalContentProps {
  onAuthSuccess: () => void;
  initialMode: AuthMode;
}

function AuthModalContent({
  onAuthSuccess,
  initialMode,
}: AuthModalContentProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Signup form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Auto sign in after successful signup
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created but failed to sign in");
        setIsLoading(false);
        return;
      }

      // Success - trigger callback
      onAuthSuccess();
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Invalid email or password"
            : result.error
        );
        setIsLoading(false);
        return;
      }

      // Success - trigger callback
      onAuthSuccess();
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signup" ? "login" : "signup");
    setError("");
    // Keep email if user has entered it
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {mode === "signup"
            ? "Create an account to save this plan"
            : "Sign in to save this plan"}
        </h2>
        <p className={styles.subtitle}>
          {mode === "signup"
            ? "Your dive plan will be saved after creating your account"
            : "Your dive plan will be saved after signing in"}
        </p>
      </div>

      <form
        onSubmit={mode === "signup" ? handleSignup : handleLogin}
        className={styles.form}
      >
        {mode === "signup" && (
          <>
            <div className={formStyles.formGroup}>
              <label htmlFor="modal-firstName" className={formStyles.label}>
                First Name
              </label>
              <input
                id="modal-firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={formStyles.input}
                required
                autoComplete="given-name"
                disabled={isLoading}
              />
            </div>
            <div className={formStyles.formGroup}>
              <label htmlFor="modal-lastName" className={formStyles.label}>
                Last Name
              </label>
              <input
                id="modal-lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={formStyles.input}
                required
                autoComplete="family-name"
                disabled={isLoading}
              />
            </div>
          </>
        )}

        <div className={formStyles.formGroup}>
          <label htmlFor="modal-email" className={formStyles.label}>
            Email
          </label>
          <input
            id="modal-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={formStyles.input}
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className={formStyles.formGroup}>
          <label htmlFor="modal-password" className={formStyles.label}>
            Password
          </label>
          <input
            id="modal-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={formStyles.input}
            required
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            minLength={mode === "signup" ? 8 : undefined}
            disabled={isLoading}
          />
          {mode === "signup" && (
            <span className={formStyles.hint}>
              Must be at least 8 characters
            </span>
          )}
        </div>

        {mode === "signup" && (
          <div className={formStyles.formGroup}>
            <label
              htmlFor="modal-confirm-password"
              className={formStyles.label}
            >
              Confirm Password
            </label>
            <input
              id="modal-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={formStyles.input}
              required
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>
        )}

        {error && <div className={formStyles.error}>{error}</div>}

        <button
          type="submit"
          className={`${buttonStyles.button} ${buttonStyles.primary}`}
          disabled={isLoading}
        >
          {isLoading
            ? mode === "signup"
              ? "Creating account..."
              : "Signing in..."
            : mode === "signup"
              ? "Create Account & Save Plan"
              : "Sign In & Save Plan"}
        </button>
      </form>

      <div className={styles.footer}>
        {mode === "signup" ? (
          <p>
            Already have an account?{" "}
            <button
              type="button"
              onClick={toggleMode}
              className={styles.toggleLink}
              disabled={isLoading}
            >
              Log in
            </button>
          </p>
        ) : (
          <p>
            Need an account?{" "}
            <button
              type="button"
              onClick={toggleMode}
              className={styles.toggleLink}
              disabled={isLoading}
            >
              Create one
            </button>
          </p>
        )}
      </div>
    </>
  );
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "signup",
}: AuthModalProps) {
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
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
        <AuthModalContent
          onAuthSuccess={onAuthSuccess}
          initialMode={initialMode}
        />
      </div>
    </div>
  );
}
