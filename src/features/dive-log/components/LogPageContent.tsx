"use client";

import Link from "next/link";
import type { DiveLogEntry } from "@/features/dive-log/types";
import { useLogPageState } from "../hooks/useLogPageState";
import { LogbookLayout } from "./LogbookLayout";
import layoutStyles from "@/styles/components/Layout.module.css";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import backgroundStyles from "@/styles/components/Background.module.css";

interface LogPageContentProps {
  initialEntries: DiveLogEntry[];
  initialStats: {
    totalDives: number;
    totalBottomTime: number;
    deepestDive: number;
  } | null;
  initialSelectedDiveId: string | null;
  isAuthed: boolean;
}

export function LogPageContent({
  initialEntries,
  initialStats, // reserved for future header stats
  initialSelectedDiveId,
  isAuthed,
}: LogPageContentProps) {
  void initialStats;

  // Unauthenticated view: preserve existing sign-in prompt
  if (!isAuthed) {
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

  const {
    entries,
    saving,
    error,
    editingEntryId,
    activeEntry,
    formKey,
    statusMessage,
    selectedGearIds,
    setSelectedGearIds,
    handleSubmit,
    handleSelectEntry,
    handleCancelEdit,
    handleDeleteFromForm,
    handleDeleteFromList,
    lastSavedEntry,
    lastAction,
    ensureGearLoaded,
    gearLoadingId,
    clearLastSave,
  } = useLogPageState(initialEntries);

  return (
    <main
      className={`${layoutStyles.page} ${backgroundStyles.pageGradientSubtle}`}
    >
      <div className={layoutStyles.pageContent}>
        <header
          className={layoutStyles.pageHeader}
          style={{
            paddingBottom: "var(--space-6)",
            marginBottom: "var(--space-4)",
          }}
        >
          <div>
            <h1 className={layoutStyles.pageTitle}>Dive Log</h1>
            <p className={layoutStyles.pageSubtitle}>
              Browse your dives in a logbook-style view. Select a dive to see
              its details.
            </p>
          </div>
        </header>

        <LogbookLayout
          entries={entries}
          initialSelectedDiveId={initialSelectedDiveId}
          activeEntry={activeEntry}
          editingEntryId={editingEntryId}
          saving={saving}
          error={error}
          formKey={formKey}
          selectedGearIds={selectedGearIds}
          setSelectedGearIds={setSelectedGearIds}
          handleSubmit={handleSubmit}
          handleSelectEntry={handleSelectEntry}
          handleCancelEdit={handleCancelEdit}
          handleDeleteFromForm={handleDeleteFromForm}
          handleDeleteFromList={handleDeleteFromList}
          lastSavedEntry={lastSavedEntry}
          lastAction={lastAction}
          ensureGearLoaded={ensureGearLoaded}
          gearLoadingId={gearLoadingId}
          clearLastSave={clearLastSave}
        />

        {statusMessage && (
          <div className={layoutStyles.pageFooter}>{statusMessage}</div>
        )}
      </div>
    </main>
  );
}

