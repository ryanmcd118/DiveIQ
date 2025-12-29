"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import layoutStyles from "@/styles/components/Layout.module.css";
import { DeleteAccountModal } from "./DeleteAccountModal";
import styles from "./SettingsPageContent.module.css";

export function SettingsPageContent() {
  const { data: session } = useSession();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Local state for settings (not persisted yet)
  const [units, setUnits] = useState({
    depth: "meters" as "meters" | "feet",
    temperature: "celsius" as "celsius" | "fahrenheit",
    pressure: "bar" as "bar" | "psi",
    weight: "kg" as "kg" | "lb",
  });

  const [notifications, setNotifications] = useState({
    productUpdates: false,
    diveSafetyTips: false,
  });

  const [safety, setSafety] = useState({
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalNotes: "",
  });

  // TODO: Fetch account providers from API in Prompt 2/3
  // For now, we infer from session data
  // If user has email, assume they can have password (even if not set)
  // Check session for Google OAuth indicator if available
  // Need to query Account model to determine which providers are linked
  const hasPassword = true; // TODO: Check if user has password set via /api/user/accounts or similar endpoint
  const hasGoogle = false; // TODO: Check if user has Google account linked via /api/user/accounts or similar endpoint

  const email = session?.user?.email || "";

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
                  <label>Sign-in methods</label>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.badgeContainer}>
                    {hasPassword && (
                      <span className={styles.badge}>Password</span>
                    )}
                    {hasGoogle && (
                      <span className={styles.badge}>Google</span>
                    )}
                    {!hasPassword && !hasGoogle && (
                      <span className={styles.badgePlaceholder}>
                        No methods configured
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label>Link Google account</label>
                </div>
                <div className={styles.settingControl}>
                  <button
                    type="button"
                    className={buttonStyles.disabled}
                    disabled
                  >
                    Coming soon
                  </button>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label>Change password</label>
                </div>
                <div className={styles.settingControl}>
                  {hasPassword ? (
                    <button
                      type="button"
                      className={buttonStyles.disabled}
                      disabled
                    >
                      Coming soon
                    </button>
                  ) : (
                    <span className={styles.helperText}>
                      Password not set
                    </span>
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
                    value={units.depth}
                    onChange={(e) =>
                      setUnits({ ...units, depth: e.target.value as "meters" | "feet" })
                    }
                    className={formStyles.select}
                    disabled
                  >
                    <option value="meters">Meters</option>
                    <option value="feet">Feet</option>
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
                    value={units.temperature}
                    onChange={(e) =>
                      setUnits({
                        ...units,
                        temperature: e.target.value as "celsius" | "fahrenheit",
                      })
                    }
                    className={formStyles.select}
                    disabled
                  >
                    <option value="celsius">°C</option>
                    <option value="fahrenheit">°F</option>
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
                    value={units.pressure}
                    onChange={(e) =>
                      setUnits({
                        ...units,
                        pressure: e.target.value as "bar" | "psi",
                      })
                    }
                    className={formStyles.select}
                    disabled
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
                    value={units.weight}
                    onChange={(e) =>
                      setUnits({
                        ...units,
                        weight: e.target.value as "kg" | "lb",
                      })
                    }
                    className={formStyles.select}
                    disabled
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
            </div>

            <p className={styles.helperText}>
              These preferences will apply across DiveIQ.
            </p>
            <p className={styles.helperTextNote}>
              Note: Settings are not yet saved. TODO: Implement unit preferences API in Prompt 2/3.
            </p>
          </section>

          {/* Notifications Section */}
          <section className={cardStyles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              <p className={styles.sectionDescription}>
                Choose which notifications you want to receive.
              </p>
            </div>

            <div className={styles.settingsList}>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label htmlFor="notif-product">Product updates</label>
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
                      disabled
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <label htmlFor="notif-safety">Dive safety tips</label>
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
                      disabled
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </div>

            <p className={styles.helperTextNote}>
              TODO: Implement notification preferences API in Prompt 2/3.
            </p>
          </section>

          {/* Safety & Emergency Section */}
          <section className={cardStyles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Safety & Emergency</h2>
              <p className={styles.sectionDescription}>
                Emergency contact information and medical notes.
              </p>
            </div>

            <div className={styles.settingsList}>
              <div className={styles.settingRow}>
                <div className={formStyles.field}>
                  <label htmlFor="safety-contact-name" className={formStyles.label}>
                    Emergency contact name
                  </label>
                  <input
                    id="safety-contact-name"
                    type="text"
                    value={safety.emergencyContactName}
                    onChange={(e) =>
                      setSafety({ ...safety, emergencyContactName: e.target.value })
                    }
                    className={formStyles.input}
                    disabled
                  />
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={formStyles.field}>
                  <label htmlFor="safety-contact-phone" className={formStyles.label}>
                    Emergency contact phone
                  </label>
                  <input
                    id="safety-contact-phone"
                    type="tel"
                    value={safety.emergencyContactPhone}
                    onChange={(e) =>
                      setSafety({ ...safety, emergencyContactPhone: e.target.value })
                    }
                    className={formStyles.input}
                    disabled
                  />
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={formStyles.field}>
                  <label htmlFor="safety-medical-notes" className={formStyles.label}>
                    Medical notes
                  </label>
                  <textarea
                    id="safety-medical-notes"
                    value={safety.medicalNotes}
                    onChange={(e) =>
                      setSafety({ ...safety, medicalNotes: e.target.value })
                    }
                    className={formStyles.textarea}
                    rows={4}
                    disabled
                  />
                </div>
              </div>
            </div>

            <p className={styles.helperTextNote}>
              TODO: Implement safety & emergency contact API in Prompt 2/3.
            </p>
          </section>

          {/* Danger Zone Section */}
          <section className={`${cardStyles.card} ${styles.dangerZone}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Danger Zone</h2>
              <p className={styles.sectionDescription}>
                Permanently delete your account and all associated data.
              </p>
            </div>

            <div className={styles.dangerContent}>
              <p className={styles.dangerWarning}>
                Warning: This action cannot be undone. This will permanently delete your
                account and remove all of your data from our servers.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className={buttonStyles.danger}
              >
                Delete account
              </button>
            </div>
          </section>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

