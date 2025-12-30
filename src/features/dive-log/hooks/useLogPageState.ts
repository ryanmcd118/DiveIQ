import { FormEvent, useEffect, useState } from "react";
import { DiveLogEntry, DiveLogInput } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { depthInputToCm, tempInputToCx10, distanceInputToCm } from "@/lib/units";

export function useLogPageState() {
  const { prefs } = useUnitPreferences();
  const [entries, setEntries] = useState<DiveLogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiveLogEntry | null>(null);
  const [activeEntry, setActiveEntry] = useState<DiveLogEntry | null>(null);
  const [formKey, setFormKey] = useState<string>("new"); // force remount on edit/new
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>([]);

  const totalBottomTime = entries.reduce(
    (sum, entry) => sum + entry.bottomTime,
    0
  );

  // Load existing entries from API on mount
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const res = await fetch("/api/dive-logs");
        if (res.status === 401) {
          // User is not authenticated - this is not an error, just show empty state
          setIsAuthenticated(false);
          setEntries([]);
          return;
        }
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data: { entries: DiveLogEntry[] } = await res.json();
        setEntries(data.entries);
        setIsAuthenticated(true);
      } catch (err) {
        console.error(err);
        setError("Failed to load existing dives.");
      } finally {
        setLoading(false);
      }
    };

    void loadEntries();
  }, []);

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

    // Convert UI values to canonical fixed-point
    const maxDepthCm = depthInputToCm(maxDepthUI, prefs.depth) ?? 0;
    const waterTempCx10 = tempInputToCx10(waterTempUI, prefs.temperature);
    const visibilityCm = distanceInputToCm(visibilityUI, prefs.depth);

    const payload: DiveLogInput = {
      date: formData.get("date") as string,
      region: (formData.get("region") as string) ?? "",
      siteName: (formData.get("siteName") as string) ?? "",
      maxDepthCm,
      bottomTime: Number(formData.get("bottomTime")),
      waterTempCx10,
      visibilityCm,
      buddyName: (formData.get("buddyName") as string) || null,
      notes: (formData.get("notes") as string) || null,
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

      const data: { entry: DiveLogEntry; gearItems?: any[] } = await res.json();

      const entryWithGear = {
        ...data.entry,
        gearItems: data.gearItems || [],
      };

      setEntries((prev) =>
        isEditing
          ? prev.map((e) => (e.id === entryWithGear.id ? entryWithGear : e))
          : [entryWithGear, ...prev]
      );

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

  return {
    // state
    entries,
    saving,
    loading,
    error,
    isAuthenticated,
    editingEntryId,
    editingEntry,
    activeEntry,
    formKey,
    statusMessage,
    totalBottomTime,
    selectedGearIds,
    setSelectedGearIds,

    // handlers
    handleSubmit,
    handleSelectEntry,
    handleCancelEdit,
    handleDeleteFromForm,
    handleDeleteFromList,
  };
}
