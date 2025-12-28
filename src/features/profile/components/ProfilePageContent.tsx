"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./ProfilePageContent.module.css";

interface ProfileData {
  birthday: string | null;
  location: string | null;
  bio: string | null;
  pronouns: string | null;
  website: string | null;
}

interface UserData {
  firstName: string | null;
  lastName: string | null;
  name?: string | null; // Fallback field (exists before migrations)
  email: string;
}

// Helper function to format user name with fallbacks
function formatUserName(user: UserData | null): string {
  if (!user) return "Profile";

  // Priority 1: firstName + optional lastName
  const hasFirstName = user.firstName && user.firstName.trim().length > 0;
  const hasLastName = user.lastName && user.lastName.trim().length > 0;

  if (hasFirstName && hasLastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (hasFirstName) {
    return user.firstName!; // Safe because we checked hasFirstName
  }

  // Priority 2: name field (fallback for users before migrations)
  if (user.name && user.name.trim().length > 0) {
    return user.name;
  }

  // Priority 3: email prefix (before @)
  if (user.email && user.email.trim()) {
    const emailPrefix = user.email.split("@")[0];
    if (emailPrefix && emailPrefix.trim()) {
      return emailPrefix;
    }
  }

  return "Profile";
}

// Helper to get initials for avatar
function getInitials(user: UserData | null): string {
  if (!user) return "?";

  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }

  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }

  return "?";
}

// Helper to normalize date to date-only string (avoid timezone issues)
function normalizeDate(dateString: string | null): string | null {
  if (!dateString) return null;
  // If it's already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // Otherwise parse and extract date part
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

export function ProfilePageContent() {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProfileData>({
    birthday: null,
    location: null,
    bio: null,
    pronouns: null,
    website: null,
  });
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);

  // Compute if form is dirty - compare current form values with original data
  const isDirty = useMemo(() => {
    if (!originalData) return false;

    // Normalize empty strings to null for comparison
    const normalize = (val: string | null) => (val && val.trim()) || null;

    return (
      normalize(formData.birthday) !== normalize(originalData.birthday) ||
      normalize(formData.location) !== normalize(originalData.location) ||
      normalize(formData.bio) !== normalize(originalData.bio) ||
      normalize(formData.pronouns) !== normalize(originalData.pronouns) ||
      normalize(formData.website) !== normalize(originalData.website)
    );
  }, [formData, originalData]);

  // Fetch profile data from DB (not session)
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile");
      const data = await response
        .json()
        .catch(() => ({ error: "Failed to parse response" }));

      if (!response.ok) {
        // Don't throw - just set error state
        const errorMessage =
          data.error || `Failed to fetch profile (${response.status})`;
        setError(errorMessage);
        if (process.env.NODE_ENV === "development") {
          console.error("[ProfilePage] Fetch failed:", response.status, data);
        }
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[ProfilePage] Fetched user data:", data.user);
      }

      // Store user data - preserve empty strings as null for consistency
      setUser({
        firstName:
          data.user.firstName && data.user.firstName.trim()
            ? data.user.firstName
            : null,
        lastName:
          data.user.lastName && data.user.lastName.trim()
            ? data.user.lastName
            : null,
        name: data.user.name || null, // Fallback field (before migrations)
        email: data.user.email || "",
      });

      // Normalize birthday to date-only format
      const profileData: ProfileData = {
        birthday: normalizeDate(
          data.user.birthday
            ? new Date(data.user.birthday).toISOString().split("T")[0]
            : null
        ),
        location:
          data.user.location && data.user.location.trim()
            ? data.user.location
            : null,
        bio: data.user.bio && data.user.bio.trim() ? data.user.bio : null,
        pronouns:
          data.user.pronouns && data.user.pronouns.trim()
            ? data.user.pronouns
            : null,
        website:
          data.user.website && data.user.website.trim()
            ? data.user.website
            : null,
      };

      setFormData(profileData);
      setOriginalData(profileData);
      setError(null);
    } catch (err) {
      // Catch any unexpected errors - don't throw to prevent Next.js overlay
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load profile";
      setError(errorMessage);
      if (process.env.NODE_ENV === "development") {
        console.error("[ProfilePage] Unexpected error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [isAuthenticated]);

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setError(null);
    setSuccess(false);
  };

  const handleChange = (field: keyof ProfileData, value: string | null) => {
    // Normalize empty strings to null
    const normalizedValue = (value && value.trim()) || null;
    setFormData((prev) => ({
      ...prev,
      [field]: normalizedValue,
    }));
    // Clear success message when user makes changes
    if (success) setSuccess(false);
    // Clear any previous errors
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate bio length
      if (formData.bio && formData.bio.length > 500) {
        setError("Bio must be 500 characters or less");
        setSaving(false);
        return;
      }

      // Validate website URL if provided
      if (formData.website && formData.website.trim() !== "") {
        try {
          new URL(formData.website);
        } catch {
          setError("Invalid website URL format");
          setSaving(false);
          return;
        }
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      const updatedProfile: ProfileData = {
        birthday: normalizeDate(
          data.user.birthday
            ? new Date(data.user.birthday).toISOString().split("T")[0]
            : null
        ),
        location:
          data.user.location && data.user.location.trim()
            ? data.user.location
            : null,
        bio: data.user.bio && data.user.bio.trim() ? data.user.bio : null,
        pronouns:
          data.user.pronouns && data.user.pronouns.trim()
            ? data.user.pronouns
            : null,
        website:
          data.user.website && data.user.website.trim()
            ? data.user.website
            : null,
      };

      setFormData(updatedProfile);
      setOriginalData(updatedProfile); // Update original data so isDirty becomes false
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const displayName = formatUserName(user);
  const initials = getInitials(user);
  const isFormDisabled = loading || !!error || !originalData;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Profile</h1>
          <p className={styles.helperText}>
            Keep your profile up to date so your logs and plans feel more
            personal.
          </p>
        </div>
        <Link href="/settings" className={buttonStyles.secondary}>
          Settings
        </Link>
      </div>

      <div className={cardStyles.card}>
        {loading && <p>Loading profile...</p>}

        {error && !loading && (
          <div className={styles.errorContainer}>
            <p className={formStyles.error}>
              We couldn&apos;t load your profile. Please try again.
            </p>
            <button
              onClick={fetchProfile}
              className={buttonStyles.primary}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Profile Header */}
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.profileInfo}>
                <h2 className={styles.name}>{displayName}</h2>
                <p className={styles.email}>{user?.email}</p>
              </div>
            </div>

            {/* Always-visible editable form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={formStyles.field}>
                <label htmlFor="birthday" className={formStyles.label}>
                  Birthday
                </label>
                <input
                  id="birthday"
                  type="date"
                  value={formData.birthday || ""}
                  onChange={(e) =>
                    handleChange("birthday", e.target.value || null)
                  }
                  className={formStyles.input}
                  placeholder="mm/dd/yyyy"
                  disabled={isFormDisabled}
                />
              </div>

              <div className={formStyles.field}>
                <label htmlFor="location" className={formStyles.label}>
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) =>
                    handleChange("location", e.target.value || null)
                  }
                  className={formStyles.input}
                  placeholder="City, Country"
                  disabled={isFormDisabled}
                />
              </div>

              <div className={formStyles.field}>
                <label htmlFor="bio" className={formStyles.label}>
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={formData.bio || ""}
                  onChange={(e) => handleChange("bio", e.target.value || null)}
                  className={formStyles.textarea}
                  rows={4}
                  placeholder="Tell us a bit about yourself…"
                  maxLength={500}
                  disabled={isFormDisabled}
                />
                <span className={formStyles.hint}>
                  {formData.bio?.length || 0}/500 characters
                </span>
              </div>

              <div className={formStyles.field}>
                <label htmlFor="pronouns" className={formStyles.label}>
                  Pronouns
                </label>
                <input
                  id="pronouns"
                  type="text"
                  value={formData.pronouns || ""}
                  onChange={(e) =>
                    handleChange("pronouns", e.target.value || null)
                  }
                  className={formStyles.input}
                  placeholder="e.g., they/them, she/her, he/him"
                  disabled={isFormDisabled}
                />
              </div>

              <div className={formStyles.field}>
                <label htmlFor="website" className={formStyles.label}>
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={formData.website || ""}
                  onChange={(e) =>
                    handleChange("website", e.target.value || null)
                  }
                  className={formStyles.input}
                  placeholder="https://example.com"
                  disabled={isFormDisabled}
                />
              </div>

              {success && <div className={styles.success}>Profile updated</div>}

              {isDirty && (
                <div className={formStyles.buttonGroup}>
                  <button
                    type="submit"
                    className={buttonStyles.primary}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={buttonStyles.secondary}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
