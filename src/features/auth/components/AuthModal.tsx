"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import styles from "./AuthModal.module.css";
import oauthStyles from "./GoogleOAuthButton.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

type AuthMode = "signup" | "login";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  initialMode?: AuthMode;
  onGoogleSignIn?: () => void;
}

interface AuthModalContentProps {
  onAuthSuccess: () => void;
  initialMode: AuthMode;
  onGoogleSignIn?: () => void;
}

function AuthModalContent({
  onAuthSuccess,
  initialMode,
  onGoogleSignIn,
}: AuthModalContentProps) {
  // Keep a ref to the latest onAuthSuccess so that async handlers always
  // call the current version even if the parent re-renders mid-flight.
  const onAuthSuccessRef = useRef(onAuthSuccess);
  useEffect(() => {
    onAuthSuccessRef.current = onAuthSuccess;
  }, [onAuthSuccess]);

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
      onAuthSuccessRef.current();
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
      onAuthSuccessRef.current();
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

      <button
        type="button"
        onClick={() =>
          onGoogleSignIn
            ? onGoogleSignIn()
            : signIn("google", { callbackUrl: "/plan" })
        }
        disabled={isLoading}
        className={oauthStyles.googleButton}
      >
        <svg
          className={oauthStyles.googleIcon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <div className={oauthStyles.divider}>
        <div className={oauthStyles.dividerLine} />
        <span className={oauthStyles.dividerText}>or</span>
        <div className={oauthStyles.dividerLine} />
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
  onGoogleSignIn,
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
          onGoogleSignIn={onGoogleSignIn}
        />
      </div>
    </div>
  );
}
