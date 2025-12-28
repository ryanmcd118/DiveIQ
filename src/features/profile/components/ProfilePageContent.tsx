"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
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
  email: string;
}

// Helper function to format user name with fallbacks
function formatUserName(user: UserData | null): string {
  if (!user) return "Your profile";
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) {
    return user.firstName;
  }
  
  // Fallback to email prefix
  if (user.email) {
    const emailPrefix = user.email.split("@")[0];
    return emailPrefix || "Your profile";
  }
  
  return "Your profile";
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
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
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

  // Compute if form is dirty
  const isDirty = useMemo(() => {
    if (!originalData) return false;
    return (
      formData.birthday !== originalData.birthday ||
      formData.location !== originalData.location ||
      formData.bio !== originalData.bio ||
      formData.pronouns !== originalData.pronouns ||
      formData.website !== originalData.website
    );
  }, [formData, originalData]);

  // Fetch profile data from DB (not session)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        
        // Store user data
        setUser({
          firstName: data.user.firstName || null,
          lastName: data.user.lastName || null,
          email: data.user.email,
        });

        // Normalize birthday to date-only format
        const profileData: ProfileData = {
          birthday: normalizeDate(
            data.user.birthday 
              ? new Date(data.user.birthday).toISOString().split("T")[0]
              : null
          ),
          location: data.user.location || null,
          bio: data.user.bio || null,
          pronouns: data.user.pronouns || null,
          website: data.user.website || null,
        };
        
        setProfile(profileData);
        setFormData(profileData);
        setOriginalData(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router]);

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setError(null);
    setSuccess(false);
  };

  const handleChange = (
    field: keyof ProfileData,
    value: string | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }));
    // Clear success message when user makes changes
    if (success) setSuccess(false);
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await response.json();
      const updatedProfile: ProfileData = {
        birthday: normalizeDate(
          data.user.birthday 
            ? new Date(data.user.birthday).toISOString().split("T")[0]
            : null
        ),
        location: data.user.location || null,
        bio: data.user.bio || null,
        pronouns: data.user.pronouns || null,
        website: data.user.website || null,
      };

      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setOriginalData(updatedProfile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={cardStyles.card}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayName = formatUserName(user);
  const initials = getInitials(user);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Profile</h1>
          <p className={styles.helperText}>
            Keep your profile up to date so your logs and plans feel more personal.
          </p>
        </div>
        <Link href="/settings" className={buttonStyles.secondary}>
          Settings
        </Link>
      </div>

      <div className={cardStyles.card}>
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
            />
          </div>

          {error && <div className={formStyles.error}>{error}</div>}
          {success && (
            <div className={styles.success}>Profile updated</div>
          )}

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
      </div>
    </div>
  );
}
