"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DiveLogEntry } from "@/features/dive-log/types";
import DiveLogList from "./DiveLogList";
import { DiveLogDetail } from "./DiveLogDetail";
import { AddEditDiveSheet } from "./AddEditDiveSheet";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./LogbookLayout.module.css";

interface LogbookLayoutProps {
  entries: DiveLogEntry[];
  initialSelectedDiveId: string | null;
  activeEntry: DiveLogEntry | null;
  editingEntryId: string | null;
  saving: boolean;
  error: string | null;
  formKey: string;
  selectedGearIds: string[];
  setSelectedGearIds: (ids: string[]) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleSelectEntry: (entry: DiveLogEntry) => void;
  handleCancelEdit: (form?: HTMLFormElement | null) => void;
  handleDeleteFromForm: (form: HTMLFormElement) => void;
  // For delete-from-list; wired for future prompts
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDeleteFromList?: (id: string) => void;
  lastSavedEntry: DiveLogEntry | null;
  lastAction: "create" | "update" | null;
  ensureGearLoaded: (diveId: string) => Promise<void>;
  gearLoadingId: string | null;
}

export function LogbookLayout({
  entries,
  initialSelectedDiveId,
  activeEntry,
  editingEntryId,
  saving,
  error,
  formKey,
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
}: LogbookLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");

  // Basic viewport breakpoint detection
  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 768);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const urlDiveId = searchParams.get("diveId") ?? initialSelectedDiveId;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter((entry) => {
      return (
        entry.siteName.toLowerCase().includes(q) ||
        entry.region.toLowerCase().includes(q) ||
        (entry.notes && entry.notes.toLowerCase().includes(q))
      );
    });
  }, [entries, searchQuery]);

  const selectedEntry = useMemo(() => {
    if (!filteredEntries.length) return null;

    const fromUrl = urlDiveId
      ? filteredEntries.find((entry) => entry.id === urlDiveId)
      : null;

    if (fromUrl) return fromUrl;

    // Desktop: implicitly select most recent when nothing selected
    if (!isMobile) {
      return filteredEntries[0];
    }

    // Mobile: no implicit selection, list-only
    return null;
  }, [filteredEntries, urlDiveId, isMobile]);

  // On selection change, ensure gear is loaded for selected dive
  useEffect(() => {
    if (!selectedEntry) return;
    void ensureGearLoaded(selectedEntry.id);
  }, [selectedEntry, ensureGearLoaded]);

  const handleSelectFromList = (entry: DiveLogEntry) => {
    handleSelectEntry(entry);

    // Only explicit user actions update the URL
    const params = new URLSearchParams(searchParams.toString());
    params.set("diveId", entry.id);
    router.push(`/dive-logs?${params.toString()}`);
  };

  const handleBackToList = () => {
    router.push("/dive-logs");
  };

  const openCreateSheet = () => {
    handleCancelEdit();
    setSheetMode("create");
    setIsSheetOpen(true);
  };

  const openEditSheet = () => {
    if (selectedEntry) {
      handleSelectEntry(selectedEntry);
      setSheetMode("edit");
      setIsSheetOpen(true);
    }
  };

  // Close sheet and navigate to the saved entry when a save completes
  useEffect(() => {
    if (!isSheetOpen || !lastSavedEntry || !lastAction) return;

    setIsSheetOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("diveId", lastSavedEntry.id);
    router.push(`/dive-logs?${params.toString()}`);
  }, [isSheetOpen, lastSavedEntry, lastAction, router, searchParams]);

  if (!entries.length) {
    return (
      <div className={styles.emptyState}>
        No dives logged yet. Once you start logging dives, they will appear
        here.
      </div>
    );
  }

  const sheet = (
    <AddEditDiveSheet
      isOpen={isSheetOpen}
      mode={sheetMode}
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
      onClose={() => setIsSheetOpen(false)}
    />
  );

  // Mobile: list-only or detail-only depending on URL
  if (isMobile) {
    if (!urlDiveId || !selectedEntry) {
      return (
        <div className={styles.container}>
          <div className={styles.listPane}>
            <div className={styles.listToolbar}>
              <button
                type="button"
                className={buttonStyles.primaryGradient}
                style={{ width: "100%" }}
                onClick={openCreateSheet}
              >
                Add dive
              </button>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search by site, region, or notes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DiveLogList
              entries={filteredEntries}
              onSelect={handleSelectFromList}
              selectedId={selectedEntry?.id ?? null}
            />
          </div>
          {sheet}
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <button
          type="button"
          className={styles.mobileBackButton}
          onClick={handleBackToList}
        >
          ← Back to list
        </button>
        <div className={styles.detailPane}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-4)",
            }}
          >
            <h2 style={{ fontSize: "var(--font-size-lg)" }}>Dive details</h2>
            <button
              type="button"
              className={buttonStyles.secondary}
              onClick={openEditSheet}
            >
              Edit
            </button>
          </div>
          <DiveLogDetail
            entry={selectedEntry}
            gearLoading={gearLoadingId === selectedEntry.id}
          />
        </div>
        {sheet}
      </div>
    );
  }

  // Desktop / tablet: two-pane layout
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.listPane}>
          <div className={styles.listToolbar}>
            <button
              type="button"
              className={buttonStyles.primaryGradient}
              style={{ width: "100%" }}
              onClick={openCreateSheet}
            >
              Add dive
            </button>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by site, region, or notes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DiveLogList
            entries={filteredEntries}
            onSelect={handleSelectFromList}
            selectedId={selectedEntry?.id ?? null}
          />
        </div>
        <div className={styles.detailPane}>
          {selectedEntry ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-4)",
                }}
              >
                <h2 style={{ fontSize: "var(--font-size-lg)" }}>Dive details</h2>
                <button
                  type="button"
                  className={buttonStyles.secondary}
                  onClick={openEditSheet}
                >
                  Edit
                </button>
              </div>
              <DiveLogDetail
                entry={selectedEntry}
                gearLoading={gearLoadingId === selectedEntry.id}
              />
            </>
          ) : (
            <div className={styles.detailEmptyCard}>
              <div className={styles.detailEmptyRow} />
              <div className={styles.detailEmptyRow} />
              <div className={styles.detailEmptyRow} />
              <div className={styles.detailEmptyRow} />
            </div>
          )}
        </div>
      </div>
      {sheet}
    </div>
  );
}

