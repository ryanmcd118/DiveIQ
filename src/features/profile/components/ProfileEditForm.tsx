"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar/Avatar";
import type { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import {
  DIVE_TYPES,
  DIVING_ENVIRONMENTS,
  LOOKING_FOR_OPTIONS,
  CERTIFYING_AGENCIES,
  type ProfileData,
  type ProfileFieldValue,
} from "../types";
import styles from "./ProfileEditForm.module.css";

interface Props {
  draftProfile: ProfileData;
  displayName: string;
  authUserImage: string | null;
  isDirty: boolean;
  saving: boolean;
  error: string | null;
  success: boolean;
  editingField: string | null;
  inputRefs: React.MutableRefObject<
    Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  >;
  kits: GearKitWithItems[];
  profileKitIds: string[];
  setProfileKitIds: React.Dispatch<React.SetStateAction<string[]>>;
  kitsLoading: boolean;
  onFieldClick: (field: string) => void;
  onFieldChange: (field: keyof ProfileData, value: ProfileFieldValue) => void;
  onFieldBlur: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onAvatarUpdated: (newUrl: string | null) => void;
}

export function ProfileEditForm({
  draftProfile,
  displayName,
  authUserImage,
  isDirty,
  saving,
  error,
  success,
  editingField,
  inputRefs,
  kits,
  profileKitIds,
  setProfileKitIds,
  kitsLoading,
  onFieldClick,
  onFieldChange,
  onFieldBlur,
  onCancel,
  onSave,
  onAvatarUpdated,
}: Props) {
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
      onFieldChange(field, updated.length > 0 ? updated : null);
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
          onChange={(e) => onFieldChange(field, e.target.value || null)}
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
                  onChange={(e) => onFieldChange(field, e.target.value)}
                  onBlur={onFieldBlur}
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
                  onFieldChange(
                    field,
                    type === "number"
                      ? e.target.value === ""
                        ? null
                        : Number(e.target.value)
                      : e.target.value
                  )
                }
                onBlur={onFieldBlur}
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
            onClick={() => onFieldClick(field)}
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

  const renderSaveButtons = () => (
    <div className={styles.footer}>
      {error && <div className={styles.footerError}>{error}</div>}
      {success && <div className={styles.footerSuccess}>Profile updated</div>}
      <div className={styles.footerActions}>
        <button
          onClick={onCancel}
          className={buttonStyles.secondary}
          type="button"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
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
    <>
      {/* Save buttons at top */}
      {isDirty && renderSaveButtons()}

      {/* Edit Mode Header with Avatar */}
      <div className={styles.previewHeader}>
        <Avatar
          firstName={draftProfile.firstName}
          lastName={draftProfile.lastName}
          avatarUrl={draftProfile.avatarUrl}
          fallbackImageUrl={authUserImage}
          size="md"
          editable={true}
          onAvatarUpdated={onAvatarUpdated}
        />
        <div className={styles.previewInfo}>
          <div className={styles.nameRow}>
            <h2 className={styles.fullName}>
              {[draftProfile.firstName, draftProfile.lastName]
                .filter(Boolean)
                .join(" ") || displayName}
            </h2>
          </div>
          <p className={styles.previewSubtitle}>Edit your profile</p>
        </div>
      </div>

      <div className={styles.previewDivider}></div>

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
          {renderEditableField("website", "Website", "Add your website", "url")}
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
          {renderMultiSelect("lookingFor", "Looking For", LOOKING_FOR_OPTIONS)}
        </div>
      </div>

      {/* Section: Profile Visibility */}
      <div className={`${cardStyles.card} ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Profile visibility</h3>
          <p className={styles.sectionDescription}>
            Choose what&apos;s shown on your public profile.
          </p>
        </div>

        <div className={styles.settingsList}>
          {/* Certifications Toggle */}
          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <label htmlFor="profile-visibility-certs">
                Show certifications on profile
              </label>
            </div>
            <div className={styles.settingControl}>
              <label className={styles.toggle}>
                <input
                  id="profile-visibility-certs"
                  type="checkbox"
                  checked={draftProfile.showCertificationsOnProfile}
                  onChange={(e) =>
                    onFieldChange(
                      "showCertificationsOnProfile",
                      e.target.checked
                    )
                  }
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
          <div style={{ marginTop: "var(--space-1)", marginLeft: "0" }}>
            <p className={styles.helperText}>
              Displays your certifications section on your profile.
            </p>
          </div>

          {/* Gear Toggle */}
          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <label htmlFor="profile-visibility-gear">
                Show gear on profile
              </label>
            </div>
            <div className={styles.settingControl}>
              <label className={styles.toggle}>
                <input
                  id="profile-visibility-gear"
                  type="checkbox"
                  checked={draftProfile.showGearOnProfile}
                  onChange={(e) =>
                    onFieldChange("showGearOnProfile", e.target.checked)
                  }
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
          <div style={{ marginTop: "var(--space-1)", marginLeft: "0" }}>
            <p className={styles.helperText}>
              Displays your gear section on your profile.
            </p>
          </div>

          {/* Kit selection checklist - only show when toggle is ON */}
          {draftProfile.showGearOnProfile && (
            <div style={{ marginTop: "var(--space-4)", marginLeft: "0" }}>
              <h4
                style={{
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-medium)",
                  marginBottom: "var(--space-2)",
                  color: "var(--color-text-primary)",
                }}
              >
                Choose kits to display
              </h4>

              {kitsLoading ? (
                <p className={styles.helperText}>Loading kits...</p>
              ) : kits.length === 0 ? (
                <p className={styles.helperText}>
                  <Link
                    href="/gear"
                    style={{
                      color: "var(--color-primary)",
                      textDecoration: "underline",
                    }}
                  >
                    Add a kit
                  </Link>{" "}
                  to get started.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  {kits.map((kit) => {
                    const itemCount = kit.kitItems?.length || 0;
                    const isChecked = profileKitIds.includes(kit.id);

                    return (
                      <label
                        key={kit.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "var(--space-2)",
                          cursor: "pointer",
                          padding: "var(--space-2)",
                          borderRadius: "var(--radius-sm)",
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--color-surface-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfileKitIds([...profileKitIds, kit.id]);
                            } else {
                              setProfileKitIds(
                                profileKitIds.filter((id) => id !== kit.id)
                              );
                            }
                          }}
                          style={{
                            marginTop: "2px",
                            cursor: "pointer",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "var(--font-size-sm)",
                              color: "var(--color-text-primary)",
                              fontWeight: "var(--font-weight-medium)",
                            }}
                          >
                            {kit.name}
                          </div>
                          <div
                            style={{
                              fontSize: "var(--font-size-xs)",
                              color: "var(--color-text-secondary)",
                              marginTop: "2px",
                            }}
                          >
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {draftProfile.showGearOnProfile &&
                profileKitIds.length === 0 &&
                kits.length > 0 && (
                  <p
                    style={{
                      marginTop: "var(--space-2)",
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-secondary)",
                      fontStyle: "italic",
                    }}
                  >
                    No kits selected — your gear section won&apos;t appear yet.
                  </p>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Save buttons at bottom */}
      {isDirty && renderSaveButtons()}
    </>
  );
}
