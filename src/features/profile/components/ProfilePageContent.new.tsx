"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
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
  favoriteDiveType: string | null;
  favoriteDiveLocation: string | null;
  birthday: string | null;
}

interface UserData {
  firstName: string | null;
  lastName: string | null;
  email: string;
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

type EditMode = "edit" | "preview";

export function ProfilePageContent() {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<EditMode>("edit");
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  const [draftProfile, setDraftProfile] = useState<ProfileData>({
    firstName: null,
    lastName: null,
    location: null,
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
    favoriteDiveType: null,
    favoriteDiveLocation: null,
    birthday: null,
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
    const norm = (v: string | number | string[] | null | undefined) => {
      if (Array.isArray(v)) return stringifyJsonArray(v);
      if (typeof v === "number") return v;
      return normalizeValue(v ?? null);
    };
    return (
      norm(draftProfile.firstName) !== norm(originalProfile.firstName) ||
      norm(draftProfile.lastName) !== norm(originalProfile.lastName) ||
      norm(draftProfile.location) !== norm(originalProfile.location) ||
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
      norm(draftProfile.favoriteDiveType) !==
        norm(originalProfile.favoriteDiveType) ||
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
      });
      const profileData: ProfileData = {
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        location: data.user.location || null,
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
        favoriteDiveType: data.user.favoriteDiveType || null,
        favoriteDiveLocation: data.user.favoriteDiveLocation || null,
        birthday: normalizeDate(
          data.user.birthday
            ? new Date(data.user.birthday).toISOString().split("T")[0]
            : null
        ),
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
    if (mode === "preview") return;
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
    value: ProfileData[keyof ProfileData]
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
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const normalizedData: {
        firstName: string | null;
        lastName: string | null;
        location: string | null;
        homeDiveRegion: string | null;
        website: string | null;
        languages: string | null;
        bio: string | null;
        primaryDiveTypes: string | null;
        experienceLevel: string | null;
        yearsDiving: number | null;
        certifyingAgency: string | null;
        typicalDivingEnvironment: string | null;
        lookingFor: string | null;
        favoriteDiveType: string | null;
        favoriteDiveLocation: string | null;
        birthday: string | null;
      } = {
        firstName: normalizeValue(draftProfile.firstName),
        lastName: normalizeValue(draftProfile.lastName),
        location: normalizeValue(draftProfile.location),
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
        favoriteDiveType: normalizeValue(draftProfile.favoriteDiveType),
        favoriteDiveLocation: normalizeValue(draftProfile.favoriteDiveLocation),
        birthday: normalizeValue(draftProfile.birthday),
      };

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
      if (normalizedData.bio && normalizedData.bio.length > 500) {
        setError("Bio must be 500 characters or less");
        setSaving(false);
        return;
      }
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
      });

      const updatedProfile: ProfileData = {
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        location: data.user.location || null,
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
        favoriteDiveType: data.user.favoriteDiveType || null,
        favoriteDiveLocation: data.user.favoriteDiveLocation || null,
        birthday: normalizeDate(
          data.user.birthday
            ? new Date(data.user.birthday).toISOString().split("T")[0]
            : null
        ),
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
    const isEditing = editingField === field;

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
        {isEditing ? (
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
        ) : (
          <div
            className={`${styles.fieldValue} ${styles.fieldValueClickable}`}
            onClick={() => handleFieldClick(field)}
          >
            {selected.length > 0 ? (
              <div className={styles.tagContainer}>
                {selected.map((tag) => (
                  <span
                    key={tag}
                    className={`${styles.tag} ${styles.tagSelected}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className={styles.fieldPlaceholder}>
                Add {label.toLowerCase()}
              </span>
            )}
          </div>
        )}
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
    const isEditing = editingField === field;
    const isEmpty = !value;

    return (
      <div className={styles.fieldRow}>
        <div className={styles.fieldLabel}>{label}</div>
        {isEditing ? (
          <select
            ref={(el) => {
              if (el) inputRefs.current[field] = el;
            }}
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value || null)}
            onBlur={handleFieldBlur}
            className={styles.fieldInput}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
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

  // Render public profile preview
  const renderPublicPreview = () => {
    const fullName =
      [draftProfile.firstName, draftProfile.lastName]
        .filter(Boolean)
        .join(" ") || displayName;

    const metadataParts: string[] = [];
    if (draftProfile.location) metadataParts.push(draftProfile.location);
    if (draftProfile.homeDiveRegion)
      metadataParts.push(draftProfile.homeDiveRegion);
    if (draftProfile.experienceLevel)
      metadataParts.push(draftProfile.experienceLevel);
    const metadata = metadataParts.join(" · ");

    const primaryDiveTypes = draftProfile.primaryDiveTypes || [];

    const tiles: Array<{ label: string; value: string | ReactNode }> = [];
    if (
      draftProfile.yearsDiving !== null &&
      draftProfile.yearsDiving !== undefined
    ) {
      tiles.push({
        label: "Years Diving",
        value: `${draftProfile.yearsDiving} ${draftProfile.yearsDiving === 1 ? "year" : "years"}`,
      });
    }
    if (draftProfile.certifyingAgency) {
      tiles.push({
        label: "Certifying Agency",
        value: draftProfile.certifyingAgency,
      });
    }
    if (
      draftProfile.typicalDivingEnvironment &&
      draftProfile.typicalDivingEnvironment.length > 0
    ) {
      tiles.push({
        label: "Typical Diving Environment",
        value: draftProfile.typicalDivingEnvironment.join(", "),
      });
    }
    if (draftProfile.lookingFor && draftProfile.lookingFor.length > 0) {
      tiles.push({
        label: "Looking For",
        value: draftProfile.lookingFor.join(", "),
      });
    }
    if (draftProfile.languages) {
      tiles.push({ label: "Languages", value: draftProfile.languages });
    }
    if (draftProfile.website) {
      const websiteDisplay = displayWebsiteUrl(draftProfile.website);
      tiles.push({
        label: "Website",
        value: (
          <a
            href={draftProfile.website}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.previewWebsiteLink}
          >
            {websiteDisplay}
            <span className={styles.previewExternalIcon}>↗</span>
          </a>
        ),
      });
    }

    const hasBio = draftProfile.bio && draftProfile.bio.trim();
    const hasAnyFields = tiles.length > 0 || hasBio;

    return (
      <>
        <div className={styles.previewHeader}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.previewInfo}>
            <h2 className={styles.previewName}>{fullName}</h2>
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

        {!hasAnyFields && (
          <div className={styles.previewEmpty}>
            <p>This diver hasn&apos;t shared any profile details yet.</p>
          </div>
        )}

        {hasAnyFields && (
          <>
            {tiles.length > 0 && (
              <div className={styles.previewTiles}>
                {tiles.map((tile) => (
                  <div key={tile.label} className={styles.previewTile}>
                    <div className={styles.previewTileLabel}>{tile.label}</div>
                    <div className={styles.previewTileValue}>{tile.value}</div>
                  </div>
                ))}
              </div>
            )}

            {hasBio && (
              <div className={styles.previewBioSection}>
                <div className={styles.previewTileLabel}>About</div>
                <div className={styles.previewBioText}>{draftProfile.bio}</div>
              </div>
            )}
          </>
        )}
      </>
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
            {mode === "preview" ? (
              renderPublicPreview()
            ) : (
              <>
                <div className={styles.profileHeader}>
                  <div className={styles.avatar}>{initials}</div>
                  <div className={styles.profileInfo}>
                    <h2 className={styles.nameLarge}>{displayName}</h2>
                    <p className={styles.email}>{user?.email}</p>
                  </div>
                </div>

                {/* Section 1: Basic Information */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Basic Information</h3>
                  <div className={styles.twoColumnGrid}>
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
                    {renderEditableField(
                      "location",
                      "Location (City, Country)",
                      "Add your location",
                      "text"
                    )}
                    {renderEditableField(
                      "homeDiveRegion",
                      "Home Dive Region",
                      "Add your home dive region",
                      "text"
                    )}
                    {renderEditableField(
                      "website",
                      "Website",
                      "Add your website",
                      "url"
                    )}
                    {renderEditableField(
                      "languages",
                      "Languages",
                      "Add languages (comma-separated)",
                      "text"
                    )}
                  </div>
                </div>

                {/* Section 2: About You */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>About You</h3>
                  {renderEditableField(
                    "bio",
                    "About",
                    "Add a short personal and/or diving bio",
                    "textarea",
                    500
                  )}
                </div>

                {/* Section 3: Diving Profile */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Diving Profile</h3>
                  <div className={styles.twoColumnGrid}>
                    {renderMultiSelect(
                      "primaryDiveTypes",
                      "Primary Dive Types",
                      DIVE_TYPES
                    )}
                    {renderSelect(
                      "experienceLevel",
                      "Experience Level",
                      ["Beginner", "Intermediate", "Advanced"] as const,
                      "Select experience level"
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
                    {renderMultiSelect(
                      "typicalDivingEnvironment",
                      "Typical Diving Environment",
                      DIVING_ENVIRONMENTS
                    )}
                    {renderMultiSelect(
                      "lookingFor",
                      "Looking For",
                      LOOKING_FOR_OPTIONS
                    )}
                  </div>
                </div>

                {/* Section 4: Additional Details (Collapsible) */}
                <div className={styles.section}>
                  <button
                    type="button"
                    className={styles.sectionToggle}
                    onClick={() =>
                      setShowAdditionalDetails(!showAdditionalDetails)
                    }
                  >
                    <h3 className={styles.sectionTitle}>Additional Details</h3>
                    <ChevronDown
                      className={`${styles.chevron} ${showAdditionalDetails ? styles.chevronOpen : ""}`}
                    />
                  </button>
                  {showAdditionalDetails && (
                    <div className={styles.twoColumnGrid}>
                      {renderEditableField(
                        "favoriteDiveType",
                        "Favorite Dive Type",
                        "Add your favorite dive type",
                        "text"
                      )}
                      {renderEditableField(
                        "favoriteDiveLocation",
                        "Favorite Dive Location",
                        "Add your favorite dive location",
                        "text"
                      )}
                      {renderEditableField(
                        "birthday",
                        "Birthday",
                        "Add your birthday",
                        "date"
                      )}
                    </div>
                  )}
                </div>

                {/* Save/Cancel Footer */}
                {isDirty && (
                  <div className={styles.footer}>
                    {error && <div className={styles.footerError}>{error}</div>}
                    {success && (
                      <div className={styles.footerSuccess}>
                        Profile updated
                      </div>
                    )}
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
          </>
        )}
      </div>
    </div>
  );
}
