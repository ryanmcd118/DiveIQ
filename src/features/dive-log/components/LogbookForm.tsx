"use client";

import { FormEvent, useState, useEffect } from "react";
import type { DiveLogEntry } from "@/features/dive-log/types";
import type { SoftWarning } from "@/features/dive-log/types/softWarnings";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import {
  displayDepth,
  displayTemperature,
  displayDistance,
  getUnitLabel,
  formatPressureForDisplay,
  formatWeightForDisplay,
  safetyStopDepthCmToDisplay,
} from "@/lib/units";
import { GearSelection } from "./GearSelection";
import { AccordionSection } from "./AccordionSection";
import {
  CURRENT_OPTIONS,
  GAS_TYPE_OPTIONS,
  EXPOSURE_PROTECTION_OPTIONS,
} from "../constants";
import formStyles from "@/styles/components/Form.module.css";
import styles from "./LogbookForm.module.css";

const Field = ({
  children,
  col = 6,
}: {
  children: React.ReactNode;
  col?: 2 | 3 | 4 | 5 | 6 | 12;
}) => (
  <div
    className={
      col === 12
        ? styles.col12
        : col === 6
          ? styles.col6
          : col === 4
            ? styles.col4
            : col === 3
              ? styles.col3
              : styles.col2
    }
  >
    {children}
  </div>
);

// Most common (visible when collapsed)
const MOST_COMMON_DIVE_TYPES: string[] = [
  "Saltwater",
  "Freshwater",
  "Shore",
  "Boat",
  "Training",
];

// Expanded list (shown after "Show more")
const EXPANDED_DIVE_TYPES: string[] = [
  "Drift",
  "Night",
  "Wreck",
  "Reef",
  "Quarry",
  "Lake",
  "River",
  "Cave",
  "Ice",
  "Altitude",
  "Wall",
  "Pool",
  "Other",
];

function parseDiveTypeTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type LastEditedTime = "start" | "end" | "bottom" | null;

/**
 * Normalize flexible time input to HH:MM (12-hour display).
 * Accepts: 9, 09, 9:00, 9:5, 9:52, etc. Hour 0-12, minute 0-59.
 */
function normalizeTime(value: string): string {
  if (!value || !value.trim()) return "";
  const trimmed = value.trim();
  const parts = trimmed.split(":");
  const first = parts[0]?.replace(/\s/g, "") ?? "";
  let hour = parseInt(first, 10);
  let minute =
    parts[1] != null ? parseInt(String(parts[1]).replace(/\s/g, ""), 10) : 0;
  if (Number.isNaN(hour)) return "";
  if (Number.isNaN(minute)) minute = 0;
  hour = Math.max(0, Math.min(hour, 12));
  minute = Math.max(0, Math.min(minute, 59));
  const h = hour.toString().padStart(2, "0");
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m}`;
}

function splitTimeForDisplay(time: string | null | undefined): {
  value: string;
  period: "AM" | "PM";
} {
  if (!time) return { value: "", period: "AM" };
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { value: "", period: "AM" };

  let hours24 = Number(match[1]);
  const minutes = match[2];
  const period: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";

  if (hours24 === 0) {
    hours24 = 12;
  } else if (hours24 > 12) {
    hours24 -= 12;
  }

  const displayHours = hours24.toString().padStart(2, "0");
  return { value: `${displayHours}:${minutes}`, period };
}

function to24HourTime(value: string, period: "AM" | "PM"): string {
  const normalized = normalizeTime(value);
  if (!normalized) return "";
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";

  let hours = Number(match[1]);
  const minutes = match[2];
  if (hours === 0) hours = 12; // 00:xx display = 12 AM
  if (period === "AM") {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }

  const hStr = hours.toString().padStart(2, "0");
  return `${hStr}:${minutes}`;
}

function timeToMinutes(value: string, period: "AM" | "PM"): number | null {
  const normalized = normalizeTime(value);
  if (!normalized) return null;
  const time24 = to24HourTime(normalized, period);
  if (!time24) return null;
  const match = time24.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function minutesToDisplayTime(totalMinutes: number): {
  value: string;
  period: "AM" | "PM";
} {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const hours24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const period: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";

  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const displayHours = hours12.toString().padStart(2, "0");
  const displayMinutes = mins.toString().padStart(2, "0");
  return { value: `${displayHours}:${displayMinutes}`, period };
}

/** Duration in minutes; if end < start, assumes end is next day (+24h). */
function durationMinutes(startMin: number, endMin: number): number {
  if (endMin >= startMin) return endMin - startMin;
  return endMin + 24 * 60 - startMin;
}

interface LogbookFormProps {
  formId: string;
  formKey: string;
  activeEntry: DiveLogEntry | null;
  editingEntryId: string | null;
  entries?: DiveLogEntry[];
  suggestedDiveNumber?: number;
  error: string | null;
  softWarnings?: SoftWarning[];
  selectedGearIds?: string[];
  onGearSelectionChange: (ids: string[]) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function LogbookForm({
  formId,
  formKey,
  activeEntry,
  editingEntryId,
  entries = [],
  suggestedDiveNumber = 1,
  error,
  softWarnings = [],
  selectedGearIds = [],
  onGearSelectionChange,
  onSubmit,
}: LogbookFormProps) {
  const { prefs } = useUnitPreferences();

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

  useEffect(() => {
    fetch("/api/gear-kits")
      .then((r) => (r.ok ? r.json() : { kits: [] }))
      .then((data) => setGearKits(data.kits || []))
      .catch(() => setGearKits([]));
  }, []);

  const handleGearKitSelect = (kitId: string) => {
    setGearKitId(kitId);
    if (!kitId) return;
    const kit = gearKits.find((k) => k.id === kitId);
    if (kit?.kitItems) {
      onGearSelectionChange(kit.kitItems.map((ki) => ki.gearItemId));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    onSubmit(e);
  };

  return (
    <form
      id={formId}
      key={formKey}
      onSubmit={handleSubmit}
      className={styles.formRoot}
      noValidate
    >
      <div className={styles.columns}>
        <div className={styles.sectionCard}>
          <div className={styles.sectionBody}>
            {/* SECTION 1: Dive basics */}
            <section className={styles.coreSubsection}>
              <h3 className={styles.coreSubsectionHeader}>Dive basics</h3>
              {/* Row 1: Dive # | Date* | Start time + AM/PM | End time + AM/PM | Bottom time (min) — no Surface interval */}
              <div className={styles.timelineRow}>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <div className={styles.diveNumberHeader}>
                    <label htmlFor="diveNumber" className={styles.label}>
                      Dive #
                    </label>
                    {isDiveNumberOverridden && (
                      <span className={styles.diveNumberMeta}>
                        <span className={styles.diveNumberTag}>Manual</span>
                        <button
                          type="button"
                          className={styles.diveNumberReset}
                          onClick={() => {
                            const next =
                              diveNumberAuto != null
                                ? String(diveNumberAuto)
                                : "";
                            setDiveNumber(next);
                            setIsDiveNumberOverridden(false);
                          }}
                        >
                          Reset to auto
                        </button>
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    id="diveNumber"
                    name="diveNumber"
                    min={1}
                    placeholder={`e.g. ${suggestedDiveNumber}`}
                    value={diveNumber}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDiveNumber(v);
                      if (diveNumberAuto != null && v)
                        setIsDiveNumberOverridden(v !== String(diveNumberAuto));
                      else setIsDiveNumberOverridden(Boolean(v));
                    }}
                    className={styles.input}
                  />
                  <input
                    type="hidden"
                    name="diveNumberOverride"
                    value={
                      isDiveNumberOverridden && diveNumber ? diveNumber : ""
                    }
                  />
                </div>
                <div
                  className={`${styles.field} ${styles.inputSmall} ${styles.inputDate}`}
                >
                  <label htmlFor="date" className={styles.label}>
                    Date <span className={styles.labelRequired}>*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.timeGroup}>
                  <label htmlFor="startTimeDisplay" className={styles.label}>
                    Start time
                  </label>
                  <div className={styles.timeRow}>
                    <input
                      type="text"
                      id="startTimeDisplay"
                      placeholder="hh:mm"
                      value={startTimeDisplay}
                      onChange={(e) => {
                        setStartTimeDisplay(e.target.value);
                        setLastEditedTime("start");
                        if (startTimeError) setStartTimeError(null);
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        const normalized = normalizeTime(raw);
                        if (normalized && normalized !== raw)
                          setStartTimeDisplay(normalized);
                        const valueToCheck = normalized || raw;
                        if (
                          valueToCheck &&
                          !to24HourTime(valueToCheck, startTimePeriod)
                        )
                          setStartTimeError(
                            "Enter a valid time (e.g. 9:00 or 9:30)"
                          );
                        else setStartTimeError(null);
                      }}
                      className={`${styles.input} ${styles.inputSmall}`}
                    />
                    <select
                      aria-label="AM or PM for start time"
                      className={`${styles.select} ${styles.inputTiny}`}
                      value={startTimePeriod}
                      onChange={(e) => {
                        setStartTimePeriod(
                          e.target.value === "PM" ? "PM" : "AM"
                        );
                        setLastEditedTime("start");
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  {startTimeError && (
                    <span className={styles.timeFieldError} role="alert">
                      {startTimeError}
                    </span>
                  )}
                </div>
                <div className={styles.timeGroup}>
                  <label htmlFor="endTimeDisplay" className={styles.label}>
                    End time
                  </label>
                  <div className={styles.timeRow}>
                    <input
                      type="text"
                      id="endTimeDisplay"
                      placeholder="hh:mm"
                      value={endTimeDisplay}
                      onChange={(e) => {
                        setEndTimeDisplay(e.target.value);
                        setLastEditedTime("end");
                        if (endTimeError) setEndTimeError(null);
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        const normalized = normalizeTime(raw);
                        if (normalized && normalized !== raw)
                          setEndTimeDisplay(normalized);
                        const valueToCheck = normalized || raw;
                        if (
                          valueToCheck &&
                          !to24HourTime(valueToCheck, endTimePeriod)
                        )
                          setEndTimeError(
                            "Enter a valid time (e.g. 9:52 or 10:00)"
                          );
                        else setEndTimeError(null);
                      }}
                      className={`${styles.input} ${styles.inputSmall}`}
                    />
                    <select
                      aria-label="AM or PM for end time"
                      className={`${styles.select} ${styles.inputTiny}`}
                      value={endTimePeriod}
                      onChange={(e) => {
                        setEndTimePeriod(e.target.value === "PM" ? "PM" : "AM");
                        setLastEditedTime("end");
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  {endTimeError && (
                    <span className={styles.timeFieldError} role="alert">
                      {endTimeError}
                    </span>
                  )}
                </div>
                <input
                  type="hidden"
                  name="startTime"
                  value={to24HourTime(startTimeDisplay, startTimePeriod)}
                />
                <input
                  type="hidden"
                  name="endTime"
                  value={to24HourTime(endTimeDisplay, endTimePeriod)}
                />
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <label htmlFor="bottomTime" className={styles.label}>
                    Bottom time
                  </label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      id="bottomTime"
                      name="bottomTime"
                      min={0}
                      value={bottomTime}
                      onChange={(e) => {
                        setBottomTime(e.target.value);
                        setLastEditedTime("bottom");
                      }}
                      placeholder="—"
                      className={styles.input}
                    />
                    <span className={styles.unitSuffix}>min</span>
                  </div>
                </div>
              </div>
              {/* Row 2: Site name* | Location / Region | Buddy */}
              <div className={styles.locationRow}>
                <div className={styles.field}>
                  <label htmlFor="siteName" className={styles.label}>
                    Site name <span className={styles.labelRequired}>*</span>
                  </label>
                  <input
                    type="text"
                    id="siteName"
                    name="siteName"
                    required
                    placeholder="Mary's Place"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="region" className={styles.label}>
                    Location / Region
                  </label>
                  <input
                    type="text"
                    id="region"
                    name="region"
                    placeholder="Roatán, Red Sea, local quarry…"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="buddyName" className={styles.label}>
                    Buddy
                  </label>
                  <input
                    type="text"
                    id="buddyName"
                    name="buddyName"
                    value={buddyName}
                    onChange={(e) => setBuddyName(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 2: Dive metrics */}
            <section className={styles.coreSubsection}>
              <h3 className={styles.coreSubsectionHeader}>Dive metrics</h3>
              {/* Row 3: Environment — Max depth, Water temp surface, Water temp bottom, Visibility, Current (all one line) */}
              <div className={styles.metricsRow}>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <label htmlFor="maxDepth" className={styles.label}>
                    Max depth
                  </label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      id="maxDepth"
                      name="maxDepth"
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(e.target.value)}
                      className={styles.input}
                    />
                    <span className={styles.unitSuffix}>
                      {getUnitLabel("depth", prefs)}
                    </span>
                  </div>
                </div>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <label htmlFor="waterTempSurface" className={styles.label}>
                    Water temp surface
                  </label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      id="waterTempSurface"
                      name="waterTempSurface"
                      value={waterTempSurface}
                      onChange={(e) => setWaterTempSurface(e.target.value)}
                      className={styles.input}
                    />
                    <span className={styles.unitSuffix}>
                      {getUnitLabel("temperature", prefs)}
                    </span>
                  </div>
                </div>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <label htmlFor="waterTempBottom" className={styles.label}>
                    Water temp bottom
                  </label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      id="waterTempBottom"
                      name="waterTempBottom"
                      value={waterTempBottom}
                      onChange={(e) => setWaterTempBottom(e.target.value)}
                      className={styles.input}
                    />
                    <span className={styles.unitSuffix}>
                      {getUnitLabel("temperature", prefs)}
                    </span>
                  </div>
                </div>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <label htmlFor="visibility" className={styles.label}>
                    Visibility
                  </label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      id="visibility"
                      name="visibility"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className={styles.input}
                    />
                    <span className={styles.unitSuffix}>
                      {getUnitLabel("distance", prefs)}
                    </span>
                  </div>
                </div>
                <div className={`${styles.field} ${styles.inputMedium}`}>
                  <label htmlFor="current" className={styles.label}>
                    Current
                  </label>
                  <select
                    id="current"
                    name="current"
                    className={styles.select}
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                  >
                    {CURRENT_OPTIONS.map((o) => (
                      <option key={o.value || "none"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Row 4: Gas + Safety stop — all on one line; checkbox aligned with input baselines */}
              <div
                className={`${styles.gasRow} ${gasType === "Nitrox" ? styles.gasRowWithFO2 : ""}`}
              >
                <div className={`${styles.field} ${styles.inputMedium}`}>
                  <label htmlFor="gasType" className={styles.label}>
                    Gas type
                  </label>
                  <select
                    id="gasType"
                    name="gasType"
                    className={styles.select}
                    value={gasType}
                    onChange={(e) => setGasType(e.target.value)}
                  >
                    {GAS_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                {gasType === "Nitrox" && (
                  <div className={`${styles.field} ${styles.inputSmall}`}>
                    <label htmlFor="fO2" className={styles.label}>
                      FO2 (%)
                    </label>
                    <input
                      type="number"
                      id="fO2"
                      name="fO2"
                      min={21}
                      max={100}
                      value={fO2}
                      onChange={(e) => setFO2(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                )}
                <div className={`${styles.field} ${styles.inputMedium}`}>
                  <label htmlFor="tankCylinder" className={styles.label}>
                    Tank / cylinder
                  </label>
                  <input
                    type="text"
                    id="tankCylinder"
                    name="tankCylinder"
                    placeholder="AL80, HP100…"
                    value={tankCylinder}
                    onChange={(e) => setTankCylinder(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <label htmlFor="startPressure" className={styles.label}>
                    Start pressure
                  </label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      id="startPressure"
                      name="startPressure"
                      value={startPressure}
                      onChange={(e) => setStartPressure(e.target.value)}
                      className={styles.input}
                    />
                    <span className={styles.unitSuffix}>
                      {getUnitLabel("pressure", prefs)}
                    </span>
                  </div>
                </div>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <label htmlFor="endPressure" className={styles.label}>
                    End pressure
                  </label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      id="endPressure"
                      name="endPressure"
                      value={endPressure}
                      onChange={(e) => setEndPressure(e.target.value)}
                      className={styles.input}
                    />
                    <span className={styles.unitSuffix}>
                      {getUnitLabel("pressure", prefs)}
                    </span>
                  </div>
                </div>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <span className={styles.label}>Gas used</span>
                  <div className={styles.inputWithUnit}>
                    <div
                      className={styles.gasUsedReadOnly}
                      aria-live="polite"
                      aria-label={`Gas used: ${gasUsedDisplay != null ? `${gasUsedDisplay} ${getUnitLabel("pressure", prefs)}` : "—"}`}
                    >
                      {gasUsedDisplay != null ? gasUsedDisplay : "—"}
                    </div>
                    <span className={styles.unitSuffix}>
                      {getUnitLabel("pressure", prefs)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Row 5: Weight / Exposure / Surface interval */}
              <div className={styles.exposureRow}>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <label htmlFor="weightUsed" className={styles.label}>
                    Weight used ({getUnitLabel("weight", prefs)})
                  </label>
                  <input
                    type="number"
                    id="weightUsed"
                    name="weightUsed"
                    min={0}
                    value={weightUsed}
                    onChange={(e) => setWeightUsed(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={`${styles.field} ${styles.inputMedium}`}>
                  <label htmlFor="exposureProtection" className={styles.label}>
                    Exposure protection
                  </label>
                  <select
                    id="exposureProtection"
                    name="exposureProtection"
                    className={styles.select}
                    value={exposureProtection}
                    onChange={(e) => setExposureProtection(e.target.value)}
                  >
                    {EXPOSURE_PROTECTION_OPTIONS.map((o) => (
                      <option key={o.value || "none"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`${styles.field} ${styles.inputSmall}`}>
                  <label htmlFor="surfaceIntervalMin" className={styles.label}>
                    Surface interval (min)
                  </label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      id="surfaceIntervalMin"
                      name="surfaceIntervalMin"
                      min={0}
                      value={surfaceIntervalMin}
                      onChange={(e) => setSurfaceIntervalMin(e.target.value)}
                      placeholder="—"
                      className={styles.input}
                    />
                    <span className={styles.unitSuffix}>min</span>
                  </div>
                </div>
                <div className={styles.fieldSafetyStop}>
                  <div className={styles.safetyStopInline}>
                    <label
                      className={styles.safetyStopLabel}
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="checkbox"
                        checked={safetyStopEnabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (!checked) {
                            setSafetyStopEnabled(false);
                            setSafetyStopDepth("");
                            setSafetyStopDuration("");
                          } else setSafetyStopEnabled(true);
                        }}
                      />
                      <span className={styles.label}>Safety stop</span>
                    </label>
                    <div className={styles.safetyStopInputs}>
                      <input
                        type="number"
                        id="safetyStopDepth"
                        name="safetyStopDepth"
                        value={safetyStopDepth}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSafetyStopDepth(v);
                          if (v.trim() !== "" && !safetyStopEnabled)
                            setSafetyStopEnabled(true);
                        }}
                        className={styles.input}
                      />
                      <span className={styles.unitSuffix}>
                        {getUnitLabel("depth", prefs)}
                      </span>
                      <input
                        type="number"
                        id="safetyStopDuration"
                        name="safetyStopDuration"
                        min={1}
                        value={safetyStopDuration}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSafetyStopDuration(v);
                          if (v.trim() !== "" && !safetyStopEnabled)
                            setSafetyStopEnabled(true);
                        }}
                        className={styles.input}
                      />
                      <span className={styles.unitSuffix}>min</span>
                    </div>
                  </div>
                  <input
                    type="hidden"
                    name="safetyStopEnabled"
                    value={safetyStopEnabled ? "1" : "0"}
                  />
                </div>
              </div>
              {/* Row 6: Dive type + Notes two-column layout */}
              <div className={styles.diveTypeNotesRow}>
                <div className={styles.diveTypePanel}>
                  <span className={styles.label}>Dive type</span>
                  <div className={styles.diveTypeRow}>
                    {MOST_COMMON_DIVE_TYPES.map((tag) => (
                      <label
                        key={tag}
                        className={`${styles.diveTypeChip} ${selectedDiveTypes.includes(tag) ? styles.diveTypeChipSelected : ""}`}
                      >
                        <input
                          type="checkbox"
                          name="diveTypeTags"
                          value={tag}
                          checked={selectedDiveTypes.includes(tag)}
                          onChange={(e) =>
                            setSelectedDiveTypes((prev) =>
                              e.target.checked
                                ? [...prev, tag]
                                : prev.filter((t) => t !== tag)
                            )
                          }
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                    {!showAllDiveTypes && (
                      <>
                        <button
                          type="button"
                          className={styles.diveTypeShowMore}
                          onClick={() => setShowAllDiveTypes(true)}
                        >
                          Show more
                        </button>
                        {selectedDiveTypes.filter((t) =>
                          EXPANDED_DIVE_TYPES.includes(t)
                        ).length > 0 && (
                          <span className={styles.diveTypeMoreSelected}>
                            +
                            {
                              selectedDiveTypes.filter((t) =>
                                EXPANDED_DIVE_TYPES.includes(t)
                              ).length
                            }{" "}
                            more selected
                          </span>
                        )}
                      </>
                    )}
                    {showAllDiveTypes &&
                      EXPANDED_DIVE_TYPES.map((tag) => (
                        <label
                          key={tag}
                          className={`${styles.diveTypeChip} ${
                            selectedDiveTypes.includes(tag)
                              ? styles.diveTypeChipSelected
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="diveTypeTags"
                            value={tag}
                            checked={selectedDiveTypes.includes(tag)}
                            onChange={(e) =>
                              setSelectedDiveTypes((prev) =>
                                e.target.checked
                                  ? [...prev, tag]
                                  : prev.filter((t) => t !== tag)
                              )
                            }
                          />
                          <span>{tag}</span>
                        </label>
                      ))}
                    {showAllDiveTypes && (
                      <button
                        type="button"
                        className={styles.diveTypeShowMore}
                        onClick={() => setShowAllDiveTypes(false)}
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.notesPanel}>
                  <label htmlFor="notes" className={styles.label}>
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    placeholder="Wildlife, conditions, gear notes, memorable moments…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={styles.textarea}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Advanced accordion — divider above so it doesn't float */}
        <div className={styles.advancedSectionWrap}>
          <AccordionSection
            id="advanced"
            title="Advanced"
            defaultOpen={false}
            summary="Gear, exposure, training"
          >
            <div className={styles.sectionBody}>
              <h4 className={styles.subsectionHeader}>Gear used</h4>
              <div className={styles.formGrid12}>
                <Field col={12}>
                  <div className={styles.field}>
                    <label htmlFor="gearKitId" className={styles.label}>
                      Gear kit
                    </label>
                    <select
                      id="gearKitId"
                      name="gearKitId"
                      className={styles.select}
                      value={gearKitId}
                      onChange={(e) => handleGearKitSelect(e.target.value)}
                    >
                      <option value="">None</option>
                      {gearKits.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>
              <div className={styles.gearTwoCol}>
                <div className={styles.gearColumn}>
                  <div className={styles.gearListPanel}>
                    <GearSelection
                      selectedGearIds={selectedGearIds}
                      onSelectionChange={onGearSelectionChange}
                      editingEntryId={editingEntryId}
                    />
                  </div>
                </div>
                <div className={styles.gearColumn}>
                  <div className={styles.gearNotesPanel}>
                    <label htmlFor="gearNotes" className={styles.label}>
                      Gear notes
                    </label>
                    <textarea
                      id="gearNotes"
                      name="gearNotes"
                      placeholder="Exceptions, replacements…"
                      value={gearNotes}
                      onChange={(e) => setGearNotes(e.target.value)}
                      className={styles.textarea}
                    />
                  </div>
                </div>
              </div>

              <h4 className={styles.subsectionHeader}>Training</h4>
              <div className={styles.formGrid12}>
                <Field col={12}>
                  <label
                    className={styles.safetyStopRow}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      name="isTrainingDive"
                      checked={isTrainingDive}
                      onChange={(e) => setIsTrainingDive(e.target.checked)}
                    />
                    <span className={styles.label}>Training dive?</span>
                  </label>
                </Field>
                {isTrainingDive && (
                  <>
                    <Field col={6}>
                      <div className={styles.field}>
                        <label
                          htmlFor="trainingCourse"
                          className={styles.label}
                        >
                          Course
                        </label>
                        <input
                          type="text"
                          id="trainingCourse"
                          name="trainingCourse"
                          placeholder="e.g. AOW, Rescue"
                          value={trainingCourse}
                          onChange={(e) => setTrainingCourse(e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </Field>
                    <Field col={6}>
                      <div className={styles.field}>
                        <label
                          htmlFor="trainingInstructor"
                          className={styles.label}
                        >
                          Instructor / DM
                        </label>
                        <input
                          type="text"
                          id="trainingInstructor"
                          name="trainingInstructor"
                          value={trainingInstructor}
                          onChange={(e) =>
                            setTrainingInstructor(e.target.value)
                          }
                          className={styles.input}
                        />
                      </div>
                    </Field>
                    <Field col={12}>
                      <div className={styles.field}>
                        <label
                          htmlFor="trainingSkills"
                          className={styles.label}
                        >
                          Skills practiced
                        </label>
                        <input
                          type="text"
                          id="trainingSkills"
                          name="trainingSkills"
                          placeholder="Comma-separated or list"
                          value={trainingSkills}
                          onChange={(e) => setTrainingSkills(e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </Field>
                  </>
                )}
              </div>
            </div>
          </AccordionSection>
        </div>
      </div>

      {/* Alerts - span full width */}
      {(softWarnings.length > 0 || error) && (
        <div className={styles.formAlerts}>
          {softWarnings.length > 0 && (
            <ul
              className={formStyles.error}
              style={{
                color: "var(--color-warning, #f59e0b)",
                marginBottom: "var(--space-2)",
              }}
            >
              {softWarnings.map((w) => (
                <li key={w.fieldKey}>{w.message}</li>
              ))}
            </ul>
          )}
          {error && <p className={formStyles.error}>{error}</p>}
        </div>
      )}
    </form>
  );
}
