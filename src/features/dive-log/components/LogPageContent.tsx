"use client";

import { useLogPageState } from "../hooks/useLogPageState";
import { DiveLogForm } from "./DiveLogForm";
import DiveLogList from "./DiveLogList";
import layoutStyles from "@/styles/components/Layout.module.css";
import gridStyles from "@/styles/components/PageGrid.module.css";
import listStyles from "@/styles/components/List.module.css";

export function LogPageContent() {
  const {
    entries,
    saving,
    loading,
    error,
    editingEntryId,
    activeEntry,
    formKey,
    statusMessage,
    totalBottomTime,
    handleSubmit,
    handleSelectEntry,
    handleCancelEdit,
    handleDeleteFromForm,
    handleDeleteFromList,
  } = useLogPageState();

  return (
    <main className={layoutStyles.page}>
      <div className={gridStyles.logPageGrid}>
        {/* Left: log form */}
        <section className={gridStyles.section}>
          <h1 className={layoutStyles.pageTitle}>Dive Log</h1>
          <p className="body-small text-muted">
            Capture the essentials from each dive: conditions, depth, time, and
            notes. This will eventually feed stats and visualizations in your
            DiveIQ logbook.
          </p>

          <DiveLogForm
            formKey={formKey}
            activeEntry={activeEntry}
            editingEntryId={editingEntryId}
            saving={saving}
            error={error}
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
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
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
        <div className={gridStyles.statusToastAlt}>
          {statusMessage}
        </div>
      )}
    </main>
  );
}
