"use client";

import { useState, useEffect } from "react";
import type { DiveLogEntry } from "@/features/dive-log/types";
import type { UnitPreferences } from "@/lib/units";
import {
  displayDepth,
  displayTemperature,
  displayDistance,
  formatPressureForDisplay,
  formatWeightForDisplay,
  safetyStopDepthCmToDisplay,
} from "@/lib/units";
import {
  parseDiveTypeTags,
  splitTimeForDisplay,
  timeToMinutes,
  minutesToDisplayTime,
  durationMinutes,
  type LastEditedTime,
} from "../utils/timeUtils";

interface UseDiveFormStateProps {
  activeEntry: DiveLogEntry | null;
  formKey: string;
  entries: DiveLogEntry[];
  suggestedDiveNumber: number;
  onGearSelectionChange: (ids: string[]) => void;
  prefs: UnitPreferences;
}

export function useDiveFormState({
  activeEntry,
  formKey,
  entries,
  suggestedDiveNumber,
  onGearSelectionChange,
  prefs,
}: UseDiveFormStateProps) {
  const [todayStr, setTodayStr] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [startTimeDisplay, setStartTimeDisplay] = useState("");
  const [startTimePeriod, setStartTimePeriod] = useState<"AM" | "PM">("AM");
  const [endTimeDisplay, setEndTimeDisplay] = useState("");
  const [endTimePeriod, setEndTimePeriod] = useState<"AM" | "PM">("AM");
  const [bottomTime, setBottomTime] = useState("");
  const [lastEditedTime, setLastEditedTime] = useState<LastEditedTime>(null);
  const [startTimeError, setStartTimeError] = useState<string | null>(null);
  const [endTimeError, setEndTimeError] = useState<string | null>(null);
  const [diveNumber, setDiveNumber] = useState("");
  const [diveNumberAuto, setDiveNumberAuto] = useState<number | null>(null);
  const [isDiveNumberOverridden, setIsDiveNumberOverridden] = useState(false);

  // When creating a new dive, suggested # = 1 + count of existing dives with date < form date (chronological position).
  const suggestedForNewDive =
    !activeEntry && date.trim()
      ? entries.filter((e) => e.date < date).length + 1
      : null;

  const [region, setRegion] = useState("");
  const [buddyName, setBuddyName] = useState("");
  const [notes, setNotes] = useState("");
  const [siteName, setSiteName] = useState("");
  const [maxDepth, setMaxDepth] = useState("");
  const [waterTempSurface, setWaterTempSurface] = useState("");
  const [waterTempBottom, setWaterTempBottom] = useState("");
  const [visibility, setVisibility] = useState("");
  const [startPressure, setStartPressure] = useState("");
  const [endPressure, setEndPressure] = useState("");
  const [weightUsed, setWeightUsed] = useState("");
  const [gasType, setGasType] = useState("Air");
  const [fO2, setFO2] = useState("32");
  const [safetyStopEnabled, setSafetyStopEnabled] = useState(false);
  const [safetyStopDepth, setSafetyStopDepth] = useState("");
  const [safetyStopDuration, setSafetyStopDuration] = useState("");
  const [surfaceIntervalMin, setSurfaceIntervalMin] = useState("");
  const [current, setCurrent] = useState("");
  const [exposureProtection, setExposureProtection] = useState("");
  const [tankCylinder, setTankCylinder] = useState("");
  const [gearKitId, setGearKitId] = useState("");
  const [gearNotes, setGearNotes] = useState("");
  const [isTrainingDive, setIsTrainingDive] = useState(false);
  const [trainingCourse, setTrainingCourse] = useState("");
  const [trainingInstructor, setTrainingInstructor] = useState("");
  const [trainingSkills, setTrainingSkills] = useState("");
  const [selectedDiveTypes, setSelectedDiveTypes] = useState<string[]>([]);
  const [showAllDiveTypes, setShowAllDiveTypes] = useState(false);
  const [gearKits, setGearKits] = useState<
    { id: string; name: string; kitItems: { gearItemId: string }[] }[]
  >([]);

  // Gas used (derived): start - end pressure; blank if either missing/invalid or if negative
  const gasUsedDisplay = (() => {
    const start = startPressure.trim();
    const end = endPressure.trim();
    if (!start || !end) return null;
    const startNum = parseFloat(start);
    const endNum = parseFloat(end);
    if (Number.isNaN(startNum) || Number.isNaN(endNum)) return null;
    const used = startNum - endNum;
    if (used < 0) return null;
    return Math.round(used);
  })();

  const initFromEntry = (entry: DiveLogEntry | null) => {
    if (entry) {
      setDate(entry.date ?? "");
      const startParts = splitTimeForDisplay(entry.startTime ?? null);
      setStartTimeDisplay(startParts.value);
      setStartTimePeriod(startParts.period);
      const endParts = splitTimeForDisplay(entry.endTime ?? null);
      setEndTimeDisplay(endParts.value);
      setEndTimePeriod(endParts.period);
      setLastEditedTime(null);
      setStartTimeError(null);
      setEndTimeError(null);

      const autoFromEntry = entry.diveNumberAuto ?? entry.diveNumber ?? null;
      const overrideFromEntry = entry.diveNumberOverride ?? null;
      setDiveNumberAuto(autoFromEntry);
      if (overrideFromEntry != null) {
        setDiveNumber(String(overrideFromEntry));
        setIsDiveNumberOverridden(true);
      } else if (autoFromEntry != null) {
        setDiveNumber(String(autoFromEntry));
        setIsDiveNumberOverridden(false);
      } else {
        setDiveNumber("");
        setIsDiveNumberOverridden(false);
      }
      setRegion(entry.region ?? "");
      setBuddyName(entry.buddyName ?? "");
      setNotes(entry.notes ?? "");
      setSiteName(entry.siteName ?? "");
      setMaxDepth(
        entry.maxDepthCm != null
          ? displayDepth(entry.maxDepthCm, prefs.depth).value
          : ""
      );
      setBottomTime(entry.bottomTime != null ? String(entry.bottomTime) : "");
      setWaterTempSurface(
        entry.waterTempCx10 != null
          ? displayTemperature(entry.waterTempCx10, prefs.temperature).value
          : ""
      );
      setWaterTempBottom(
        entry.waterTempBottomCx10 != null
          ? displayTemperature(entry.waterTempBottomCx10, prefs.temperature)
              .value
          : ""
      );
      setVisibility(
        entry.visibilityCm != null
          ? displayDistance(entry.visibilityCm, prefs.depth).value
          : ""
      );
      setStartPressure(
        entry.startPressureBar != null
          ? formatPressureForDisplay(entry.startPressureBar, prefs.pressure)
          : ""
      );
      setEndPressure(
        entry.endPressureBar != null
          ? formatPressureForDisplay(entry.endPressureBar, prefs.pressure)
          : ""
      );
      setWeightUsed(
        entry.weightUsedKg != null
          ? formatWeightForDisplay(entry.weightUsedKg, prefs.weight)
          : ""
      );
      setGasType(entry.gasType ?? "Air");
      setFO2(entry.fO2 != null ? String(entry.fO2) : "32");
      const hasSafetyStop =
        entry.safetyStopDepthCm != null || entry.safetyStopDurationMin != null;
      setSafetyStopEnabled(hasSafetyStop);
      setSafetyStopDepth(
        hasSafetyStop
          ? safetyStopDepthCmToDisplay(entry.safetyStopDepthCm, prefs.depth)
          : ""
      );
      setSafetyStopDuration(
        hasSafetyStop && entry.safetyStopDurationMin != null
          ? String(entry.safetyStopDurationMin)
          : ""
      );
      setSurfaceIntervalMin(
        entry.surfaceIntervalMin != null ? String(entry.surfaceIntervalMin) : ""
      );
      setCurrent(entry.current ?? "");
      setExposureProtection(entry.exposureProtection ?? "");
      setTankCylinder(entry.tankCylinder ?? "");
      setGearKitId(entry.gearKitId ?? "");
      setGearNotes(entry.gearNotes ?? "");
      setIsTrainingDive(entry.isTrainingDive ?? false);
      setTrainingCourse(entry.trainingCourse ?? "");
      setTrainingInstructor(entry.trainingInstructor ?? "");
      setTrainingSkills(entry.trainingSkills ?? "");
      setSelectedDiveTypes(parseDiveTypeTags(entry.diveTypeTags));
    } else {
      setDate("");
      setStartTimeDisplay("");
      setStartTimePeriod("AM");
      setEndTimeDisplay("");
      setEndTimePeriod("AM");
      setLastEditedTime(null);
      setStartTimeError(null);
      setEndTimeError(null);
      setDiveNumberAuto(suggestedDiveNumber || null);
      setDiveNumber(
        suggestedDiveNumber != null ? String(suggestedDiveNumber) : ""
      );
      setIsDiveNumberOverridden(false);
      setRegion("");
      setBuddyName("");
      setNotes("");
      setSiteName("");
      setMaxDepth("");
      setBottomTime("");
      setWaterTempSurface("");
      setWaterTempBottom("");
      setVisibility("");
      setStartPressure("");
      setEndPressure("");
      setWeightUsed("");
      setGasType("Air");
      setFO2("32");
      setSafetyStopEnabled(false);
      setSafetyStopDepth("");
      setSafetyStopDuration("");
      setSurfaceIntervalMin("");
      setCurrent("");
      setExposureProtection("");
      setTankCylinder("");
      setGearKitId("");
      setGearNotes("");
      setIsTrainingDive(false);
      setTrainingCourse("");
      setTrainingInstructor("");
      setTrainingSkills("");
      setSelectedDiveTypes([]);
    }
  };

  useEffect(() => {
    initFromEntry(activeEntry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntry, formKey]);

  // When creating: as soon as date is set, suggest dive # by chronology (other dives only renumber on save).
  useEffect(() => {
    if (activeEntry || isDiveNumberOverridden) return;
    const next = suggestedForNewDive ?? suggestedDiveNumber ?? null;
    const nextStr = next != null ? String(next) : "";
    setDiveNumberAuto(next);
    if (diveNumber !== nextStr) {
      setDiveNumber(nextStr);
    }
  }, [
    activeEntry,
    isDiveNumberOverridden,
    suggestedForNewDive,
    suggestedDiveNumber,
    date,
    diveNumber,
  ]);

  // Smart time: Start+End → Bottom; Start+Bottom → End. Midnight: end < start = next day.
  // Do not overwrite the field the user just edited (lastEditedTime).
  useEffect(() => {
    const startMinutes = startTimeDisplay.trim()
      ? timeToMinutes(startTimeDisplay, startTimePeriod)
      : null;
    const endMinutes = endTimeDisplay.trim()
      ? timeToMinutes(endTimeDisplay, endTimePeriod)
      : null;
    const bottomNum = (() => {
      const v = bottomTime.trim();
      if (!v) return null;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    })();

    if (startMinutes != null && bottomNum != null && lastEditedTime !== "end") {
      const totalMin = startMinutes + bottomNum;
      const endMin = totalMin % (24 * 60);
      const { value, period } = minutesToDisplayTime(endMin);
      if (value && (endTimeDisplay !== value || endTimePeriod !== period)) {
        setEndTimeDisplay(value);
        setEndTimePeriod(period);
      }
    }

    if (
      startMinutes != null &&
      endMinutes != null &&
      lastEditedTime !== "bottom"
    ) {
      const duration = durationMinutes(startMinutes, endMinutes);
      const nextBottom = String(duration);
      if (bottomTime !== nextBottom) {
        setBottomTime(nextBottom);
      }
    }
  }, [
    startTimeDisplay,
    startTimePeriod,
    endTimeDisplay,
    endTimePeriod,
    bottomTime,
    lastEditedTime,
  ]);

  // Compute today's date client-side only to avoid SSR hydration mismatch
  useEffect(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setTodayStr(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    fetch("/api/gear-kits")
      .then((r) => (r.ok ? r.json() : { kits: [] }))
      .then((data) => setGearKits(data.kits || []))
      .catch((err) => {
        console.error("Failed to fetch gear kits", err);
        setGearKits([]);
      });
  }, []);

  const validateDate = (value: string) => {
    if (todayStr && value && value > todayStr) {
      setDateError("Future dates invalid.");
    } else {
      setDateError(null);
    }
  };

  const handleGearKitSelect = (kitId: string) => {
    setGearKitId(kitId);
    if (!kitId) return;
    const kit = gearKits.find((k) => k.id === kitId);
    if (kit?.kitItems) {
      onGearSelectionChange(kit.kitItems.map((ki) => ki.gearItemId));
    }
  };

  return {
    // Time/date state
    todayStr,
    dateError,
    setDateError,
    date,
    setDate,
    startTimeDisplay,
    setStartTimeDisplay,
    startTimePeriod,
    setStartTimePeriod,
    endTimeDisplay,
    setEndTimeDisplay,
    endTimePeriod,
    setEndTimePeriod,
    bottomTime,
    setBottomTime,
    lastEditedTime,
    setLastEditedTime,
    startTimeError,
    setStartTimeError,
    endTimeError,
    setEndTimeError,
    // Dive number
    diveNumber,
    setDiveNumber,
    diveNumberAuto,
    setDiveNumberAuto,
    isDiveNumberOverridden,
    setIsDiveNumberOverridden,
    // Location
    region,
    setRegion,
    buddyName,
    setBuddyName,
    notes,
    setNotes,
    siteName,
    setSiteName,
    // Metrics
    maxDepth,
    setMaxDepth,
    waterTempSurface,
    setWaterTempSurface,
    waterTempBottom,
    setWaterTempBottom,
    visibility,
    setVisibility,
    startPressure,
    setStartPressure,
    endPressure,
    setEndPressure,
    weightUsed,
    setWeightUsed,
    gasType,
    setGasType,
    fO2,
    setFO2,
    safetyStopEnabled,
    setSafetyStopEnabled,
    safetyStopDepth,
    setSafetyStopDepth,
    safetyStopDuration,
    setSafetyStopDuration,
    surfaceIntervalMin,
    setSurfaceIntervalMin,
    current,
    setCurrent,
    exposureProtection,
    setExposureProtection,
    tankCylinder,
    setTankCylinder,
    // Gear
    gearKitId,
    setGearKitId,
    gearNotes,
    setGearNotes,
    gearKits,
    handleGearKitSelect,
    // Training
    isTrainingDive,
    setIsTrainingDive,
    trainingCourse,
    setTrainingCourse,
    trainingInstructor,
    setTrainingInstructor,
    trainingSkills,
    setTrainingSkills,
    // Dive types
    selectedDiveTypes,
    setSelectedDiveTypes,
    showAllDiveTypes,
    setShowAllDiveTypes,
    // Computed
    gasUsedDisplay,
    // Handlers
    validateDate,
  };
}

export type DiveFormState = ReturnType<typeof useDiveFormState>;
