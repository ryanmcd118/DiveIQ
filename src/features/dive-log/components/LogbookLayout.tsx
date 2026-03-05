"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DiveLogEntry } from "@/features/dive-log/types";
import type { SoftWarning } from "@/features/dive-log/types/softWarnings";
import DiveLogList from "./DiveLogList";
import { DiveLogGrid } from "./DiveLogGrid";
import { DiveLogDetail } from "./DiveLogDetail";
import { AddEditDiveSheet } from "./AddEditDiveSheet";
import buttonStyles from "@/styles/components/Button.module.css";
import { matchesQuery } from "../utils/searchMatch";
import styles from "./LogbookLayout.module.css";

interface LogbookLayoutProps {
  entries: DiveLogEntry[];
  initialSelectedDiveId: string | null;
  activeEntry: DiveLogEntry | null;
  editingEntryId: string | null;
  saving: boolean;
  error: string | null;
  softWarnings?: SoftWarning[];
  suggestedDiveNumber?: number;
  formKey: string;
  selectedGearIds: string[];
  setSelectedGearIds: (ids: string[]) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleSelectEntry: (entry: DiveLogEntry) => void;
  handleCancelEdit: (form?: HTMLFormElement | null) => void;
  handleDeleteFromForm: (form: HTMLFormElement) => void;
  // For delete-from-list; wired for future prompts
   
  handleDeleteFromList?: (id: string) => void;
  lastSavedEntry: DiveLogEntry | null;
  lastAction: "create" | "update" | null;
  ensureGearLoaded: (diveId: string) => Promise<void>;
  gearLoadingId: string | null;
  clearLastSave: () => void;
  onOpenCreateSheetRef?: (fn: () => void) => void;
}

export function LogbookLayout({
  entries,
  initialSelectedDiveId,
  activeEntry,
  editingEntryId,
  saving,
  error,
  softWarnings = [],
  suggestedDiveNumber = 1,
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
  clearLastSave,
  onOpenCreateSheetRef,
}: LogbookLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  // Persisted view: URL param ?view=list|grid (default: grid)
  const preferredView = (searchParams.get("view") === "list" ? "list" : "grid") as "grid" | "list";
  const [sortKey, setSortKey] = useState<"date-desc" | "date-asc" | "site-asc" | "region-asc">("date-desc");

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

  // Single source of truth for browse: grid and list both render from filteredEntries only
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    const q = searchQuery.trim().toLowerCase();

    // Apply search filter: word-boundary matching (e.g. "rig" matches "Oil Rig", not "frigid")
    if (q) {
      filtered = entries.filter((entry) => {
        const site = entry.siteName ?? "";
        const region = entry.region ?? "";
        const buddy = entry.buddyName ?? "";
        const notes = entry.notes ?? "";
        return (
          matchesQuery(site, q) ||
          matchesQuery(region, q) ||
          matchesQuery(buddy, q) ||
          matchesQuery(notes, q)
        );
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "date-desc":
          // Newest first (ISO YYYY-MM-DD string compare works)
          if (a.date < b.date) return 1;
          if (a.date > b.date) return -1;
          return 0;
        case "date-asc":
          // Oldest first
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;
          return 0;
        case "site-asc":
          // Site name A-Z
          return (a.siteName || "").localeCompare(b.siteName || "");
        case "region-asc":
          // Region A-Z
          return (a.region || "").localeCompare(b.region || "");
        default:
          return 0;
      }
    });

    return sorted;
  }, [entries, searchQuery, sortKey]);

  const selectedEntry = useMemo(() => {
    if (!filteredEntries.length) return null;

    // Only select if urlDiveId is explicitly set (no implicit selection)
    const fromUrl = urlDiveId
      ? filteredEntries.find((entry) => entry.id === urlDiveId)
      : null;

    return fromUrl ?? null;
  }, [filteredEntries, urlDiveId]);

  // Determine if detail pane is open (desktop) or detail view is shown (mobile)
  const hasSelectedDive = urlDiveId && selectedEntry;
  const isDetailOpen = hasSelectedDive;
  
  // When detail pane is open, force List view; otherwise use preferred view
  const effectiveView = isDetailOpen ? "list" : preferredView;

  // Compute auto surface interval (min) for the active entry, if any,
  // based on chronological previous dive endTime and this dive startTime.
  const surfaceIntervalAutoMin = useMemo(() => {
    const entry = activeEntry;
    if (!entry || !entry.startTime) return null;
    const userEntries = entries.filter((e) => e.userId === entry.userId);
    if (!userEntries.length) return null;
    const chronological = [...userEntries].sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      const aStart = a.startTime ?? "";
      const bStart = b.startTime ?? "";
      if (aStart && bStart && aStart !== bStart) {
        return aStart < bStart ? -1 : 1;
      }
      return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
    });
    const index = chronological.findIndex((e) => e.id === entry.id);
    if (index <= 0) return null;
    const prev = chronological[index - 1];
    if (!prev.endTime) return null;

    const parseMinutes = (t: string | null | undefined): number | null => {
      if (!t) return null;
      const match = t.match(/^(\d{2}):(\d{2})$/);
      if (!match) return null;
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
      return hours * 60 + minutes;
    };

    const startMin = parseMinutes(entry.startTime);
    const prevEndMin = parseMinutes(prev.endTime);
    if (startMin == null || prevEndMin == null) return null;
    const diff = startMin - prevEndMin;
    return diff > 0 ? diff : null;
  }, [activeEntry, entries]);

  // On selection change, ensure gear is loaded for selected dive
  useEffect(() => {
    if (!selectedEntry) return;
    void ensureGearLoaded(selectedEntry.id);
  }, [selectedEntry, ensureGearLoaded]);

  const handleSelectFromList = (entry: DiveLogEntry) => {
    handleSelectEntry(entry);

    // Update URL without adding history entry or scrolling the page
    const params = new URLSearchParams(searchParams.toString());
    params.set("diveId", entry.id);
    router.replace(`/dive-logs?${params.toString()}`, { scroll: false });
  };

  const handleSelectFromGrid = (id: string) => {
    const entry = filteredEntries.find((e) => e.id === id);
    if (entry) {
      handleSelectFromList(entry);
    }
  };

  const handleBackToList = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("diveId");
    const query = params.toString();
    router.replace(query ? `/dive-logs?${query}` : "/dive-logs", { scroll: false });
  };

  const handleCloseDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("diveId");
    const query = params.toString();
    router.replace(query ? `/dive-logs?${query}` : "/dive-logs", { scroll: false });
  };

  const handleViewChange = (view: "grid" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.replace(`/dive-logs?${params.toString()}`, { scroll: false });
  };

  const openCreateSheet = useCallback(() => {
    handleCancelEdit();
    setSheetMode("create");
    setIsSheetOpen(true);
  }, [handleCancelEdit]);

  // Expose openCreateSheet function to parent via callback ref
  // Store function in ref to avoid stale closures
  const openCreateSheetRef = useRef(openCreateSheet);
  openCreateSheetRef.current = openCreateSheet;

  // Use useEffect to call the callback ref after render, not during
  useEffect(() => {
    if (onOpenCreateSheetRef) {
      // Defer to next tick to ensure we're not updating during render
      const timeoutId = setTimeout(() => {
        onOpenCreateSheetRef(() => openCreateSheetRef.current());
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    // Only depend on onOpenCreateSheetRef, not openCreateSheet
     
  }, [onOpenCreateSheetRef]);

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
    router.replace(`/dive-logs?${params.toString()}`, { scroll: false });
    clearLastSave();
  }, [isSheetOpen, lastSavedEntry, lastAction, router, searchParams, clearLastSave]);

  if (!entries.length) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          No dives logged yet. Once you start logging dives, they will appear
          here.
        </div>
        <AddEditDiveSheet
          isOpen={isSheetOpen}
          mode={sheetMode}
          formKey={formKey}
          activeEntry={activeEntry}
          editingEntryId={editingEntryId}
          entries={entries}
          suggestedDiveNumber={suggestedDiveNumber}
          surfaceIntervalAutoMin={surfaceIntervalAutoMin}
          saving={saving}
          error={error}
          softWarnings={softWarnings}
          selectedGearIds={selectedGearIds}
          onGearSelectionChange={setSelectedGearIds}
          onSubmit={handleSubmit}
          onCancelEdit={handleCancelEdit}
          onDeleteFromForm={handleDeleteFromForm}
          onClose={() => {
            setIsSheetOpen(false);
            handleCancelEdit();
          }}
        />
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
      entries={entries}
      suggestedDiveNumber={suggestedDiveNumber}
      surfaceIntervalAutoMin={surfaceIntervalAutoMin}
      saving={saving}
      error={error}
      softWarnings={softWarnings}
      selectedGearIds={selectedGearIds}
      onGearSelectionChange={setSelectedGearIds}
      onSubmit={handleSubmit}
      onCancelEdit={handleCancelEdit}
      onDeleteFromForm={handleDeleteFromForm}
      onClose={() => {
        setIsSheetOpen(false);
        handleCancelEdit();
      }}
    />
  );

  // Mobile: list-only or detail-only depending on URL
  if (isMobile) {
    if (!urlDiveId || !selectedEntry) {
      return (
        <div className={styles.container}>
          <div className={styles.browsePane}>
            <div className={styles.browseHeader}>
              <h2 className={styles.browseTitle}>Logbook</h2>
            </div>
            <div className={styles.browseControls}>
              {!isDetailOpen && (
                <div className={styles.viewToggle}>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${
                      effectiveView === "grid" ? styles.toggleButtonActive : ""
                    }`}
                    onClick={() => handleViewChange("grid")}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${
                      effectiveView === "list" ? styles.toggleButtonActive : ""
                    }`}
                    onClick={() => handleViewChange("list")}
                  >
                    List
                  </button>
                </div>
              )}
            </div>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by site, region, buddy, or notes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className={styles.sortSelect}
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            >
              <option value="date-desc">Date (newest first)</option>
              <option value="date-asc">Date (oldest first)</option>
              <option value="site-asc">Site name (A-Z)</option>
              <option value="region-asc">Region (A-Z)</option>
            </select>
            <div className={styles.browseContent}>
              {effectiveView === "grid" ? (
                <DiveLogGrid
                  entries={filteredEntries}
                  searchQuery={searchQuery.trim()}
                  onSelect={handleSelectFromGrid}
                  selectedId={selectedEntry?.id ?? null}
                />
              ) : (
                <DiveLogList
                  entries={filteredEntries}
                  searchQuery={searchQuery.trim()}
                  onSelect={handleSelectFromList}
                  selectedId={selectedEntry?.id ?? null}
                  isCompact={false}
                  isMobile={true}
                />
              )}
            </div>
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
          <div className={styles.detailHeader}>
            <h2 className={styles.detailTitle}>Dive details</h2>
            <div className={styles.detailActions}>
              <button
                type="button"
                className={buttonStyles.secondary}
                onClick={openEditSheet}
              >
                Edit
              </button>
            </div>
          </div>
          <div className={styles.detailBody}>
            <DiveLogDetail
              entry={selectedEntry}
              gearLoading={gearLoadingId === selectedEntry.id}
            />
          </div>
        </div>
        {sheet}
      </div>
    );
  }

  // Desktop / tablet: two-pane layout when diveId is selected, full-width browse when not

  return (
    <div className={styles.container}>
      <div className={`${styles.content} ${!hasSelectedDive ? styles.contentSinglePane : ""}`}>
        <div className={styles.browsePane}>
          <div className={styles.browseHeader}>
            <div className={styles.browseHeaderRow1}>
              <h2 className={styles.browseTitle}>Logbook</h2>
              <select
                className={styles.sortSelect}
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="site-asc">Site name (A → Z)</option>
                <option value="region-asc">Region (A → Z)</option>
              </select>
            </div>
            <div className={styles.browseHeaderControls}>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search by site, region, buddy, or notes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {!isDetailOpen && (
                <div className={styles.viewToggle}>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${
                      effectiveView === "grid" ? styles.toggleButtonActive : ""
                    }`}
                    onClick={() => handleViewChange("grid")}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${
                      effectiveView === "list" ? styles.toggleButtonActive : ""
                    }`}
                    onClick={() => handleViewChange("list")}
                  >
                    List
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={styles.browseContent}>
            {effectiveView === "grid" ? (
              <DiveLogGrid
                entries={filteredEntries}
                searchQuery={searchQuery.trim()}
                onSelect={handleSelectFromGrid}
                selectedId={selectedEntry?.id ?? null}
              />
            ) : (
              <DiveLogList
                entries={filteredEntries}
                searchQuery={searchQuery.trim()}
                onSelect={handleSelectFromList}
                selectedId={selectedEntry?.id ?? null}
                isCompact={!!isDetailOpen}
                isMobile={false}
              />
            )}
          </div>
        </div>
        {hasSelectedDive && (
          <div className={styles.detailPane}>
            <div className={styles.detailHeader}>
              <h2 className={styles.detailTitle}>Dive details</h2>
              <div className={styles.detailActions}>
                <button
                  type="button"
                  className={buttonStyles.secondary}
                  onClick={openEditSheet}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={handleCloseDetail}
                  aria-label="Close detail"
                >
                  ×
                </button>
              </div>
            </div>
            <div className={styles.detailBody}>
              <DiveLogDetail
                entry={selectedEntry}
                gearLoading={gearLoadingId === selectedEntry.id}
              />
            </div>
          </div>
        )}
      </div>
      {sheet}
    </div>
  );
}

