import { FormEvent, useState } from "react";
import type { GearItem } from "@prisma/client";
import { DiveLogEntry, DiveLogInput } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import {
  depthInputToCm,
  tempInputToCx10,
  distanceInputToCm,
} from "@/lib/units";

export function useLogPageState(initialEntries: DiveLogEntry[]) {
  const { prefs } = useUnitPreferences();
  const [entries, setEntries] = useState<DiveLogEntry[]>(initialEntries);
  const [saving, setSaving] = useState(false);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiveLogEntry | null>(null);
  const [activeEntry, setActiveEntry] = useState<DiveLogEntry | null>(null);
  const [formKey, setFormKey] = useState<string>("new"); // force remount on edit/new
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>([]);
  const [lastSavedEntry, setLastSavedEntry] = useState<DiveLogEntry | null>(
    null
  );
  const [lastAction, setLastAction] = useState<"create" | "update" | null>(
    null
  );
  const [gearLoadingId, setGearLoadingId] = useState<string | null>(null);
  const [gearLoadedIds, setGearLoadedIds] = useState<string[]>([]);

  const totalBottomTime = entries.reduce(
    (sum, entry) => sum + entry.bottomTime,
    0
  );

  const resetFormState = () => {
    setEditingEntryId(null);
    setActiveEntry(null);
    setError(null);
    setSelectedGearIds([]);
    setFormKey(`new-${Date.now()}`);
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Convert UI unit values to metric for database storage
    const maxDepthUI = formData.get("maxDepth");
    const waterTempUI = formData.get("waterTemp");
    const visibilityUI = formData.get("visibility");

    // Coerce FormDataEntryValue to string | null (treat File as null)
    const maxDepthUIString = typeof maxDepthUI === "string" ? maxDepthUI : null;
    const waterTempUIString =
      typeof waterTempUI === "string" ? waterTempUI : null;
    const visibilityUIString =
      typeof visibilityUI === "string" ? visibilityUI : null;

    // Convert UI values to canonical fixed-point
    const maxDepthCm = depthInputToCm(maxDepthUIString, prefs.depth) ?? 0;
    const waterTempCx10 = tempInputToCx10(waterTempUIString, prefs.temperature);
    const visibilityCm = distanceInputToCm(visibilityUIString, prefs.depth);

    const dateValue = formData.get("date");
    const regionValue = formData.get("region");
    const siteNameValue = formData.get("siteName");
    const bottomTimeValue = formData.get("bottomTime");
    const buddyNameValue = formData.get("buddyName");
    const notesValue = formData.get("notes");

    const payload: Omit<DiveLogInput, "userId"> = {
      date: typeof dateValue === "string" ? dateValue : "",
      region: typeof regionValue === "string" ? regionValue : "",
      siteName: typeof siteNameValue === "string" ? siteNameValue : "",
      maxDepthCm,
      bottomTime:
        typeof bottomTimeValue === "string"
          ? Number(bottomTimeValue)
          : Number(bottomTimeValue ?? 0),
      waterTempCx10,
      visibilityCm,
      buddyName:
        typeof buddyNameValue === "string" ? buddyNameValue || null : null,
      notes: typeof notesValue === "string" ? notesValue || null : null,
      gearItemIds: selectedGearIds,
    };

    const isEditing = Boolean(editingEntryId);

    try {
      const res = await fetch("/api/dive-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isEditing ? "update" : "create",
          id: isEditing ? editingEntryId : undefined,
          payload,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data: { entry: DiveLogEntry; gearItems?: GearItem[] } =
        await res.json();

      const entryWithGear = {
        ...data.entry,
        gearItems: data.gearItems || [],
      };

      setEntries((prev) => {
        const next = isEditing
          ? prev.map((e) => (e.id === entryWithGear.id ? entryWithGear : e))
          : [entryWithGear, ...prev];

        // Always enforce newest-by-date-first ordering (ISO YYYY-MM-DD string compare)
        return [...next].sort((a, b) => {
          if (a.date < b.date) return 1;
          if (a.date > b.date) return -1;
          return 0;
        });
      });

      setLastSavedEntry(entryWithGear);
      setLastAction(isEditing ? "update" : "create");

      // Reset form + edit mode
      form.reset();
      setEditingEntryId(null);
      setEditingEntry(null);
      setActiveEntry(null);
      setSelectedGearIds([]);
      setFormKey(`log-${Date.now()}`);

      const msg = isEditing ? "Log entry updated ✅" : "Dive added to log ✅";
      showStatus(msg);
    } catch (err) {
      console.error(err);
      setError(
        isEditing
          ? "Failed to update entry. Please try again."
          : "Failed to save dive. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectEntry = (entry: DiveLogEntry) => {
    setEditingEntry(entry);
    setEditingEntryId(entry.id);
    setActiveEntry(entry);
    setSelectedGearIds(entry.gearItems?.map((g) => g.id) || []);
    setError(null);
    setStatusMessage(null);
    setFormKey(`edit-${entry.id}-${Date.now()}`);
  };

  const handleCancelEdit = (form?: HTMLFormElement | null) => {
    if (form) form.reset();
    resetFormState();
  };

  const performDelete = async (id: string) => {
    try {
      const res = await fetch("/api/dive-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      setEntries((prev) => prev.filter((e) => e.id !== id));
      resetFormState();
      showStatus("Dive deleted ✅");
    } catch (err) {
      console.error(err);
      setError("Failed to delete dive. Please try again.");
    }
  };

  const handleDeleteFromForm = async (form: HTMLFormElement) => {
    if (!editingEntryId) return;
    const ok = window.confirm(
      "Delete this dive from your log? This action cannot be undone."
    );
    if (!ok) return;

    await performDelete(editingEntryId);
    form.reset();
  };

  const handleDeleteFromList = async (id: string) => {
    const ok = window.confirm(
      "Delete this dive from your log? This action cannot be undone."
    );
    if (!ok) return;

    await performDelete(id);
  };

  const clearLastSave = () => {
    setLastSavedEntry(null);
    setLastAction(null);
  };

  const ensureGearLoaded = async (diveId: string) => {
    const current = entries.find((e) => e.id === diveId);
    if (!current) return;

    // Already has gear or we've loaded it before
    if ((current.gearItems && current.gearItems.length > 0) || gearLoadedIds.includes(diveId)) {
      return;
    }

    if (gearLoadingId === diveId) return;

    try {
      setGearLoadingId(diveId);
      const res = await fetch(`/api/dive-logs?id=${encodeURIComponent(diveId)}`);
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data: { entry: DiveLogEntry | null; gearItems?: GearItem[] } =
        await res.json();

      if (!data.entry || !data.gearItems) {
        setGearLoadedIds((prev) =>
          prev.includes(diveId) ? prev : [...prev, diveId]
        );
        return;
      }

      const entryWithGear: DiveLogEntry = {
        ...data.entry,
        gearItems: data.gearItems,
      };

      setEntries((prev) =>
        prev.map((e) => (e.id === diveId ? entryWithGear : e))
      );

      setGearLoadedIds((prev) =>
        prev.includes(diveId) ? prev : [...prev, diveId]
      );
    } catch (err) {
      console.error("Failed to load gear for dive", diveId, err);
    } finally {
      setGearLoadingId((currentId) => (currentId === diveId ? null : currentId));
    }
  };

  return {
    // state
    entries,
    saving,
    loading,
    error,
    editingEntryId,
    editingEntry,
    activeEntry,
    formKey,
    statusMessage,
    totalBottomTime,
    selectedGearIds,
    setSelectedGearIds,
    lastSavedEntry,
    lastAction,

    // handlers
    handleSubmit,
    handleSelectEntry,
    handleCancelEdit,
    handleDeleteFromForm,
    handleDeleteFromList,
    ensureGearLoaded,
    gearLoadingId,
    clearLastSave,
  };
}
