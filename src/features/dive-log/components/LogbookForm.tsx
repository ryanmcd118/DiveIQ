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
  DIVE_TYPE_TAGS,
  CURRENT_OPTIONS,
  GAS_TYPE_OPTIONS,
  EXPOSURE_PROTECTION_OPTIONS,
} from "../constants";
import {
  conditionsSummaryFromForm,
  gasSummaryFromForm,
  exposureSummaryFromForm,
  gearSummaryFromForm,
  trainingSummaryFromForm,
  type FormSummaryValues,
} from "../utils/formSectionSummaries";
import formStyles from "@/styles/components/Form.module.css";
import styles from "./LogbookForm.module.css";

const Field = ({
  children,
  col = 6,
}: {
  children: React.ReactNode;
  col?: 6 | 12;
}) => (
  <div className={col === 12 ? styles.col12 : styles.col6}>{children}</div>
);

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
  suggestedDiveNumber = 1,
  error,
  softWarnings = [],
  selectedGearIds = [],
  onGearSelectionChange,
  onSubmit,
}: LogbookFormProps) {
  const { prefs } = useUnitPreferences();

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [diveNumber, setDiveNumber] = useState("");
  const [region, setRegion] = useState("");
  const [buddyName, setBuddyName] = useState("");
  const [notes, setNotes] = useState("");
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

  const initFromEntry = (entry: DiveLogEntry | null) => {
    if (entry) {
      setDate(entry.date ?? "");
      setStartTime(entry.startTime ?? "");
      setDiveNumber(entry.diveNumber != null ? String(entry.diveNumber) : "");
      setRegion(entry.region ?? "");
      setBuddyName(entry.buddyName ?? "");
      setNotes(entry.notes ?? "");
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
      setDate("");
      setStartTime("");
      setDiveNumber("");
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
  };

  useEffect(() => {
    initFromEntry(activeEntry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntry, formKey]);

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

  const conditionsSum = conditionsSummaryFromForm(formValues, prefs);
  const gasSum = gasSummaryFromForm(formValues, prefs);
  const exposureSum = exposureSummaryFromForm(formValues, prefs);
  const gearSum = gearSummaryFromForm(formValues);
  const trainingSum = trainingSummaryFromForm(formValues);

  return (
    <form
      id={formId}
      key={formKey}
      onSubmit={handleSubmit}
      className={styles.formRoot}
    >
      <div className={styles.columns}>
        {/* Left column: Core, Profile, Notes */}
        <div className={styles.leftCol}>
          <div className={styles.leftColumn}>
        {/* Core */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionHeader}>Core</h3>
          <div className={styles.sectionBody}>
            <div className={styles.formGrid12}>
              <Field col={6}>
                <div className={styles.field}>
                  <label htmlFor="date" className={styles.label}>Date *</label>
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
              </Field>
              <Field col={6}>
                <div className={styles.field}>
                  <label htmlFor="startTime" className={styles.label}>Start time</label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </Field>
              <Field col={6}>
                <div className={styles.field}>
                  <label htmlFor="diveNumber" className={styles.label}>Dive #</label>
                  <input
                    type="number"
                    id="diveNumber"
                    name="diveNumber"
                    min={1}
                    placeholder={`e.g. ${suggestedDiveNumber}`}
                    value={diveNumber}
                    onChange={(e) => setDiveNumber(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </Field>
              <Field col={12}>
                <div className={styles.field}>
                  <label htmlFor="siteName" className={styles.label}>Site name *</label>
                  <input type="text" id="siteName" name="siteName" required placeholder="Mary's Place" value={siteName} onChange={(e) => setSiteName(e.target.value)} className={styles.input} />
                </div>
              </Field>
              <Field col={12}>
                <div className={styles.field}>
                  <label htmlFor="region" className={styles.label}>Location / Region</label>
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
              </Field>
              <Field col={12}>
                <div className={styles.field}>
                  <label htmlFor="buddyName" className={styles.label}>Buddy</label>
                  <input
                    type="text"
                    id="buddyName"
                    name="buddyName"
                    placeholder="Optional"
                    value={buddyName}
                    onChange={(e) => setBuddyName(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </Field>
              <Field col={12}>
                <div className={styles.field}>
                  <span className={styles.label}>Dive type</span>
                  <div className={styles.diveTypeRow}>
                    {DIVE_TYPE_TAGS.map((tag) => (
                      <label key={tag} className={styles.diveTypeChip}>
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
                          style={{ width: "auto" }}
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionHeader}>Profile</h3>
          <div className={styles.sectionBody}>
            <div className={styles.formGrid12}>
              <Field col={6}>
                <div className={styles.field}>
                  <label htmlFor="maxDepth" className={styles.label}>Max depth ({getUnitLabel("depth", prefs)})</label>
                  <input type="number" id="maxDepth" name="maxDepth" value={maxDepth} onChange={(e) => setMaxDepth(e.target.value)} placeholder="Optional" className={styles.input} />
                </div>
              </Field>
              <Field col={6}>
                <div className={styles.field}>
                  <label htmlFor="bottomTime" className={styles.label}>Bottom time (min)</label>
                  <input type="number" id="bottomTime" name="bottomTime" min={0} value={bottomTime} onChange={(e) => setBottomTime(e.target.value)} placeholder="Optional" className={styles.input} />
                </div>
              </Field>
              <Field col={12}>
                <div className={styles.field}>
                  <label className={styles.safetyStopRow} style={{ cursor: "pointer" }}>
                    <input type="checkbox" checked={safetyStopEnabled} onChange={(e) => setSafetyStopEnabled(e.target.checked)} />
                    <span className={styles.label}>Safety stop</span>
                    {safetyStopEnabled && (
                      <>
                        <input
                          type="number"
                          id="safetyStopDepth"
                          name="safetyStopDepth"
                          value={safetyStopDepth}
                          onChange={(e) => setSafetyStopDepth(e.target.value)}
                          placeholder={prefs.depth === "m" ? "5" : "15"}
                          className={styles.input}
                          style={{ width: "4rem", padding: "var(--space-1) var(--space-2)" }}
                        />
                        <span className={styles.label} style={{ margin: 0 }}>{getUnitLabel("depth", prefs)}</span>
                        <input
                          type="number"
                          id="safetyStopDuration"
                          name="safetyStopDuration"
                          min={1}
                          value={safetyStopDuration}
                          onChange={(e) => setSafetyStopDuration(e.target.value)}
                          placeholder="3"
                          className={styles.input}
                          style={{ width: "3.5rem", padding: "var(--space-1) var(--space-2)" }}
                        />
                        <span className={styles.label} style={{ margin: 0 }}>min</span>
                      </>
                    )}
                  </label>
                  <input type="hidden" name="safetyStopEnabled" value={safetyStopEnabled ? "1" : "0"} />
                </div>
              </Field>
              <Field col={6}>
                <div className={styles.field}>
                  <label htmlFor="surfaceIntervalMin" className={styles.label}>Surface interval (min)</label>
                  <input type="number" id="surfaceIntervalMin" name="surfaceIntervalMin" min={0} value={surfaceIntervalMin} onChange={(e) => setSurfaceIntervalMin(e.target.value)} placeholder="Optional" className={styles.input} />
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* Notes - always visible */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionHeader}>Notes</h3>
          <div className={styles.sectionBody}>
            <div className={styles.field}>
              <label htmlFor="notes" className={styles.label}>Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Conditions, wildlife, gear notes…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.textarea}
              />
            </div>
        </div>
      </div>
          </div>
        </div>

        {/* Right column: Accordion stack */}
        <div className={styles.rightCol}>
          <div className={styles.rightColumn}>
        <AccordionSection id="conditions" title="Conditions" defaultOpen={false} summary={conditionsSum}>
          <div className={styles.formGrid12}>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="waterTempSurface" className={styles.label}>Water temp surface ({getUnitLabel("temperature", prefs)})</label>
                <input type="number" id="waterTempSurface" name="waterTempSurface" value={waterTempSurface} onChange={(e) => setWaterTempSurface(e.target.value)} className={styles.input} />
              </div>
            </Field>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="waterTempBottom" className={styles.label}>Water temp bottom ({getUnitLabel("temperature", prefs)})</label>
                <input type="number" id="waterTempBottom" name="waterTempBottom" value={waterTempBottom} onChange={(e) => setWaterTempBottom(e.target.value)} className={styles.input} />
              </div>
            </Field>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="visibility" className={styles.label}>Visibility ({getUnitLabel("distance", prefs)})</label>
                <input type="number" id="visibility" name="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)} className={styles.input} />
              </div>
            </Field>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="current" className={styles.label}>Current</label>
                <select id="current" name="current" className={styles.select} value={current} onChange={(e) => setCurrent(e.target.value)}>
                  {CURRENT_OPTIONS.map((o) => (
                    <option key={o.value || "none"} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </Field>
          </div>
        </AccordionSection>

        <AccordionSection id="gas" title="Gas" defaultOpen={false} summary={gasSum}>
          <div className={styles.formGrid12}>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="gasType" className={styles.label}>Gas type</label>
                <select id="gasType" name="gasType" className={styles.select} value={gasType} onChange={(e) => setGasType(e.target.value)}>
                  {GAS_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </Field>
            {gasType === "Nitrox" && (
              <Field col={6}>
                <div className={styles.field}>
                  <label htmlFor="fO2" className={styles.label}>FO2 (%) *</label>
                  <input type="number" id="fO2" name="fO2" min={21} max={100} value={fO2} onChange={(e) => setFO2(e.target.value)} required className={styles.input} />
                </div>
              </Field>
            )}
            <Field col={12}>
              <div className={styles.field}>
                <label htmlFor="tankCylinder" className={styles.label}>Tank / cylinder</label>
                <input type="text" id="tankCylinder" name="tankCylinder" placeholder="AL80, HP100…" value={tankCylinder} onChange={(e) => setTankCylinder(e.target.value)} className={styles.input} />
              </div>
            </Field>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="startPressure" className={styles.label}>Start pressure ({getUnitLabel("pressure", prefs)})</label>
                <input type="number" id="startPressure" name="startPressure" value={startPressure} onChange={(e) => setStartPressure(e.target.value)} className={styles.input} />
              </div>
            </Field>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="endPressure" className={styles.label}>End pressure ({getUnitLabel("pressure", prefs)})</label>
                <input type="number" id="endPressure" name="endPressure" value={endPressure} onChange={(e) => setEndPressure(e.target.value)} className={styles.input} />
              </div>
            </Field>
          </div>
        </AccordionSection>

        <AccordionSection id="exposure" title="Exposure & Weight" defaultOpen={false} summary={exposureSum}>
          <div className={styles.formGrid12}>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="exposureProtection" className={styles.label}>Exposure protection</label>
                <select id="exposureProtection" name="exposureProtection" className={styles.select} value={exposureProtection} onChange={(e) => setExposureProtection(e.target.value)}>
                  {EXPOSURE_PROTECTION_OPTIONS.map((o) => (
                    <option key={o.value || "none"} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </Field>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="weightUsed" className={styles.label}>Weight used ({getUnitLabel("weight", prefs)})</label>
                <input type="number" id="weightUsed" name="weightUsed" min={0} value={weightUsed} onChange={(e) => setWeightUsed(e.target.value)} className={styles.input} />
              </div>
            </Field>
          </div>
        </AccordionSection>

        <AccordionSection id="gear" title="Gear used" defaultOpen={false} summary={gearSum}>
          <div className={styles.formGrid12}>
            <Field col={12}>
              <div className={styles.field}>
                <label htmlFor="gearKitId" className={styles.label}>Gear kit</label>
                <select id="gearKitId" name="gearKitId" className={styles.select} value={gearKitId} onChange={(e) => handleGearKitSelect(e.target.value)}>
                  <option value="">None</option>
                  {gearKits.map((k) => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            </Field>
            <Field col={12}>
              <GearSelection selectedGearIds={selectedGearIds} onSelectionChange={onGearSelectionChange} editingEntryId={editingEntryId} />
            </Field>
            <Field col={12}>
              <div className={styles.field}>
                <label htmlFor="gearNotes" className={styles.label}>Gear notes</label>
                <input type="text" id="gearNotes" name="gearNotes" placeholder="Exceptions, replacements…" value={gearNotes} onChange={(e) => setGearNotes(e.target.value)} className={styles.input} />
              </div>
            </Field>
          </div>
        </AccordionSection>

        <AccordionSection id="training" title="Training" defaultOpen={false} summary={trainingSum}>
          <div className={styles.formGrid12}>
            <Field col={12}>
              <label className={styles.safetyStopRow} style={{ cursor: "pointer" }}>
                <input type="checkbox" name="isTrainingDive" checked={isTrainingDive} onChange={(e) => setIsTrainingDive(e.target.checked)} />
                <span className={styles.label}>Training dive?</span>
              </label>
            </Field>
            {isTrainingDive && (
              <>
                <Field col={6}>
                  <div className={styles.field}>
                    <label htmlFor="trainingCourse" className={styles.label}>Course</label>
                    <input type="text" id="trainingCourse" name="trainingCourse" placeholder="e.g. AOW, Rescue" value={trainingCourse} onChange={(e) => setTrainingCourse(e.target.value)} className={styles.input} />
                  </div>
                </Field>
                <Field col={6}>
                  <div className={styles.field}>
                    <label htmlFor="trainingInstructor" className={styles.label}>Instructor / DM</label>
                    <input type="text" id="trainingInstructor" name="trainingInstructor" value={trainingInstructor} onChange={(e) => setTrainingInstructor(e.target.value)} className={styles.input} />
                  </div>
                </Field>
                <Field col={12}>
                  <div className={styles.field}>
                    <label htmlFor="trainingSkills" className={styles.label}>Skills practiced</label>
                    <input type="text" id="trainingSkills" name="trainingSkills" placeholder="Comma-separated or list" value={trainingSkills} onChange={(e) => setTrainingSkills(e.target.value)} className={styles.input} />
                  </div>
                </Field>
              </>
            )}
          </div>
        </AccordionSection>
          </div>
        </div>
      </div>

      {/* Alerts - span full width */}
      {(softWarnings.length > 0 || error) && (
        <div className={styles.formAlerts}>
          {softWarnings.length > 0 && (
            <ul className={formStyles.error} style={{ color: "var(--color-warning, #f59e0b)", marginBottom: "var(--space-2)" }}>
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
