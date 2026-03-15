"use client";

import type { UnitPreferences } from "@/lib/units";
import { getUnitLabel } from "@/lib/units";
import {
  CURRENT_OPTIONS,
  GAS_TYPE_OPTIONS,
  EXPOSURE_PROTECTION_OPTIONS,
} from "../constants";
import {
  MOST_COMMON_DIVE_TYPES,
  EXPANDED_DIVE_TYPES,
  normalizeTime,
  to24HourTime,
} from "../utils/timeUtils";
import type { DiveFormState } from "../hooks/useDiveFormState";
import styles from "./BasicDiveSection.module.css";

interface Props {
  state: DiveFormState;
  prefs: UnitPreferences;
  suggestedDiveNumber: number;
}

export function BasicDiveSection({ state, prefs, suggestedDiveNumber }: Props) {
  return (
    <>
      {/* SECTION 1: Dive basics */}
      <section className={styles.coreSubsection}>
        <h3 className={styles.coreSubsectionHeader}>Dive basics</h3>
        {/* Row 1: Dive # | Date* | Start time + AM/PM | End time + AM/PM | Bottom time (min) */}
        <div className={styles.timelineRow}>
          <div className={`${styles.field} ${styles.inputSmall}`}>
            <div className={styles.diveNumberHeader}>
              <label htmlFor="diveNumber" className={styles.label}>
                Dive #
              </label>
              {state.isDiveNumberOverridden && (
                <span className={styles.diveNumberMeta}>
                  <span className={styles.diveNumberTag}>Manual</span>
                  <button
                    type="button"
                    className={styles.diveNumberReset}
                    onClick={() => {
                      const next =
                        state.diveNumberAuto != null
                          ? String(state.diveNumberAuto)
                          : "";
                      state.setDiveNumber(next);
                      state.setIsDiveNumberOverridden(false);
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
              value={state.diveNumber}
              onChange={(e) => {
                const v = e.target.value;
                state.setDiveNumber(v);
                if (state.diveNumberAuto != null && v)
                  state.setIsDiveNumberOverridden(
                    v !== String(state.diveNumberAuto)
                  );
                else state.setIsDiveNumberOverridden(Boolean(v));
              }}
              className={styles.input}
            />
            <input
              type="hidden"
              name="diveNumberOverride"
              value={
                state.isDiveNumberOverridden && state.diveNumber
                  ? state.diveNumber
                  : ""
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
              max={state.todayStr ?? undefined}
              value={state.date}
              onChange={(e) => {
                state.setDate(e.target.value);
                state.validateDate(e.target.value);
              }}
              onBlur={(e) => state.validateDate(e.target.value)}
              className={styles.input}
            />
            {state.dateError && (
              <span className={styles.timeFieldError} role="alert">
                {state.dateError}
              </span>
            )}
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
                value={state.startTimeDisplay}
                onChange={(e) => {
                  state.setStartTimeDisplay(e.target.value);
                  state.setLastEditedTime("start");
                  if (state.startTimeError) state.setStartTimeError(null);
                }}
                onBlur={(e) => {
                  const raw = e.target.value.trim();
                  const normalized = normalizeTime(raw);
                  if (normalized && normalized !== raw)
                    state.setStartTimeDisplay(normalized);
                  const valueToCheck = normalized || raw;
                  if (
                    valueToCheck &&
                    !to24HourTime(valueToCheck, state.startTimePeriod)
                  ) {
                    state.setStartTimeError(
                      "Enter a valid time (e.g. 9:00 or 9:30)"
                    );
                  } else if (
                    state.todayStr &&
                    state.date === state.todayStr &&
                    valueToCheck
                  ) {
                    const time24 = to24HourTime(
                      valueToCheck,
                      state.startTimePeriod
                    );
                    if (time24) {
                      const now = new Date();
                      const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                      if (time24 > nowTime)
                        state.setStartTimeError(
                          "Start time cannot be in the future."
                        );
                      else state.setStartTimeError(null);
                    } else {
                      state.setStartTimeError(null);
                    }
                  } else {
                    state.setStartTimeError(null);
                  }
                }}
                className={`${styles.input} ${styles.inputSmall}`}
              />
              <select
                aria-label="AM or PM for start time"
                className={`${styles.select} ${styles.inputTiny}`}
                value={state.startTimePeriod}
                onChange={(e) => {
                  state.setStartTimePeriod(
                    e.target.value === "PM" ? "PM" : "AM"
                  );
                  state.setLastEditedTime("start");
                }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            {state.startTimeError && (
              <span className={styles.timeFieldError} role="alert">
                {state.startTimeError}
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
                value={state.endTimeDisplay}
                onChange={(e) => {
                  state.setEndTimeDisplay(e.target.value);
                  state.setLastEditedTime("end");
                  if (state.endTimeError) state.setEndTimeError(null);
                }}
                onBlur={(e) => {
                  const raw = e.target.value.trim();
                  const normalized = normalizeTime(raw);
                  if (normalized && normalized !== raw)
                    state.setEndTimeDisplay(normalized);
                  const valueToCheck = normalized || raw;
                  if (
                    valueToCheck &&
                    !to24HourTime(valueToCheck, state.endTimePeriod)
                  ) {
                    state.setEndTimeError(
                      "Enter a valid time (e.g. 9:52 or 10:00)"
                    );
                  } else if (
                    state.todayStr &&
                    state.date === state.todayStr &&
                    valueToCheck
                  ) {
                    const time24 = to24HourTime(
                      valueToCheck,
                      state.endTimePeriod
                    );
                    if (time24) {
                      const now = new Date();
                      const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                      if (time24 > nowTime)
                        state.setEndTimeError(
                          "End time cannot be in the future."
                        );
                      else state.setEndTimeError(null);
                    } else {
                      state.setEndTimeError(null);
                    }
                  } else {
                    state.setEndTimeError(null);
                  }
                }}
                className={`${styles.input} ${styles.inputSmall}`}
              />
              <select
                aria-label="AM or PM for end time"
                className={`${styles.select} ${styles.inputTiny}`}
                value={state.endTimePeriod}
                onChange={(e) => {
                  state.setEndTimePeriod(e.target.value === "PM" ? "PM" : "AM");
                  state.setLastEditedTime("end");
                }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            {state.endTimeError && (
              <span className={styles.timeFieldError} role="alert">
                {state.endTimeError}
              </span>
            )}
          </div>
          <input
            type="hidden"
            name="startTime"
            value={to24HourTime(state.startTimeDisplay, state.startTimePeriod)}
          />
          <input
            type="hidden"
            name="endTime"
            value={to24HourTime(state.endTimeDisplay, state.endTimePeriod)}
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
                value={state.bottomTime}
                onChange={(e) => {
                  state.setBottomTime(e.target.value);
                  state.setLastEditedTime("bottom");
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
              value={state.siteName}
              onChange={(e) => state.setSiteName(e.target.value)}
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
              value={state.region}
              onChange={(e) => state.setRegion(e.target.value)}
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
              value={state.buddyName}
              onChange={(e) => state.setBuddyName(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: Dive metrics */}
      <section className={styles.coreSubsection}>
        <h3 className={styles.coreSubsectionHeader}>Dive metrics</h3>
        {/* Row 3: Environment — Max depth, Water temp surface, Water temp bottom, Visibility, Current */}
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
                value={state.maxDepth}
                onChange={(e) => state.setMaxDepth(e.target.value)}
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
                value={state.waterTempSurface}
                onChange={(e) => state.setWaterTempSurface(e.target.value)}
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
                value={state.waterTempBottom}
                onChange={(e) => state.setWaterTempBottom(e.target.value)}
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
                value={state.visibility}
                onChange={(e) => state.setVisibility(e.target.value)}
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
              value={state.current}
              onChange={(e) => state.setCurrent(e.target.value)}
            >
              {CURRENT_OPTIONS.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Row 4: Gas + Safety stop */}
        <div
          className={`${styles.gasRow} ${state.gasType === "Nitrox" ? styles.gasRowWithFO2 : ""}`}
        >
          <div className={`${styles.field} ${styles.inputMedium}`}>
            <label htmlFor="gasType" className={styles.label}>
              Gas type
            </label>
            <select
              id="gasType"
              name="gasType"
              className={styles.select}
              value={state.gasType}
              onChange={(e) => state.setGasType(e.target.value)}
            >
              {GAS_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {state.gasType === "Nitrox" && (
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
                value={state.fO2}
                onChange={(e) => state.setFO2(e.target.value)}
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
              value={state.tankCylinder}
              onChange={(e) => state.setTankCylinder(e.target.value)}
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
                value={state.startPressure}
                onChange={(e) => state.setStartPressure(e.target.value)}
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
                value={state.endPressure}
                onChange={(e) => state.setEndPressure(e.target.value)}
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
                aria-label={`Gas used: ${state.gasUsedDisplay != null ? `${state.gasUsedDisplay} ${getUnitLabel("pressure", prefs)}` : "—"}`}
              >
                {state.gasUsedDisplay != null ? state.gasUsedDisplay : "—"}
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
              value={state.weightUsed}
              onChange={(e) => state.setWeightUsed(e.target.value)}
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
              value={state.exposureProtection}
              onChange={(e) => state.setExposureProtection(e.target.value)}
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
                value={state.surfaceIntervalMin}
                onChange={(e) => state.setSurfaceIntervalMin(e.target.value)}
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
                  checked={state.safetyStopEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (!checked) {
                      state.setSafetyStopEnabled(false);
                      state.setSafetyStopDepth("");
                      state.setSafetyStopDuration("");
                    } else state.setSafetyStopEnabled(true);
                  }}
                />
                <span className={styles.label}>Safety stop</span>
              </label>
              <div className={styles.safetyStopInputs}>
                <input
                  type="number"
                  id="safetyStopDepth"
                  name="safetyStopDepth"
                  value={state.safetyStopDepth}
                  onChange={(e) => {
                    const v = e.target.value;
                    state.setSafetyStopDepth(v);
                    if (v.trim() !== "" && !state.safetyStopEnabled)
                      state.setSafetyStopEnabled(true);
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
                  value={state.safetyStopDuration}
                  onChange={(e) => {
                    const v = e.target.value;
                    state.setSafetyStopDuration(v);
                    if (v.trim() !== "" && !state.safetyStopEnabled)
                      state.setSafetyStopEnabled(true);
                  }}
                  className={styles.input}
                />
                <span className={styles.unitSuffix}>min</span>
              </div>
            </div>
            <input
              type="hidden"
              name="safetyStopEnabled"
              value={state.safetyStopEnabled ? "1" : "0"}
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
                  className={`${styles.diveTypeChip} ${state.selectedDiveTypes.includes(tag) ? styles.diveTypeChipSelected : ""}`}
                >
                  <input
                    type="checkbox"
                    name="diveTypeTags"
                    value={tag}
                    checked={state.selectedDiveTypes.includes(tag)}
                    onChange={(e) =>
                      state.setSelectedDiveTypes((prev) =>
                        e.target.checked
                          ? [...prev, tag]
                          : prev.filter((t) => t !== tag)
                      )
                    }
                  />
                  <span>{tag}</span>
                </label>
              ))}
              {!state.showAllDiveTypes && (
                <>
                  <button
                    type="button"
                    className={styles.diveTypeShowMore}
                    onClick={() => state.setShowAllDiveTypes(true)}
                  >
                    Show more
                  </button>
                  {state.selectedDiveTypes.filter((t) =>
                    EXPANDED_DIVE_TYPES.includes(t)
                  ).length > 0 && (
                    <span className={styles.diveTypeMoreSelected}>
                      +
                      {
                        state.selectedDiveTypes.filter((t) =>
                          EXPANDED_DIVE_TYPES.includes(t)
                        ).length
                      }{" "}
                      more selected
                    </span>
                  )}
                </>
              )}
              {state.showAllDiveTypes &&
                EXPANDED_DIVE_TYPES.map((tag) => (
                  <label
                    key={tag}
                    className={`${styles.diveTypeChip} ${
                      state.selectedDiveTypes.includes(tag)
                        ? styles.diveTypeChipSelected
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="diveTypeTags"
                      value={tag}
                      checked={state.selectedDiveTypes.includes(tag)}
                      onChange={(e) =>
                        state.setSelectedDiveTypes((prev) =>
                          e.target.checked
                            ? [...prev, tag]
                            : prev.filter((t) => t !== tag)
                        )
                      }
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              {state.showAllDiveTypes && (
                <button
                  type="button"
                  className={styles.diveTypeShowMore}
                  onClick={() => state.setShowAllDiveTypes(false)}
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
              value={state.notes}
              onChange={(e) => state.setNotes(e.target.value)}
              className={styles.textarea}
            />
          </div>
        </div>
      </section>
    </>
  );
}
