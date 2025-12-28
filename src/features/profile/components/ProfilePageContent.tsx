"use client";

import { useState, useEffect, FormEvent } from "react";
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

export function ProfilePageContent() {
  const { user: sessionUser, isAuthenticated } = useAuth();
  const router = useRouter();
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
  const [isEditing, setIsEditing] = useState(false);

  // Fetch profile data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        const profileData: ProfileData = {
          birthday: data.user.birthday 
            ? new Date(data.user.birthday).toISOString().split("T")[0] 
            : null,
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

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(false);
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setIsEditing(false);
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
        birthday: data.user.birthday 
          ? new Date(data.user.birthday).toISOString().split("T")[0] 
          : null,
        location: data.user.location || null,
        bio: data.user.bio || null,
        pronouns: data.user.pronouns || null,
        website: data.user.website || null,
      };

      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setOriginalData(updatedProfile);
      setIsEditing(false);
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

  const fullName = sessionUser?.firstName && sessionUser?.lastName
    ? `${sessionUser.firstName} ${sessionUser.lastName}`
    : sessionUser?.firstName || "User";

  // Get initials for avatar
  const initials = sessionUser?.firstName
    ? sessionUser.firstName.charAt(0).toUpperCase()
    : "U";

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Profile</h1>

      <div className={cardStyles.card}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.profileInfo}>
            <h2 className={styles.name}>{fullName}</h2>
            <p className={styles.email}>{sessionUser?.email}</p>
          </div>
        </div>

        {/* Edit Profile Section */}
        <div className={styles.editSection}>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className={buttonStyles.secondary}
              type="button"
            >
              Edit Profile
            </button>
          )}

          {isEditing && (
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
                  placeholder="Tell us about yourself..."
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
                <div className={styles.success}>Profile updated successfully!</div>
              )}

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
            </form>
          )}

          {!isEditing && profile && (
            <div className={styles.profileDisplay}>
              {profile.birthday && (
                <div className={styles.profileField}>
                  <span className={styles.fieldLabel}>Birthday</span>
                  <span className={styles.fieldValue}>
                    {new Date(profile.birthday).toLocaleDateString()}
                  </span>
                </div>
              )}
              {profile.location && (
                <div className={styles.profileField}>
                  <span className={styles.fieldLabel}>Location</span>
                  <span className={styles.fieldValue}>{profile.location}</span>
                </div>
              )}
              {profile.bio && (
                <div className={styles.profileField}>
                  <span className={styles.fieldLabel}>Bio</span>
                  <p className={styles.fieldValue}>{profile.bio}</p>
                </div>
              )}
              {profile.pronouns && (
                <div className={styles.profileField}>
                  <span className={styles.fieldLabel}>Pronouns</span>
                  <span className={styles.fieldValue}>{profile.pronouns}</span>
                </div>
              )}
              {profile.website && (
                <div className={styles.profileField}>
                  <span className={styles.fieldLabel}>Website</span>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.websiteLink}
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

