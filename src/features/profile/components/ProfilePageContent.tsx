"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./ProfilePageContent.module.css";

interface ProfileData {
  firstName: string | null;
  lastName: string | null;
  birthday: string | null;
  location: string | null;
  bio: string | null;
  pronouns: string | null;
  website: string | null;
}

interface UserData {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

// Helper function to format user name with fallbacks
function formatUserName(user: UserData | null): string {
  if (!user) return "Profile";

  const hasFirstName = user.firstName && user.firstName.trim().length > 0;
  const hasLastName = user.lastName && user.lastName.trim().length > 0;

  if (hasFirstName && hasLastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (hasFirstName) {
    return user.firstName!;
  }

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

// Helper to normalize date to date-only string
function normalizeDate(dateString: string | null): string | null {
  if (!dateString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

// Format birthday for display
function formatBirthdayDisplay(birthday: string | null): string | null {
  if (!birthday) return null;
  try {
    const date = new Date(birthday + "T12:00:00Z");
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return birthday;
  }
}

type EditMode = "edit" | "preview";

export function ProfilePageContent() {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<EditMode>("edit");

  // Profile data state
  const [draftProfile, setDraftProfile] = useState<ProfileData>({
    firstName: null,
    lastName: null,
    birthday: null,
    location: null,
    bio: null,
    pronouns: null,
    website: null,
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);

  // Track which field is being edited (null = no field editing)
  const [editingField, setEditingField] = useState<keyof ProfileData | null>(null);
  const inputRefs = useRef<{ [key in keyof ProfileData]?: HTMLInputElement | HTMLTextAreaElement }>({});

  // Helper to normalize values (trim and convert empty to null)
  const normalizeValue = (val: string | null): string | null => {
    if (!val) return null;
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  };

  // Compute if profile is dirty
  const isDirty = useMemo(() => {
    if (!originalProfile) return false;

    return (
      normalizeValue(draftProfile.firstName) !== normalizeValue(originalProfile.firstName) ||
      normalizeValue(draftProfile.lastName) !== normalizeValue(originalProfile.lastName) ||
      normalizeValue(draftProfile.birthday) !== normalizeValue(originalProfile.birthday) ||
      normalizeValue(draftProfile.location) !== normalizeValue(originalProfile.location) ||
      normalizeValue(draftProfile.bio) !== normalizeValue(originalProfile.bio) ||
      normalizeValue(draftProfile.pronouns) !== normalizeValue(originalProfile.pronouns) ||
      normalizeValue(draftProfile.website) !== normalizeValue(originalProfile.website)
    );
  }, [draftProfile, originalProfile]);

  // Fetch profile data
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile");
      const data = await response.json().catch(() => ({ error: "Failed to parse response" }));

      if (!response.ok) {
        const errorMessage = data.error || `Failed to fetch profile (${response.status})`;
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

      setUser({
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        email: data.user.email || "",
      });

      const profileData: ProfileData = {
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        birthday: normalizeDate(
          data.user.birthday ? new Date(data.user.birthday).toISOString().split("T")[0] : null
        ),
        location: data.user.location || null,
        bio: data.user.bio || null,
        pronouns: data.user.pronouns || null,
        website: data.user.website || null,
      };

      setDraftProfile(profileData);
      setOriginalProfile(profileData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load profile";
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

  // Handle field click to enter edit mode
  const handleFieldClick = (field: keyof ProfileData) => {
    if (mode === "preview") return;
    setEditingField(field);
    // Focus input after render
    setTimeout(() => {
      const input = inputRefs.current[field];
      if (input) {
        input.focus();
        if (input instanceof HTMLInputElement && input.type === "text") {
          input.select();
        }
      }
    }, 0);
  };

  // Handle field value change
  const handleFieldChange = (field: keyof ProfileData, value: string) => {
    setDraftProfile((prev) => ({
      ...prev,
      [field]: value || null,
    }));
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  // Handle field blur (exit edit mode, but keep changes)
  const handleFieldBlur = () => {
    setEditingField(null);
  };

  // Handle cancel - reset draft to original
  const handleCancel = () => {
    if (originalProfile) {
      setDraftProfile(originalProfile);
    }
    setEditingField(null);
    setError(null);
    setSuccess(false);
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Normalize values before sending
      const normalizedData: Partial<ProfileData> = {
        firstName: normalizeValue(draftProfile.firstName),
        lastName: normalizeValue(draftProfile.lastName),
        birthday: normalizeValue(draftProfile.birthday),
        location: normalizeValue(draftProfile.location),
        bio: normalizeValue(draftProfile.bio),
        pronouns: normalizeValue(draftProfile.pronouns),
        website: normalizeValue(draftProfile.website),
      };

      // Validate firstName/lastName max length
      if (normalizedData.firstName && normalizedData.firstName.length > 50) {
        setError("First name must be 50 characters or less");
        setSaving(false);
        return;
      }
      if (normalizedData.lastName && normalizedData.lastName.length > 50) {
        setError("Last name must be 50 characters or less");
        setSaving(false);
        return;
      }

      // Validate bio length
      if (normalizedData.bio && normalizedData.bio.length > 500) {
        setError("Bio must be 500 characters or less");
        setSaving(false);
        return;
      }

      // Validate website URL if provided
      if (normalizedData.website) {
        try {
          new URL(normalizedData.website);
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
        body: JSON.stringify(normalizedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Update user data
      setUser({
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        email: data.user.email || "",
      });

      const updatedProfile: ProfileData = {
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        birthday: normalizeDate(
          data.user.birthday ? new Date(data.user.birthday).toISOString().split("T")[0] : null
        ),
        location: data.user.location || null,
        bio: data.user.bio || null,
        pronouns: data.user.pronouns || null,
        website: data.user.website || null,
      };

      setDraftProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setEditingField(null);
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

  // Render inline editable field
  const renderEditableField = (
    field: keyof ProfileData,
    label: string,
    placeholder: string,
    type: "text" | "textarea" | "url" | "date" = "text",
    maxLength?: number
  ) => {
    if (mode === "preview") {
      const value = draftProfile[field];
      if (!value || !value.trim()) return null; // Hide empty fields in preview
      
      return (
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabel}>{label}</div>
          <div className={styles.fieldValue}>
            {type === "url" ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.websiteLink}
              >
                {value}
              </a>
            ) : field === "birthday" ? (
              formatBirthdayDisplay(value)
            ) : (
              value
            )}
          </div>
        </div>
      );
    }

    const isEditing = editingField === field;
    const value = draftProfile[field] || "";
    const isEmpty = !value || !value.trim();

    return (
      <div className={styles.fieldRow}>
        <div className={styles.fieldLabel}>{label}</div>
        {isEditing ? (
          <div className={styles.fieldEdit}>
            {type === "textarea" ? (
              <>
                <textarea
                  ref={(el) => {
                    if (el) inputRefs.current[field] = el;
                  }}
                  value={value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  onBlur={handleFieldBlur}
                  className={styles.fieldInput}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  rows={4}
                />
                {maxLength && (
                  <span className={styles.fieldHint}>
                    {value.length}/{maxLength} characters
                  </span>
                )}
              </>
            ) : (
              <input
                ref={(el) => {
                  if (el) inputRefs.current[field] = el;
                }}
                type={type}
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                onBlur={handleFieldBlur}
                className={styles.fieldInput}
                placeholder={placeholder}
                maxLength={maxLength}
              />
            )}
          </div>
        ) : (
          <div
            className={`${styles.fieldValue} ${styles.fieldValueClickable}`}
            onClick={() => handleFieldClick(field)}
          >
            {isEmpty ? (
              <span className={styles.fieldPlaceholder}>{placeholder}</span>
            ) : field === "birthday" ? (
              formatBirthdayDisplay(value)
            ) : (
              value
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <div className={styles.headerActions}>
          {mode === "edit" ? (
            <button
              onClick={() => setMode("preview")}
              className={buttonStyles.secondary}
              type="button"
            >
              Preview public profile
            </button>
          ) : (
            <button
              onClick={() => setMode("edit")}
              className={buttonStyles.secondary}
              type="button"
            >
              Back to editing
            </button>
          )}
          <Link href="/settings" className={buttonStyles.secondary}>
            Settings
          </Link>
        </div>
      </div>

      <div className={cardStyles.card}>
        {loading && <p>Loading profile...</p>}

        {error && !loading && (
          <div className={styles.errorContainer}>
            <p className={formStyles.error}>
              We couldn&apos;t load your profile. Please try again.
            </p>
            <button onClick={fetchProfile} className={buttonStyles.primary} type="button">
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
                <h2 className={styles.nameLarge}>{displayName}</h2>
                <p className={styles.email}>{user?.email}</p>
              </div>
            </div>

            {/* Profile Fields */}
            <div className={styles.fields}>
              {renderEditableField("firstName", "First Name", "Add your first name", "text", 50)}
              {renderEditableField("lastName", "Last Name", "Add your last name", "text", 50)}
              {renderEditableField("location", "Location", "Add your location", "text")}
              {renderEditableField("bio", "Bio", "Add a bio", "textarea", 500)}
              {renderEditableField("pronouns", "Pronouns", "Add your pronouns", "text")}
              {renderEditableField("website", "Website", "Add your website", "url")}
              {renderEditableField("birthday", "Birthday", "Add your birthday", "date")}
            </div>

            {/* Save/Cancel Footer - only show when dirty */}
            {isDirty && mode === "edit" && (
              <div className={styles.footer}>
                {error && <div className={styles.footerError}>{error}</div>}
                {success && <div className={styles.footerSuccess}>Profile updated</div>}
                <div className={styles.footerActions}>
                  <button
                    onClick={handleCancel}
                    className={buttonStyles.secondary}
                    type="button"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className={buttonStyles.primary}
                    type="button"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
