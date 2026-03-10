import { FormEvent, useState } from "react";
import type { GearItem } from "@prisma/client";
import { DiveLogEntry, DiveLogInput } from "@/features/dive-log/types";
import {
  toSoftWarnings,
  type SoftWarning,
  type SoftWarningField,
} from "@/features/dive-log/types/softWarnings";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import {
  depthInputToCm,
  tempInputToCx10,
  distanceInputToCm,
  pressureInputToBar,
  weightInputToKg,
  feetToCm,
} from "@/lib/units";

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" ? v : null;
}

export function useLogPageState(initialEntries: DiveLogEntry[] = []) {
  const { prefs } = useUnitPreferences();
  const [entries, setEntries] = useState<DiveLogEntry[]>(initialEntries);
  const [saving, setSaving] = useState(false);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [softWarnings, setSoftWarnings] = useState<SoftWarning[]>([]);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiveLogEntry | null>(null);
  const [activeEntry, setActiveEntry] = useState<DiveLogEntry | null>(null);
  const [formKey, setFormKey] = useState<string>("new");
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
    (sum, entry) => sum + (entry.bottomTime ?? 0),
    0
  );

  const suggestedDiveNumber = entries.length + 1;

  const resetFormState = () => {
    setEditingEntryId(null);
    setActiveEntry(null);
    setError(null);
    setSoftWarnings([]);
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
    setSoftWarnings([]);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const dateValue = str(formData.get("date"));
    const siteNameValue = str(formData.get("siteName"));
    const gasType = str(formData.get("gasType")) || "Air";

    // Hard validation
    if (!dateValue?.trim()) {
      setError("Date is required.");
      setSaving(false);
      return;
    }
    if (!siteNameValue?.trim()) {
      setError("Site name is required.");
      setSaving(false);
      return;
    }
    if (gasType === "Nitrox") {
      const fO2Val = str(formData.get("fO2"));
      const fO2 = fO2Val ? parseInt(fO2Val, 10) : NaN;
      if (isNaN(fO2) || fO2 < 21 || fO2 > 100) {
        setError("FO2 (%) is required when using Nitrox.");
        setSaving(false);
        return;
      }
    }

    // Soft validation (warn but allow save)
    const warningKeys: SoftWarningField[] = [];
    const maxDepthUI = str(formData.get("maxDepth"));
    const bottomTimeVal = str(formData.get("bottomTime"));
    if (!maxDepthUI?.trim()) warningKeys.push("maxDepth");
    if (!bottomTimeVal?.trim()) warningKeys.push("bottomTime");
    setSoftWarnings(toSoftWarnings(warningKeys));

    // Dive type tags from checkboxes
    const diveTypeTagsArr = formData.getAll("diveTypeTags");
    const diveTypeTags =
      diveTypeTagsArr.length > 0
        ? JSON.stringify(
            Array.isArray(diveTypeTagsArr)
              ? diveTypeTagsArr
              : [String(diveTypeTagsArr)]
          )
        : null;

    const safetyStopEnabled = formData.get("safetyStopEnabled") === "1";
    const safetyStopDepthUI = str(formData.get("safetyStopDepth"));
    const safetyStopDurationVal = str(formData.get("safetyStopDuration"));
    const safetyStopDepthCm =
      safetyStopEnabled && safetyStopDepthUI
        ? (depthInputToCm(safetyStopDepthUI, prefs.depth) ?? feetToCm(15))
        : null;
    const safetyStopDurationMin =
      safetyStopEnabled && safetyStopDurationVal
        ? parseInt(safetyStopDurationVal, 10)
        : null;

    const maxDepthCm = depthInputToCm(
      str(formData.get("maxDepth")),
      prefs.depth
    );
    const bottomTime = bottomTimeVal ? parseInt(bottomTimeVal, 10) : null;
    const waterTempCx10 = tempInputToCx10(
      str(formData.get("waterTempSurface")),
      prefs.temperature
    );
    const waterTempBottomCx10 = tempInputToCx10(
      str(formData.get("waterTempBottom")),
      prefs.temperature
    );
    const visibilityCm = distanceInputToCm(
      str(formData.get("visibility")),
      prefs.depth
    );
    const startPressureBar = pressureInputToBar(
      str(formData.get("startPressure")),
      prefs.pressure
    );
    const endPressureBar = pressureInputToBar(
      str(formData.get("endPressure")),
      prefs.pressure
    );
    const weightUsedKg = weightInputToKg(
      str(formData.get("weightUsed")),
      prefs.weight
    );

    const payload: Omit<DiveLogInput, "userId"> = {
      date: dateValue,
      startTime: str(formData.get("startTime")) || null,
      endTime: str(formData.get("endTime")) || null,
      diveNumber: (() => {
        const v = str(formData.get("diveNumber"));
        return v ? parseInt(v, 10) : null;
      })(),
      diveNumberAuto: null,
      diveNumberOverride: (() => {
        const v = str(formData.get("diveNumberOverride"));
        return v ? parseInt(v, 10) : null;
      })(),
      region: str(formData.get("region")) || null,
      siteName: siteNameValue,
      buddyName: str(formData.get("buddyName")) || null,
      diveTypeTags,
      maxDepthCm,
      bottomTime,
      safetyStopDepthCm,
      safetyStopDurationMin,
      surfaceIntervalMin: (() => {
        const v = str(formData.get("surfaceIntervalMin"));
        return v ? parseInt(v, 10) : null;
      })(),
      waterTempCx10,
      waterTempBottomCx10,
      visibilityCm,
      current: str(formData.get("current")) || null,
      gasType: gasType || null,
      fO2:
        gasType === "Nitrox"
          ? parseInt(str(formData.get("fO2")) || "32", 10)
          : null,
      tankCylinder: str(formData.get("tankCylinder")) || null,
      startPressureBar,
      endPressureBar,
      exposureProtection: str(formData.get("exposureProtection")) || null,
      weightUsedKg,
      gearKitId: str(formData.get("gearKitId")) || null,
      gearNotes: str(formData.get("gearNotes")) || null,
      isTrainingDive: formData.get("isTrainingDive") === "on",
      trainingCourse: str(formData.get("trainingCourse")) || null,
      trainingInstructor: str(formData.get("trainingInstructor")) || null,
      trainingSkills: str(formData.get("trainingSkills")) || null,
      notes: str(formData.get("notes")) || null,
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

      setEditingEntryId(null);
      setEditingEntry(null);
      setActiveEntry(null);
      setSelectedGearIds([]);
      setSoftWarnings([]);
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

  const handleCancelEdit = () => {
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

  const handleDeleteFromForm = async () => {
    if (!editingEntryId) return;
    const ok = window.confirm(
      "Delete this dive from your log? This action cannot be undone."
    );
    if (!ok) return;

    await performDelete(editingEntryId);
  };

  const clearLastSave = () => {
    setLastSavedEntry(null);
    setLastAction(null);
  };

  const ensureGearLoaded = async (diveId: string) => {
    const current = entries.find((e) => e.id === diveId);
    if (!current) return;

    // Already has gear or we've loaded it before
    if (
      (current.gearItems && current.gearItems.length > 0) ||
      gearLoadedIds.includes(diveId)
    ) {
      return;
    }

    if (gearLoadingId === diveId) return;

    try {
      setGearLoadingId(diveId);
      const res = await fetch(
        `/api/dive-logs?id=${encodeURIComponent(diveId)}`
      );
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
      setGearLoadingId((currentId) =>
        currentId === diveId ? null : currentId
      );
    }
  };

  return {
    // state
    entries,
    saving,
    loading,
    error,
    softWarnings,
    suggestedDiveNumber,
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
    ensureGearLoaded,
    gearLoadingId,
    clearLastSave,
  };
}
