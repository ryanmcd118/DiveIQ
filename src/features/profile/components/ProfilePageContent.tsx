"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar } from "@/components/Avatar/Avatar";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./ProfilePageContent.module.css";
import { parseJsonArray, stringifyJsonArray } from "../utils/parseJsonArray";
import {
  DIVE_TYPES,
  DIVING_ENVIRONMENTS,
  LOOKING_FOR_OPTIONS,
  CERTIFYING_AGENCIES,
  type ExperienceLevel,
} from "../types";

interface ProfileData {
  firstName: string | null;
  lastName: string | null;
  location: string | null;
  pronouns: string | null;
  homeDiveRegion: string | null;
  website: string | null;
  languages: string | null;
  bio: string | null;
  primaryDiveTypes: string[] | null;
  experienceLevel: ExperienceLevel | null;
  yearsDiving: number | null;
  certifyingAgency: string | null;
  typicalDivingEnvironment: string[] | null;
  lookingFor: string[] | null;
  favoriteDiveLocation: string | null;
  birthday: string | null;
  avatarUrl: string | null;
}

interface UserData {
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
}

function formatUserName(user: UserData | null): string {
  if (!user) return "Profile";
  const hasFirstName = user.firstName && user.firstName.trim().length > 0;
  const hasLastName = user.lastName && user.lastName.trim().length > 0;
  if (hasFirstName && hasLastName) return `${user.firstName} ${user.lastName}`;
  if (hasFirstName) return user.firstName!;
  if (user.email?.trim()) {
    const emailPrefix = user.email.split("@")[0];
    if (emailPrefix?.trim()) return emailPrefix;
  }
  return "Profile";
}

function getInitials(user: UserData | null): string {
  if (!user) return "?";
  if (user.firstName) return user.firstName.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return "?";
}

function normalizeDate(dateString: string | null): string | null {
  if (!dateString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

type ViewMode = "view" | "edit";

export function ProfilePageContent() {
  const { isAuthenticated, user: authUser } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<ViewMode>("view");

  const [draftProfile, setDraftProfile] = useState<ProfileData>({
    firstName: null,
    lastName: null,
    location: null,
    pronouns: null,
    homeDiveRegion: null,
    website: null,
    languages: null,
    bio: null,
    primaryDiveTypes: null,
    experienceLevel: null,
    yearsDiving: null,
    certifyingAgency: null,
    typicalDivingEnvironment: null,
    lookingFor: null,
    favoriteDiveLocation: null,
    birthday: null,
    avatarUrl: null,
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(
    null
  );

  const [editingField, setEditingField] = useState<string | null>(null);
  const inputRefs = useRef<{
    [key: string]: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  }>({});

  const normalizeValue = (val: string | null): string | null => {
    if (!val) return null;
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  };

  const isDirty = useMemo(() => {
    if (!originalProfile) return false;
    const norm = (v: string | string[] | number | null) => {
      if (Array.isArray(v)) return stringifyJsonArray(v);
      if (typeof v === "number") return v;
      return normalizeValue(v);
    };
    return (
      norm(draftProfile.firstName) !== norm(originalProfile.firstName) ||
      norm(draftProfile.lastName) !== norm(originalProfile.lastName) ||
      norm(draftProfile.location) !== norm(originalProfile.location) ||
      norm(draftProfile.pronouns) !== norm(originalProfile.pronouns) ||
      norm(draftProfile.homeDiveRegion) !==
        norm(originalProfile.homeDiveRegion) ||
      norm(draftProfile.website) !== norm(originalProfile.website) ||
      norm(draftProfile.languages) !== norm(originalProfile.languages) ||
      norm(draftProfile.bio) !== norm(originalProfile.bio) ||
      JSON.stringify(draftProfile.primaryDiveTypes || []) !==
        JSON.stringify(originalProfile.primaryDiveTypes || []) ||
      norm(draftProfile.experienceLevel) !==
        norm(originalProfile.experienceLevel) ||
      draftProfile.yearsDiving !== originalProfile.yearsDiving ||
      norm(draftProfile.certifyingAgency) !==
        norm(originalProfile.certifyingAgency) ||
      JSON.stringify(draftProfile.typicalDivingEnvironment || []) !==
        JSON.stringify(originalProfile.typicalDivingEnvironment || []) ||
      JSON.stringify(draftProfile.lookingFor || []) !==
        JSON.stringify(originalProfile.lookingFor || []) ||
      norm(draftProfile.favoriteDiveLocation) !==
        norm(originalProfile.favoriteDiveLocation) ||
      norm(draftProfile.birthday) !== norm(originalProfile.birthday)
    );
  }, [draftProfile, originalProfile]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/profile");
      const data = await response
        .json()
        .catch(() => ({ error: "Failed to parse response" }));
      if (!response.ok) {
        setError(data.error || `Failed to fetch profile (${response.status})`);
        setLoading(false);
        return;
      }
      setUser({
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        email: data.user.email || "",
        avatarUrl: data.user.avatarUrl || null,
      });
      const profileData: ProfileData = {
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        location: data.user.location || null,
        pronouns: data.user.pronouns || null,
        homeDiveRegion: data.user.homeDiveRegion || null,
        website: data.user.website || null,
        languages: data.user.languages || null,
        bio: data.user.bio || null,
        primaryDiveTypes: parseJsonArray<string>(data.user.primaryDiveTypes),
        experienceLevel: (data.user.experienceLevel as ExperienceLevel) || null,
        yearsDiving:
          data.user.yearsDiving !== null && data.user.yearsDiving !== undefined
            ? Number(data.user.yearsDiving)
            : null,
        certifyingAgency: data.user.certifyingAgency || null,
        typicalDivingEnvironment: parseJsonArray<string>(
          data.user.typicalDivingEnvironment
        ),
        lookingFor: parseJsonArray<string>(data.user.lookingFor),
        favoriteDiveLocation: data.user.favoriteDiveLocation || null,
        birthday: normalizeDate(
          data.user.birthday
            ? new Date(data.user.birthday).toISOString().split("T")[0]
            : null
        ),
        avatarUrl: data.user.avatarUrl || null,
      };
      setDraftProfile(profileData);
      setOriginalProfile(profileData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
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

  const handleFieldClick = (field: string) => {
    if (mode === "view") return;
    setEditingField(field);
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

  const handleFieldChange = (
    field: keyof ProfileData,
    value: string | string[] | number | null
  ) => {
    setDraftProfile((prev) => ({ ...prev, [field]: value }));
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  const handleFieldBlur = () => setEditingField(null);

  const handleCancel = () => {
    if (originalProfile) setDraftProfile(originalProfile);
    setEditingField(null);
    setError(null);
    setSuccess(false);
    setMode("view");
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const normalizedData: Record<string, string | number | null> = {
        firstName: normalizeValue(draftProfile.firstName),
        lastName: normalizeValue(draftProfile.lastName),
        location: normalizeValue(draftProfile.location),
        pronouns: normalizeValue(draftProfile.pronouns),
        homeDiveRegion: normalizeValue(draftProfile.homeDiveRegion),
        website: normalizeValue(draftProfile.website),
        languages: normalizeValue(draftProfile.languages),
        bio: normalizeValue(draftProfile.bio),
        primaryDiveTypes: stringifyJsonArray(draftProfile.primaryDiveTypes),
        experienceLevel: normalizeValue(draftProfile.experienceLevel),
        yearsDiving: draftProfile.yearsDiving,
        certifyingAgency: normalizeValue(draftProfile.certifyingAgency),
        typicalDivingEnvironment: stringifyJsonArray(
          draftProfile.typicalDivingEnvironment
        ),
        lookingFor: stringifyJsonArray(draftProfile.lookingFor),
        favoriteDiveLocation: normalizeValue(draftProfile.favoriteDiveLocation),
        birthday: normalizeValue(draftProfile.birthday),
      };

      if (
        normalizedData.firstName &&
        typeof normalizedData.firstName === "string" &&
        normalizedData.firstName.length > 50
      ) {
        setError("First name must be 50 characters or less");
        setSaving(false);
        return;
      }
      if (
        normalizedData.lastName &&
        typeof normalizedData.lastName === "string" &&
        normalizedData.lastName.length > 50
      ) {
        setError("Last name must be 50 characters or less");
        setSaving(false);
        return;
      }
      if (
        normalizedData.bio &&
        typeof normalizedData.bio === "string" &&
        normalizedData.bio.length > 500
      ) {
        setError("Bio must be 500 characters or less");
        setSaving(false);
        return;
      }
      if (
        normalizedData.website &&
        typeof normalizedData.website === "string"
      ) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedData),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update profile");

      setUser({
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        email: data.user.email || "",
        avatarUrl: data.user.avatarUrl || null,
      });

      const updatedProfile: ProfileData = {
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        location: data.user.location || null,
        pronouns: data.user.pronouns || null,
        homeDiveRegion: data.user.homeDiveRegion || null,
        website: data.user.website || null,
        languages: data.user.languages || null,
        bio: data.user.bio || null,
        primaryDiveTypes: parseJsonArray<string>(data.user.primaryDiveTypes),
        experienceLevel: (data.user.experienceLevel as ExperienceLevel) || null,
        yearsDiving:
          data.user.yearsDiving !== null && data.user.yearsDiving !== undefined
            ? Number(data.user.yearsDiving)
            : null,
        certifyingAgency: data.user.certifyingAgency || null,
        typicalDivingEnvironment: parseJsonArray<string>(
          data.user.typicalDivingEnvironment
        ),
        lookingFor: parseJsonArray<string>(data.user.lookingFor),
        favoriteDiveLocation: data.user.favoriteDiveLocation || null,
        birthday: normalizeDate(
          data.user.birthday
            ? new Date(data.user.birthday).toISOString().split("T")[0]
            : null
        ),
        avatarUrl: data.user.avatarUrl || null,
      };

      setDraftProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setEditingField(null);
      setSuccess(true);
      setMode("view"); // Switch back to view mode after successful save
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const displayName = formatUserName(user);
  const initials = getInitials(user);

  const displayWebsiteUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      if (domain.startsWith("www.")) domain = domain.slice(4);
      return domain;
    } catch {
      let cleaned = url
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
      if (cleaned.startsWith("www.")) cleaned = cleaned.slice(4);
      return cleaned.split("/")[0];
    }
  };

  // Render multi-select tags component
  const renderMultiSelect = (
    field: "primaryDiveTypes" | "typicalDivingEnvironment" | "lookingFor",
    label: string,
    options: readonly string[]
  ) => {
    const selected = draftProfile[field] || [];

    const toggleOption = (option: string) => {
      const current = draftProfile[field] || [];
      const updated = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option];
      handleFieldChange(field, updated.length > 0 ? updated : null);
    };

    return (
      <div className={styles.fieldRow}>
        <div className={styles.fieldLabel}>{label}</div>
        <div className={styles.tagContainer}>
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className={`${styles.tag} ${isSelected ? styles.tagSelected : ""}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render select dropdown
  const renderSelect = (
    field: "experienceLevel" | "certifyingAgency",
    label: string,
    options: readonly string[],
    placeholder: string
  ) => {
    const value = draftProfile[field] || "";

    return (
      <div className={styles.fieldRow}>
        <div className={styles.fieldLabel}>{label}</div>
        <select
          value={value}
          onChange={(e) => handleFieldChange(field, e.target.value || null)}
          className={styles.fieldInput}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Render inline editable field
  const renderEditableField = (
    field: keyof ProfileData,
    label: string,
    placeholder: string,
    type: "text" | "textarea" | "url" | "date" | "number" = "text",
    maxLength?: number
  ) => {
    const isEditing = editingField === field;
    const value = draftProfile[field] || "";
    const isEmpty = !value || (typeof value === "string" && !value.trim());

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
                  value={value as string}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  onBlur={handleFieldBlur}
                  className={styles.fieldInput}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  rows={4}
                />
                {maxLength && (
                  <span className={styles.fieldHint}>
                    {(value as string).length}/{maxLength} characters
                  </span>
                )}
              </>
            ) : (
              <input
                ref={(el) => {
                  if (el) inputRefs.current[field] = el;
                }}
                type={type}
                value={value as string | number}
                onChange={(e) =>
                  handleFieldChange(
                    field,
                    type === "number"
                      ? e.target.value === ""
                        ? null
                        : Number(e.target.value)
                      : e.target.value
                  )
                }
                onBlur={handleFieldBlur}
                className={styles.fieldInput}
                placeholder={placeholder}
                maxLength={maxLength}
                min={type === "number" ? 0 : undefined}
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
            ) : (
              value
            )}
          </div>
        )}
      </div>
    );
  };

  // Format birthday for display
  const formatBirthday = (dateString: string | null): string | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Render public profile view
  const renderPublicProfile = () => {
    const fullName =
      [draftProfile.firstName, draftProfile.lastName]
        .filter(Boolean)
        .join(" ") || displayName;

    // Build metadata line: Location, Home Dive Region, Experience Level
    const metadataParts: string[] = [];
    if (draftProfile.location) metadataParts.push(draftProfile.location);
    if (draftProfile.homeDiveRegion)
      metadataParts.push(draftProfile.homeDiveRegion);
    if (draftProfile.experienceLevel)
      metadataParts.push(draftProfile.experienceLevel);
    const metadata = metadataParts.join(" · ");

    const primaryDiveTypes = draftProfile.primaryDiveTypes || [];

    // Check if sections have content
    const hasBasicInfo = !!(
      draftProfile.bio ||
      draftProfile.birthday ||
      draftProfile.languages ||
      draftProfile.website
    );
    const hasDivingProfile =
      !!(
        draftProfile.yearsDiving !== null &&
        draftProfile.yearsDiving !== undefined
      ) ||
      !!draftProfile.certifyingAgency ||
      (draftProfile.typicalDivingEnvironment &&
        draftProfile.typicalDivingEnvironment.length > 0) ||
      !!draftProfile.favoriteDiveLocation ||
      (draftProfile.lookingFor && draftProfile.lookingFor.length > 0);
    const hasCertifications = false; // Placeholder - no certifications model yet
    const hasGear = false; // Placeholder - gear exists but not shown in profile yet

    return (
      <>
        {/* Header / Overview */}
        <div className={styles.previewHeader}>
          <Avatar
            firstName={draftProfile.firstName}
            lastName={draftProfile.lastName}
            avatarUrl={draftProfile.avatarUrl}
            fallbackImageUrl={authUser?.image ?? null}
            size="md"
            editable={true}
            onAvatarUpdated={async (newUrl) => {
              // Update local state
              setDraftProfile((prev) => ({ ...prev, avatarUrl: newUrl }));
              setUser((prev) => prev ? { ...prev, avatarUrl: newUrl } : null);
              // Refresh profile data
              await fetchProfile();
            }}
          />
          <div className={styles.previewInfo}>
            <div className={styles.nameRow}>
              <h2 className={styles.fullName}>{fullName}</h2>
              {draftProfile.pronouns && (
                <span className={styles.previewPronouns}>
                  {draftProfile.pronouns}
                </span>
              )}
            </div>
            {metadata && <p className={styles.previewSubtitle}>{metadata}</p>}
            {primaryDiveTypes.length > 0 && (
              <div className={styles.previewTags}>
                {primaryDiveTypes.map((tag) => (
                  <span key={tag} className={styles.previewTag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.previewDivider}></div>

        {/* Section: Basic Info */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Info</h3>
          {!hasBasicInfo ? (
            <p className={styles.emptyState}>
              This user hasn&apos;t shared basic personal details yet.
            </p>
          ) : (
            <div className={styles.previewTiles}>
              {draftProfile.bio && (
                <div
                  className={styles.previewTile}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <div className={styles.previewTileLabel}>About</div>
                  <div className={styles.previewBioText}>
                    {draftProfile.bio}
                  </div>
                </div>
              )}
              {draftProfile.birthday && (
                <div className={styles.previewTile}>
                  <div className={styles.previewTileLabel}>Birthday</div>
                  <div className={styles.previewTileValue}>
                    {formatBirthday(draftProfile.birthday)}
                  </div>
                </div>
              )}
              {draftProfile.languages && (
                <div className={styles.previewTile}>
                  <div className={styles.previewTileLabel}>Languages</div>
                  <div className={styles.previewTileValue}>
                    {draftProfile.languages}
                  </div>
                </div>
              )}
              {draftProfile.website && (
                <div className={styles.previewTile}>
                  <div className={styles.previewTileLabel}>Website</div>
                  <div className={styles.previewTileValue}>
                    <a
                      href={draftProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.previewWebsiteLink}
                    >
                      {displayWebsiteUrl(draftProfile.website)}
                      <span className={styles.previewExternalIcon}>↗</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section: Diving Profile */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Diving Profile</h3>
          {!hasDivingProfile ? (
            <p className={styles.emptyState}>
              This user hasn&apos;t shared their diving preferences yet.
            </p>
          ) : (
            <div className={styles.previewTiles}>
              {draftProfile.yearsDiving !== null &&
                draftProfile.yearsDiving !== undefined && (
                  <div className={styles.previewTile}>
                    <div className={styles.previewTileLabel}>Years Diving</div>
                    <div className={styles.previewTileValue}>
                      {draftProfile.yearsDiving}{" "}
                      {draftProfile.yearsDiving === 1 ? "year" : "years"}
                    </div>
                  </div>
                )}
              {draftProfile.certifyingAgency && (
                <div className={styles.previewTile}>
                  <div className={styles.previewTileLabel}>
                    Certifying Agency
                  </div>
                  <div className={styles.previewTileValue}>
                    {draftProfile.certifyingAgency}
                  </div>
                </div>
              )}
              {draftProfile.typicalDivingEnvironment &&
                draftProfile.typicalDivingEnvironment.length > 0 && (
                  <div className={styles.previewTile}>
                    <div className={styles.previewTileLabel}>
                      Typical Diving Environment
                    </div>
                    <div className={styles.previewTileValue}>
                      {draftProfile.typicalDivingEnvironment.join(", ")}
                    </div>
                  </div>
                )}
              {draftProfile.favoriteDiveLocation && (
                <div className={styles.previewTile}>
                  <div className={styles.previewTileLabel}>
                    Favorite Dive Location
                  </div>
                  <div className={styles.previewTileValue}>
                    {draftProfile.favoriteDiveLocation}
                  </div>
                </div>
              )}
              {draftProfile.lookingFor &&
                draftProfile.lookingFor.length > 0 && (
                  <div className={styles.previewTile}>
                    <div className={styles.previewTileLabel}>Looking For</div>
                    <div className={styles.previewTileValue}>
                      {draftProfile.lookingFor.join(", ")}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Section: Certifications */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Certifications</h3>
          {!hasCertifications ? (
            <p className={styles.emptyState}>
              This user hasn&apos;t added any certifications yet.
            </p>
          ) : (
            <div className={styles.previewTiles}>
              {/* Placeholder for certifications */}
            </div>
          )}
        </div>

        {/* Section: Gear */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Gear</h3>
          {!hasGear ? (
            <p className={styles.emptyState}>
              This user hasn&apos;t shared any gear yet.
            </p>
          ) : (
            <div className={styles.previewTiles}>
              {/* Placeholder for gear */}
            </div>
          )}
        </div>
      </>
    );
  };

  // Render save buttons (used at top and bottom of edit form)
  const renderSaveButtons = () => (
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
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <div className={styles.headerActions}>
          {mode === "view" ? (
            <>
              <button
                onClick={() => setMode("edit")}
                className={buttonStyles.primary}
                type="button"
              >
                Edit Profile
              </button>
              <Link href="/settings" className={buttonStyles.secondary}>
                Settings
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className={buttonStyles.secondary}
                type="button"
              >
                Cancel
              </button>
              <Link href="/settings" className={buttonStyles.secondary}>
                Settings
              </Link>
            </>
          )}
        </div>
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
            {mode === "view" ? (
              renderPublicProfile()
            ) : (
              <>
                {/* Save buttons at top */}
                {isDirty && renderSaveButtons()}

                {/* Section: Basic Info */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Basic Info</h3>
                  <div className={styles.twoColumnGrid}>
                    {/* First Name and Last Name on same row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "var(--space-4)",
                        gridColumn: "1 / -1",
                      }}
                    >
                      {renderEditableField(
                        "firstName",
                        "First Name",
                        "Add your first name",
                        "text",
                        50
                      )}
                      {renderEditableField(
                        "lastName",
                        "Last Name",
                        "Add your last name",
                        "text",
                        50
                      )}
                    </div>
                    {renderEditableField(
                      "pronouns",
                      "Pronouns",
                      "e.g. he/him, she/her, they/them",
                      "text"
                    )}
                    {/* Bio is full width */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      {renderEditableField(
                        "bio",
                        "About",
                        "Add a short personal and/or diving bio",
                        "textarea",
                        500
                      )}
                    </div>
                    {renderEditableField(
                      "birthday",
                      "Birthday",
                      "Add your birthday",
                      "date"
                    )}
                    {renderEditableField(
                      "languages",
                      "Languages",
                      "Add languages (comma-separated)",
                      "text"
                    )}
                    {renderEditableField(
                      "website",
                      "Website",
                      "Add your website",
                      "url"
                    )}
                  </div>
                </div>

                {/* Section: Diving Profile */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Diving Profile</h3>
                  <div className={styles.twoColumnGrid}>
                    {renderMultiSelect(
                      "primaryDiveTypes",
                      "Primary Dive Types",
                      DIVE_TYPES
                    )}
                    {renderEditableField(
                      "yearsDiving",
                      "Years Diving",
                      "Add years of experience",
                      "number"
                    )}
                    {renderSelect(
                      "certifyingAgency",
                      "Certifying Agency",
                      CERTIFYING_AGENCIES,
                      "Select certifying agency"
                    )}
                    {renderSelect(
                      "experienceLevel",
                      "Experience Level",
                      ["Beginner", "Intermediate", "Advanced"] as const,
                      "Select experience level"
                    )}
                    {renderMultiSelect(
                      "typicalDivingEnvironment",
                      "Typical Diving Environment",
                      DIVING_ENVIRONMENTS
                    )}
                    {renderEditableField(
                      "favoriteDiveLocation",
                      "Favorite Dive Location",
                      "Add your favorite dive location",
                      "text"
                    )}
                    {renderMultiSelect(
                      "lookingFor",
                      "Looking For",
                      LOOKING_FOR_OPTIONS
                    )}
                  </div>
                </div>

                {/* Section: Certifications */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Certifications</h3>
                  <p
                    className={styles.emptyState}
                    style={{
                      fontStyle: "italic",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Certification management coming soon.
                  </p>
                </div>

                {/* Section: Gear */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Gear</h3>
                  <p
                    className={styles.emptyState}
                    style={{
                      fontStyle: "italic",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Gear management coming soon.
                  </p>
                </div>

                {/* Save buttons at bottom */}
                {isDirty && renderSaveButtons()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
