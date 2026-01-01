"use client";

import { useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import Link from "next/link";
import GoogleOAuthButton from "./GoogleOAuthButton";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signInUser, isLoading } = useAuth();
  const searchParams = useSearchParams();

  // Compute OAuth error message from URL params (derived state, not set in effect)
  const oauthErrorMessage =
    searchParams.get("oauth") === "google" && searchParams.get("error") === "1"
      ? "Google sign-in failed. Please try again or use email/password to sign in."
      : "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signInUser(email, password);
    if (!result.success) {
      setError(result.error || "Failed to sign in");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.form}>
      <div className={formStyles.formGroup}>
        <label htmlFor="email" className={formStyles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={formStyles.input}
          required
          autoComplete="email"
        />
      </div>

      <div className={formStyles.formGroup}>
        <label htmlFor="password" className={formStyles.label}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={formStyles.input}
          required
          autoComplete="current-password"
        />
      </div>

      {(error || oauthErrorMessage) && (
        <div className={formStyles.error}>{error || oauthErrorMessage}</div>
      )}

      <button
        type="submit"
        className={buttonStyles.primaryGradient}
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>

      <GoogleOAuthButton callbackUrl="/" />

      <p className={formStyles.formFooter}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" className={formStyles.link}>
          Sign up
        </Link>
      </p>
    </form>
  );
}
