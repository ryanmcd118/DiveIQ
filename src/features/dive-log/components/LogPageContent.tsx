"use client";

import Link from "next/link";
import { useLogPageState } from "../hooks/useLogPageState";
import { DiveLogForm } from "./DiveLogForm";
import DiveLogList from "./DiveLogList";
import layoutStyles from "@/styles/components/Layout.module.css";
import gridStyles from "@/styles/components/PageGrid.module.css";
import listStyles from "@/styles/components/List.module.css";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import backgroundStyles from "@/styles/components/Background.module.css";

export function LogPageContent() {
  const {
    entries,
    saving,
    loading,
    error,
    isAuthenticated,
    editingEntryId,
    activeEntry,
    formKey,
    statusMessage,
    totalBottomTime,
    selectedGearIds,
    setSelectedGearIds,
    handleSubmit,
    handleSelectEntry,
    handleCancelEdit,
    handleDeleteFromForm,
    handleDeleteFromList,
  } = useLogPageState();

  // Show sign-in prompt for unauthenticated users
  if (!loading && !isAuthenticated) {
    return (
      <main
        className={`${layoutStyles.page} ${backgroundStyles.pageGradientSubtle}`}
      >
        <div className={layoutStyles.pageContent}>
          <header className={layoutStyles.pageHeader}>
            <div>
              <h1 className={layoutStyles.pageTitle}>Dive Log</h1>
              <p className={layoutStyles.pageSubtitle}>
                Sign in to start logging your dives and tracking your underwater
                adventures.
              </p>
            </div>
          </header>
          <div
            className={cardStyles.card}
            style={{ textAlign: "center", padding: "var(--space-8)" }}
          >
            <p style={{ marginBottom: "var(--space-4)" }}>
              Create an account or sign in to access your personal dive log.
            </p>
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                justifyContent: "center",
              }}
            >
              <Link href="/signup" className={buttonStyles.primaryGradient}>
                Create account
              </Link>
              <Link href="/signin" className={buttonStyles.secondaryText}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`${layoutStyles.page} ${backgroundStyles.pageGradientSubtle}`}
    >
      <div className={gridStyles.logPageGrid}>
        {/* Left: log form */}
        <section className={gridStyles.section}>
          <header
            className={layoutStyles.pageHeader}
            style={{
              paddingBottom: "var(--space-6)",
              marginBottom: "var(--space-6)",
            }}
          >
            <div>
              <h1 className={layoutStyles.pageTitle}>Dive Log</h1>
              <p className={layoutStyles.pageSubtitle}>
                Capture the essentials from each dive: conditions, depth, time,
                and notes. This will eventually feed stats and visualizations in
                your DiveIQ logbook.
              </p>
            </div>
          </header>

          <DiveLogForm
            formKey={formKey}
            activeEntry={activeEntry}
            editingEntryId={editingEntryId}
            saving={saving}
            error={error}
            selectedGearIds={selectedGearIds}
            onGearSelectionChange={setSelectedGearIds}
            onSubmit={handleSubmit}
            onCancelEdit={handleCancelEdit}
            onDeleteFromForm={handleDeleteFromForm}
          />
        </section>

        {/* Right: log list / stats */}
        <section className={gridStyles.section}>
          <div className={gridStyles.logOverview}>
            <h2 className={gridStyles.logOverviewTitle}>Log overview</h2>
            {loading ? (
              <p className={listStyles.empty}>Loading dives…</p>
            ) : entries.length === 0 ? (
              <p className={listStyles.empty}>
                No dives logged yet. Add your first dive on the left.
              </p>
            ) : (
              <div className={gridStyles.logOverviewStats}>
                <p>
                  <span style={{ fontWeight: "var(--font-weight-semibold)" }}>
                    {entries.length}
                  </span>{" "}
                  dive{entries.length === 1 ? "" : "s"} logged.
                </p>
                <p>
                  <span style={{ fontWeight: "var(--font-weight-semibold)" }}>
                    {totalBottomTime}
                  </span>{" "}
                  minutes total bottom time.
                </p>
              </div>
            )}
          </div>

          <div className={gridStyles.recentDivesContainer}>
            <h2 className={gridStyles.logOverviewTitle}>Recent dives</h2>
            {loading ? (
              <p className={listStyles.empty}>Loading dives…</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-4)",
                }}
              >
                <DiveLogList
                  entries={entries}
                  onSelect={handleSelectEntry}
                  onDelete={handleDeleteFromList}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {statusMessage && (
        <div className={gridStyles.statusToastAlt}>{statusMessage}</div>
      )}
    </main>
  );
}
