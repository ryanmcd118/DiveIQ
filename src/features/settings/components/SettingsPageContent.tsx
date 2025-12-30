"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import type { UnitPreferences } from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import layoutStyles from "@/styles/components/Layout.module.css";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { LinkGoogleModal } from "./LinkGoogleModal";
import styles from "./SettingsPageContent.module.css";

interface UserAccountInfo {
  hasPassword: boolean;
  hasGoogle: boolean;
}

export function SettingsPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showLinkGoogleModal, setShowLinkGoogleModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [accountInfo, setAccountInfo] = useState<UserAccountInfo | null>(null);
  const [isLoadingAccountInfo, setIsLoadingAccountInfo] = useState(true);

  // Use unit preferences hook
  const { prefs, setPrefs, isLoading: prefsLoading } = useUnitPreferences();

  // Draft state for unit preferences (only for logged-in users)
  const [draftPrefs, setDraftPrefs] = useState<UnitPreferences | null>(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Initialize draft from saved prefs when they load
  useEffect(() => {
    if (!prefsLoading && prefs) {
      setDraftPrefs(prefs);
    }
  }, [prefs, prefsLoading]);

  // Check if draft has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!draftPrefs || prefsLoading) return false;
    return (
      draftPrefs.depth !== prefs.depth ||
      draftPrefs.temperature !== prefs.temperature ||
      draftPrefs.pressure !== prefs.pressure ||
      draftPrefs.weight !== prefs.weight
    );
  }, [draftPrefs, prefs, prefsLoading]);

  // Handle saving unit preferences
  const handleSavePrefs = async () => {
    if (!draftPrefs || !hasUnsavedChanges) return;

    setIsSavingPrefs(true);
    try {
      await setPrefs(draftPrefs);
      setToastMessage("Unit preferences saved ✅");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setToastMessage("Failed to save preferences");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Handle canceling unit preference changes
  const handleCancelPrefs = () => {
    setDraftPrefs(prefs);
  };

  const [notifications, setNotifications] = useState({
    productUpdates: false,
    diveSafetyTips: false,
  });

  // Fetch account info to check password/Google status
  const fetchAccountInfo = async () => {
    try {
      const response = await fetch("/api/me");
      if (response.ok) {
        const data = await response.json();
        setAccountInfo({
          hasPassword: data.hasPassword || false,
          hasGoogle: data.hasGoogle || false,
        });
      }
    } catch (error) {
      console.error("Error fetching account info:", error);
    } finally {
      setIsLoadingAccountInfo(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchAccountInfo();
    } else {
      // Reset account info when logged out
      setAccountInfo(null);
      setIsLoadingAccountInfo(false);
    }
  }, [session?.user?.id]);

  // Handle OAuth callback success/error
  useEffect(() => {
    const linked = searchParams.get("linked");
    const error = searchParams.get("error");

    if (linked === "google") {
      // Refresh account info to show updated status
      fetchAccountInfo();
      setToastMessage("Google account linked successfully!");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        // Remove query params from URL
        router.replace("/settings");
      }, 3000);
    } else if (error) {
      // Handle NextAuth errors
      let errorMessage = "Failed to link Google account.";
      if (error === "OAuthAccountNotLinked") {
        errorMessage =
          "This Google account is already linked to another DiveIQ account.";
      } else if (error === "OAuthSignin") {
        errorMessage = "Error occurred during Google sign-in.";
      } else if (error === "OAuthCallback") {
        errorMessage = "Error occurred during Google callback.";
      }
      setToastMessage(errorMessage);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        // Remove query params from URL
        router.replace("/settings");
      }, 5000);
    }
  }, [searchParams, router]);

  const hasPassword = accountInfo?.hasPassword ?? false;
  const hasGoogle = accountInfo?.hasGoogle ?? false;

  const email = session?.user?.email || "";

  const handlePasswordChangeSuccess = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.pageContent}>
        <div className={layoutStyles.pageHeader}>
          <div>
            <h1 className={layoutStyles.pageTitle}>Settings</h1>
            <p className={layoutStyles.pageSubtitle}>
              Manage your account and preferences.
            </p>
          </div>
        </div>

        <div className={styles.content}>
          {/* Account Section */}
          <section className={cardStyles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Account</h2>
              <p className={styles.sectionDescription}>
                Manage your account information and sign-in methods.
              </p>
            </div>

            <div className={styles.settingsList}>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label>Email</label>
                </div>
                <div className={styles.settingControl}>
                  <span className={styles.readOnlyValue}>{email}</span>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label>Link Google account</label>
                </div>
                <div className={styles.settingControl}>
                  {isLoadingAccountInfo ? (
                    <span className={styles.helperText}>Loading...</span>
                  ) : hasGoogle ? (
                    <span className={styles.badge}>
                      <svg
                        className={styles.badgeIcon}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google linked
                    </span>
                  ) : hasPassword ? (
                    <button
                      type="button"
                      onClick={() => setShowLinkGoogleModal(true)}
                      className={styles.googleLinkButton}
                    >
                      <svg
                        className={styles.googleLinkIcon}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Link Google account
                    </button>
                  ) : (
                    <div className={styles.settingControlColumn}>
                      <button
                        type="button"
                        className={buttonStyles.disabled}
                        disabled
                      >
                        Link Google account
                      </button>
                      <span className={styles.helperText}>
                        Create a password first to link Google
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label>Change password</label>
                </div>
                <div className={styles.settingControl}>
                  {isLoadingAccountInfo ? (
                    <span className={styles.helperText}>Loading...</span>
                  ) : hasPassword ? (
                    <button
                      type="button"
                      onClick={() => setShowChangePasswordModal(true)}
                      className={buttonStyles.primary}
                    >
                      Change password
                    </button>
                  ) : (
                    <div className={styles.settingControlColumn}>
                      <button
                        type="button"
                        className={buttonStyles.disabled}
                        disabled
                      >
                        Change password
                      </button>
                      <span className={styles.helperText}>
                        {hasGoogle
                          ? "Password not set for Google-only accounts"
                          : "Password not set"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Units Section */}
          <section className={cardStyles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Units</h2>
              <p className={styles.sectionDescription}>
                Configure your preferred measurement units.
              </p>
            </div>

            <div className={styles.settingsList}>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label htmlFor="units-depth">Depth</label>
                </div>
                <div className={styles.settingControl}>
                  <select
                    id="units-depth"
                    value={draftPrefs?.depth ?? prefs.depth}
                    onChange={(e) =>
                      setDraftPrefs((prev: UnitPreferences | null) =>
                        prev
                          ? { ...prev, depth: e.target.value as "ft" | "m" }
                          : null
                      )
                    }
                    className={formStyles.select}
                    disabled={prefsLoading || !draftPrefs}
                  >
                    <option value="m">Meters</option>
                    <option value="ft">Feet</option>
                  </select>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label htmlFor="units-temperature">Temperature</label>
                </div>
                <div className={styles.settingControl}>
                  <select
                    id="units-temperature"
                    value={draftPrefs?.temperature ?? prefs.temperature}
                    onChange={(e) =>
                      setDraftPrefs((prev: UnitPreferences | null) =>
                        prev
                          ? {
                              ...prev,
                              temperature: e.target.value as "f" | "c",
                            }
                          : null
                      )
                    }
                    className={formStyles.select}
                    disabled={prefsLoading || !draftPrefs}
                  >
                    <option value="c">°C</option>
                    <option value="f">°F</option>
                  </select>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label htmlFor="units-pressure">Pressure</label>
                </div>
                <div className={styles.settingControl}>
                  <select
                    id="units-pressure"
                    value={draftPrefs?.pressure ?? prefs.pressure}
                    onChange={(e) =>
                      setDraftPrefs((prev: UnitPreferences | null) =>
                        prev
                          ? {
                              ...prev,
                              pressure: e.target.value as "bar" | "psi",
                            }
                          : null
                      )
                    }
                    className={formStyles.select}
                    disabled={prefsLoading || !draftPrefs}
                  >
                    <option value="bar">Bar</option>
                    <option value="psi">PSI</option>
                  </select>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label htmlFor="units-weight">Weight</label>
                </div>
                <div className={styles.settingControl}>
                  <select
                    id="units-weight"
                    value={draftPrefs?.weight ?? prefs.weight}
                    onChange={(e) =>
                      setDraftPrefs((prev: UnitPreferences | null) =>
                        prev
                          ? { ...prev, weight: e.target.value as "kg" | "lb" }
                          : null
                      )
                    }
                    className={formStyles.select}
                    disabled={prefsLoading || !draftPrefs}
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save/Cancel buttons */}
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                marginTop: "var(--space-4)",
                justifyContent: "flex-end",
              }}
            >
              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleCancelPrefs}
                  className={buttonStyles.secondary}
                  disabled={isSavingPrefs}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSavePrefs}
                className={buttonStyles.primary}
                disabled={!hasUnsavedChanges || isSavingPrefs || prefsLoading}
              >
                {isSavingPrefs ? "Saving..." : "Save"}
              </button>
            </div>

            <p className={styles.helperTextNote}>
              These preferences will apply across your account when saved. You
              can always change them later.
            </p>
          </section>

          {/* Notifications Section */}
          <section className={cardStyles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              <p className={styles.sectionDescription}>
                Choose which email notifications you want to receive.
              </p>
            </div>

            <div className={styles.settingsList}>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label htmlFor="notif-product">DiveIQ updates</label>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input
                      id="notif-product"
                      type="checkbox"
                      checked={notifications.productUpdates}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          productUpdates: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label htmlFor="notif-safety">Dive tips and resources</label>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input
                      id="notif-safety"
                      type="checkbox"
                      checked={notifications.diveSafetyTips}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          diveSafetyTips: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section className={cardStyles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Danger Zone</h2>
              <p className={styles.sectionDescription}>
                Permanently delete your account and all associated data.
              </p>
            </div>

            <div className={styles.dangerContent}>
              <p className={styles.dangerWarning}>
                <strong>This action cannot be undone.</strong> This will
                permanently delete your account and remove all of your data from
                our servers.
              </p>
              <div className={styles.dangerAction}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className={buttonStyles.danger}
                >
                  Delete account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

      {showChangePasswordModal && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}

      <LinkGoogleModal
        isOpen={showLinkGoogleModal}
        onClose={() => setShowLinkGoogleModal(false)}
      />

      {showToast && (
        <div className={styles.toast}>
          <div className={styles.toastContent}>
            <span style={{ fontSize: "var(--font-size-lg)" }}>
              {toastMessage.includes("successfully") ? "✅" : "❌"}
            </span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
