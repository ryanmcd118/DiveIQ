"use client";

import { FormEvent, useState, useEffect, useCallback } from "react";
import type { DiveLogEntry } from "@/features/dive-log/types";
import type { SoftWarning } from "@/features/dive-log/types/softWarnings";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import {
  displayDepth,
  displayTemperature,
  displayDistance,
  getUnitLabel,
  pressureInputToBar,
  formatPressureForDisplay,
  formatWeightForDisplay,
  safetyStopDepthCmToDisplay,
} from "@/lib/units";
import { GearSelection } from "./GearSelection";
import { AccordionSection } from "./AccordionSection";
import {
  DIVE_TYPE_TAGS,
  CURRENT_OPTIONS,
  GAS_TYPE_OPTIONS,
  EXPOSURE_PROTECTION_OPTIONS,
} from "../constants";
import {
  profileSummaryFromForm,
  conditionsSummaryFromForm,
  gasSummaryFromForm,
  exposureSummaryFromForm,
  gearSummaryFromForm,
  trainingSummaryFromForm,
  type FormSummaryValues,
} from "../utils/formSectionSummaries";
import formStyles from "@/styles/components/Form.module.css";

function parseDiveTypeTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface LogbookFormProps {
  formId: string;
  formKey: string;
  activeEntry: DiveLogEntry | null;
  editingEntryId: string | null;
  suggestedDiveNumber?: number;
  saving: boolean;
  error: string | null;
  softWarnings?: SoftWarning[];
  selectedGearIds?: string[];
  onGearSelectionChange: (ids: string[]) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: (form?: HTMLFormElement | null) => void;
  onDeleteFromForm: (form: HTMLFormElement) => void;
}

export function LogbookForm({
  formId,
  formKey,
  activeEntry,
  editingEntryId,
  suggestedDiveNumber = 1,
  saving,
  error,
  softWarnings = [],
  selectedGearIds = [],
  onGearSelectionChange,
  onSubmit,
  onCancelEdit,
  onDeleteFromForm,
}: LogbookFormProps) {
  const { prefs } = useUnitPreferences();

  const [siteName, setSiteName] = useState("");
  const [maxDepth, setMaxDepth] = useState("");
  const [bottomTime, setBottomTime] = useState("");
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
  const [safetyStopDuration, setSafetyStopDuration] = useState("3");
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
  const [gearKits, setGearKits] = useState<{ id: string; name: string; kitItems: { gearItemId: string }[] }[]>([]);

  const initFromEntry = useCallback(
    (entry: DiveLogEntry | null) => {
      if (entry) {
        setSiteName(entry.siteName ?? "");
        setMaxDepth(entry.maxDepthCm != null ? displayDepth(entry.maxDepthCm, prefs.depth).value : "");
        setBottomTime(entry.bottomTime != null ? String(entry.bottomTime) : "");
        setWaterTempSurface(entry.waterTempCx10 != null ? displayTemperature(entry.waterTempCx10, prefs.temperature).value : "");
        setWaterTempBottom(entry.waterTempBottomCx10 != null ? displayTemperature(entry.waterTempBottomCx10, prefs.temperature).value : "");
        setVisibility(entry.visibilityCm != null ? displayDistance(entry.visibilityCm, prefs.depth).value : "");
        setStartPressure(entry.startPressureBar != null ? formatPressureForDisplay(entry.startPressureBar, prefs.pressure) : "");
        setEndPressure(entry.endPressureBar != null ? formatPressureForDisplay(entry.endPressureBar, prefs.pressure) : "");
        setWeightUsed(entry.weightUsedKg != null ? formatWeightForDisplay(entry.weightUsedKg, prefs.weight) : "");
        setGasType(entry.gasType ?? "Air");
        setFO2(entry.fO2 != null ? String(entry.fO2) : "32");
        setSafetyStopEnabled(entry.safetyStopDepthCm != null || entry.safetyStopDurationMin != null);
        setSafetyStopDepth(safetyStopDepthCmToDisplay(entry.safetyStopDepthCm, prefs.depth));
        setSafetyStopDuration(entry.safetyStopDurationMin != null ? String(entry.safetyStopDurationMin) : "3");
        setSurfaceIntervalMin(entry.surfaceIntervalMin != null ? String(entry.surfaceIntervalMin) : "");
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
        setSafetyStopDepth(prefs.depth === "m" ? "5" : "15");
        setSafetyStopDuration("3");
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
    },
    [prefs]
  );

  useEffect(() => {
    initFromEntry(activeEntry);
  }, [activeEntry, formKey, initFromEntry]);

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

  const gearKitName = gearKitId ? gearKits.find((k) => k.id === gearKitId)?.name ?? undefined : undefined;

  const formValues: FormSummaryValues = {
    siteName,
    maxDepth,
    bottomTime,
    waterTempSurface,
    waterTempBottom,
    visibility,
    current,
    gasType,
    fO2,
    tankCylinder,
    startPressure,
    endPressure,
    exposureProtection,
    weightUsed,
    gearKitName,
    gearItemCount: selectedGearIds?.length ?? 0,
    gearNotes,
    isTrainingDive,
    trainingCourse,
    trainingSkills,
    safetyStopDepth: safetyStopEnabled ? safetyStopDepth : undefined,
    safetyStopDuration: safetyStopEnabled ? safetyStopDuration : undefined,
    surfaceIntervalMin,
  };

  const coreSum = siteName.trim() || undefined;
  const profileSum = profileSummaryFromForm(formValues, prefs);
  const conditionsSum = conditionsSummaryFromForm(formValues, prefs);
  const gasSum = gasSummaryFromForm(formValues, prefs);
  const exposureSum = exposureSummaryFromForm(formValues, prefs);
  const gearSum = gearSummaryFromForm(formValues);
  const trainingSum = trainingSummaryFromForm(formValues);

  return (
    <form
      id={formId}
      key={`${formKey}-${prefs.depth}-${prefs.temperature}-${prefs.pressure}-${prefs.weight}`}
      onSubmit={handleSubmit}
      className={formStyles.form}
    >
      <AccordionSection id="core" title="Core" defaultOpen summary={coreSum}>
        <div className={formStyles.formGroup}>
          <div className={formStyles.formGrid2}>
            <div className={formStyles.field}>
              <label htmlFor="date" className={formStyles.label}>Date *</label>
              <input type="date" id="date" name="date" required defaultValue={activeEntry?.date ?? ""} className={formStyles.input} />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="startTime" className={formStyles.label}>Start time</label>
              <input type="time" id="startTime" name="startTime" defaultValue={activeEntry?.startTime ?? ""} className={formStyles.input} />
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="diveNumber" className={formStyles.label}>Dive #</label>
            <input type="number" id="diveNumber" name="diveNumber" min={1} placeholder={`e.g. ${suggestedDiveNumber}`} defaultValue={activeEntry?.diveNumber ?? ""} className={formStyles.input} />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="siteName" className={formStyles.label}>Site name *</label>
            <input type="text" id="siteName" name="siteName" required placeholder="Mary's Place" value={siteName} onChange={(e) => setSiteName(e.target.value)} className={formStyles.input} />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="region" className={formStyles.label}>Location / Region</label>
            <input type="text" id="region" name="region" placeholder="Roatán, Red Sea, local quarry…" defaultValue={activeEntry?.region ?? ""} className={formStyles.input} />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="buddyName" className={formStyles.label}>Buddy</label>
            <input type="text" id="buddyName" name="buddyName" placeholder="Optional" defaultValue={activeEntry?.buddyName ?? ""} className={formStyles.input} />
          </div>
          <div className={formStyles.field}>
            <span className={formStyles.label}>Dive type</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              {DIVE_TYPE_TAGS.map((tag) => (
                <label key={tag} style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                  <input
                    type="checkbox"
                    name="diveTypeTags"
                    value={tag}
                    checked={selectedDiveTypes.includes(tag)}
                    onChange={(e) => {
                      setSelectedDiveTypes((prev) =>
                        e.target.checked ? [...prev, tag] : prev.filter((t) => t !== tag)
                      );
                    }}
                    className={formStyles.input}
                    style={{ width: "auto" }}
                  />
                  <span style={{ fontSize: "var(--font-size-sm)" }}>{tag}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="profile" title="Profile" defaultOpen summary={profileSum}>
        <div className={formStyles.formGroup}>
          <div className={formStyles.formGrid2}>
            <div className={formStyles.field}>
              <label htmlFor="maxDepth" className={formStyles.label}>Max depth ({getUnitLabel("depth", prefs)})</label>
              <input type="number" id="maxDepth" name="maxDepth" value={maxDepth} onChange={(e) => setMaxDepth(e.target.value)} placeholder="Optional" className={formStyles.input} />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="bottomTime" className={formStyles.label}>Bottom time (min)</label>
              <input type="number" id="bottomTime" name="bottomTime" min={0} value={bottomTime} onChange={(e) => setBottomTime(e.target.value)} placeholder="Optional" className={formStyles.input} />
            </div>
          </div>
          <div className={formStyles.field}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={safetyStopEnabled} onChange={(e) => setSafetyStopEnabled(e.target.checked)} />
              <span className={formStyles.label}>Safety stop</span>
            </label>
            {safetyStopEnabled && (
              <div className={formStyles.formGrid2} style={{ marginTop: "var(--space-2)" }}>
                <div className={formStyles.field}>
                  <label htmlFor="safetyStopDepth" className={formStyles.label}>Depth ({getUnitLabel("depth", prefs)})</label>
                  <input type="number" id="safetyStopDepth" name="safetyStopDepth" value={safetyStopDepth} onChange={(e) => setSafetyStopDepth(e.target.value)} placeholder={prefs.depth === "m" ? "5" : "15"} className={formStyles.input} />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="safetyStopDuration" className={formStyles.label}>Duration (min)</label>
                  <input type="number" id="safetyStopDuration" name="safetyStopDuration" min={1} value={safetyStopDuration} onChange={(e) => setSafetyStopDuration(e.target.value)} placeholder="3" className={formStyles.input} />
                </div>
              </div>
            )}
            <input type="hidden" name="safetyStopEnabled" value={safetyStopEnabled ? "1" : "0"} />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="surfaceIntervalMin" className={formStyles.label}>Surface interval (min)</label>
            <input type="number" id="surfaceIntervalMin" name="surfaceIntervalMin" min={0} value={surfaceIntervalMin} onChange={(e) => setSurfaceIntervalMin(e.target.value)} placeholder="Optional" className={formStyles.input} />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="notes" title="Notes" defaultOpen>
        <div className={formStyles.field}>
          <label htmlFor="notes" className={formStyles.label}>Notes</label>
          <textarea id="notes" name="notes" rows={4} placeholder="Conditions, wildlife, gear notes…" defaultValue={activeEntry?.notes ?? ""} className={formStyles.textarea} />
        </div>
      </AccordionSection>

      <AccordionSection id="conditions" title="Conditions" defaultOpen={false} summary={conditionsSum}>
        <div className={formStyles.formGroup}>
          <div className={formStyles.formGrid2}>
            <div className={formStyles.field}>
              <label htmlFor="waterTempSurface" className={formStyles.label}>Water temp surface ({getUnitLabel("temperature", prefs)})</label>
              <input type="number" id="waterTempSurface" name="waterTempSurface" value={waterTempSurface} onChange={(e) => setWaterTempSurface(e.target.value)} className={formStyles.input} />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="waterTempBottom" className={formStyles.label}>Water temp bottom ({getUnitLabel("temperature", prefs)})</label>
              <input type="number" id="waterTempBottom" name="waterTempBottom" value={waterTempBottom} onChange={(e) => setWaterTempBottom(e.target.value)} className={formStyles.input} />
            </div>
          </div>
          <div className={formStyles.formGrid2}>
            <div className={formStyles.field}>
              <label htmlFor="visibility" className={formStyles.label}>Visibility ({getUnitLabel("distance", prefs)})</label>
              <input type="number" id="visibility" name="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)} className={formStyles.input} />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="current" className={formStyles.label}>Current</label>
              <select id="current" name="current" className={formStyles.select} value={current} onChange={(e) => setCurrent(e.target.value)}>
                {CURRENT_OPTIONS.map((o) => (
                  <option key={o.value || "none"} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="gas" title="Gas" defaultOpen={false} summary={gasSum}>
        <div className={formStyles.formGroup}>
          <div className={formStyles.field}>
            <label htmlFor="gasType" className={formStyles.label}>Gas type</label>
            <select id="gasType" name="gasType" className={formStyles.select} value={gasType} onChange={(e) => setGasType(e.target.value)}>
              {GAS_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {gasType === "Nitrox" && (
            <div className={formStyles.field}>
              <label htmlFor="fO2" className={formStyles.label}>FO2 (%) *</label>
              <input type="number" id="fO2" name="fO2" min={21} max={100} value={fO2} onChange={(e) => setFO2(e.target.value)} required className={formStyles.input} />
            </div>
          )}
          <div className={formStyles.field}>
            <label htmlFor="tankCylinder" className={formStyles.label}>Tank / cylinder</label>
            <input type="text" id="tankCylinder" name="tankCylinder" placeholder="AL80, HP100…" value={tankCylinder} onChange={(e) => setTankCylinder(e.target.value)} className={formStyles.input} />
          </div>
          <div className={formStyles.formGrid2}>
            <div className={formStyles.field}>
              <label htmlFor="startPressure" className={formStyles.label}>Start pressure ({getUnitLabel("pressure", prefs)})</label>
              <input type="number" id="startPressure" name="startPressure" value={startPressure} onChange={(e) => setStartPressure(e.target.value)} className={formStyles.input} />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="endPressure" className={formStyles.label}>End pressure ({getUnitLabel("pressure", prefs)})</label>
              <input type="number" id="endPressure" name="endPressure" value={endPressure} onChange={(e) => setEndPressure(e.target.value)} className={formStyles.input} />
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="exposure" title="Exposure & Weight" defaultOpen={false} summary={exposureSum}>
        <div className={formStyles.formGroup}>
          <div className={formStyles.field}>
            <label htmlFor="exposureProtection" className={formStyles.label}>Exposure protection</label>
            <select id="exposureProtection" name="exposureProtection" className={formStyles.select} value={exposureProtection} onChange={(e) => setExposureProtection(e.target.value)}>
              {EXPOSURE_PROTECTION_OPTIONS.map((o) => (
                <option key={o.value || "none"} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="weightUsed" className={formStyles.label}>Weight used ({getUnitLabel("weight", prefs)})</label>
            <input type="number" id="weightUsed" name="weightUsed" min={0} value={weightUsed} onChange={(e) => setWeightUsed(e.target.value)} className={formStyles.input} />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="gear" title="Gear used" defaultOpen={false} summary={gearSum}>
        <div className={formStyles.formGroup}>
          <div className={formStyles.field}>
            <label htmlFor="gearKitId" className={formStyles.label}>Gear kit</label>
            <select id="gearKitId" name="gearKitId" className={formStyles.select} value={gearKitId} onChange={(e) => handleGearKitSelect(e.target.value)}>
              <option value="">None</option>
              {gearKits.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          </div>
          <GearSelection selectedGearIds={selectedGearIds} onSelectionChange={onGearSelectionChange} editingEntryId={editingEntryId} />
          <div className={formStyles.field}>
            <label htmlFor="gearNotes" className={formStyles.label}>Gear notes</label>
            <input type="text" id="gearNotes" name="gearNotes" placeholder="Exceptions, replacements…" value={gearNotes} onChange={(e) => setGearNotes(e.target.value)} className={formStyles.input} />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="training" title="Training" defaultOpen={false} summary={trainingSum}>
        <div className={formStyles.formGroup}>
          <div className={formStyles.field}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
              <input type="checkbox" name="isTrainingDive" checked={isTrainingDive} onChange={(e) => setIsTrainingDive(e.target.checked)} />
              <span className={formStyles.label}>Training dive?</span>
            </label>
          </div>
          {isTrainingDive && (
            <>
              <div className={formStyles.field}>
                <label htmlFor="trainingCourse" className={formStyles.label}>Course</label>
                <input type="text" id="trainingCourse" name="trainingCourse" placeholder="e.g. AOW, Rescue" value={trainingCourse} onChange={(e) => setTrainingCourse(e.target.value)} className={formStyles.input} />
              </div>
              <div className={formStyles.field}>
                <label htmlFor="trainingInstructor" className={formStyles.label}>Instructor / DM</label>
                <input type="text" id="trainingInstructor" name="trainingInstructor" value={trainingInstructor} onChange={(e) => setTrainingInstructor(e.target.value)} className={formStyles.input} />
              </div>
              <div className={formStyles.field}>
                <label htmlFor="trainingSkills" className={formStyles.label}>Skills practiced</label>
                <input type="text" id="trainingSkills" name="trainingSkills" placeholder="Comma-separated or list" value={trainingSkills} onChange={(e) => setTrainingSkills(e.target.value)} className={formStyles.input} />
              </div>
            </>
          )}
        </div>
      </AccordionSection>

      {softWarnings.length > 0 && (
        <div className={formStyles.field} style={{ marginTop: "var(--space-4)" }}>
          <ul style={{ fontSize: "var(--font-size-sm)", color: "var(--color-warning-text, #f59e0b)" }}>
            {softWarnings.map((w) => (
              <li key={w.fieldKey}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className={formStyles.error}>{error}</p>}
    </form>
  );
}
