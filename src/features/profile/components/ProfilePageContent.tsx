"use client";

import Link from "next/link";
import { useProfileForm } from "../hooks/useProfileForm";
import { formatUserName } from "../utils/profileUtils";
import { ProfileViewSection } from "./ProfileViewSection";
import { ProfileEditForm } from "./ProfileEditForm";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./ProfilePageContent.module.css";

export function ProfilePageContent() {
  const {
    authUser,
    user,
    loading,
    error,
    saving,
    success,
    mode,
    setMode,
    draftProfile,
    isDirty,
    kits,
    profileKitIds,
    setProfileKitIds,
    kitsLoading,
    editingField,
    inputRefs,
    handleFieldClick,
    handleFieldChange,
    handleFieldBlur,
    handleCancel,
    handleSave,
    handleAvatarUpdated,
    fetchProfile,
  } = useProfileForm();

  const displayName = formatUserName(user);

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
              <ProfileViewSection
                draftProfile={draftProfile}
                displayName={displayName}
                authUserImage={authUser?.image ?? null}
              />
            ) : (
              <ProfileEditForm
                draftProfile={draftProfile}
                displayName={displayName}
                authUserImage={authUser?.image ?? null}
                isDirty={isDirty}
                saving={saving}
                error={error}
                success={success}
                editingField={editingField}
                inputRefs={inputRefs}
                kits={kits}
                profileKitIds={profileKitIds}
                setProfileKitIds={setProfileKitIds}
                kitsLoading={kitsLoading}
                onFieldClick={handleFieldClick}
                onFieldChange={handleFieldChange}
                onFieldBlur={handleFieldBlur}
                onCancel={handleCancel}
                onSave={handleSave}
                onAvatarUpdated={handleAvatarUpdated}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
