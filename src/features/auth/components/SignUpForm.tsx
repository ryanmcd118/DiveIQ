"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import Link from "next/link";
import GoogleOAuthButton from "./GoogleOAuthButton";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

export default function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { signUpUser, isLoading } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    const result = await signUpUser(email, password, firstName, lastName);
    if (!result.success) {
      setError(result.error || "Failed to create account");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.form}>
      <div className={formStyles.formGroup}>
        <label htmlFor="firstName" className={formStyles.label}>
          First Name
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={formStyles.input}
          required
          autoComplete="given-name"
        />
      </div>

      <div className={formStyles.formGroup}>
        <label htmlFor="lastName" className={formStyles.label}>
          Last Name
        </label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={formStyles.input}
          required
          autoComplete="family-name"
        />
      </div>

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
          autoComplete="new-password"
          minLength={8}
        />
        <span className={formStyles.hint}>Must be at least 8 characters</span>
      </div>

      <div className={formStyles.formGroup}>
        <label htmlFor="confirmPassword" className={formStyles.label}>
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={formStyles.input}
          required
          autoComplete="new-password"
        />
      </div>

      {error && <div className={formStyles.error}>{error}</div>}

      <button
        type="submit"
        className={buttonStyles.primary}
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Sign Up"}
      </button>

      <GoogleOAuthButton callbackUrl="/" />

      <p className={formStyles.formFooter}>
        Already have an account?{" "}
        <Link href="/signin" className={formStyles.link}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
