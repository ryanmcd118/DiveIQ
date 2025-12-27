"use client";

import { FormEvent, useState, useEffect } from "react";
import { DiveLogEntry } from "@/features/dive-log/types";
import { useUnitSystem } from "@/contexts/UnitSystemContext";
import { metricToUI, getUnitLabel } from "@/lib/units";
import { UnitToggle } from "@/components/UnitToggle";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

interface DiveLogFormProps {
  formKey: string;
  activeEntry: DiveLogEntry | null;
  editingEntryId: string | null;
  saving: boolean;
  error: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: (form?: HTMLFormElement | null) => void;
  onDeleteFromForm: (form: HTMLFormElement) => void;
}

export function DiveLogForm({
  formKey,
  activeEntry,
  editingEntryId,
  saving,
  error,
  onSubmit,
  onCancelEdit,
  onDeleteFromForm,
}: DiveLogFormProps) {
  const { unitSystem } = useUnitSystem();
  
  // Helper to convert metric to UI units for display
  const metricToUIString = (metricValue: number | null | undefined, type: 'depth' | 'temperature' | 'distance') => {
    if (metricValue == null) return "";
    const ui = metricToUI(metricValue, unitSystem, type);
    return ui != null ? String(Math.round(ui)) : "";
  };
  
  // Controlled state for unit-bearing fields (in UI units)
  // Initialize from activeEntry if it exists
  const [maxDepth, setMaxDepth] = useState<string>(() => {
    if (!activeEntry?.maxDepth) return "";
    const ui = metricToUI(activeEntry.maxDepth, unitSystem, 'depth');
    return ui != null ? String(Math.round(ui)) : "";
  });
  const [waterTemp, setWaterTemp] = useState<string>(() => {
    if (!activeEntry?.waterTemp) return "";
    const ui = metricToUI(activeEntry.waterTemp, unitSystem, 'temperature');
    return ui != null ? String(Math.round(ui)) : "";
  });
  const [visibility, setVisibility] = useState<string>(() => {
    if (!activeEntry?.visibility) return "";
    const ui = metricToUI(activeEntry.visibility, unitSystem, 'distance');
    return ui != null ? String(Math.round(ui)) : "";
  });
  const [prevUnitSystem, setPrevUnitSystem] = useState<typeof unitSystem>(unitSystem);
  const [prevActiveEntry, setPrevActiveEntry] = useState<DiveLogEntry | null>(activeEntry);

  // Convert metric values to UI units when entry loads or changes
  useEffect(() => {
    if (activeEntry !== prevActiveEntry) {
      setPrevActiveEntry(activeEntry);
      if (activeEntry) {
        setMaxDepth(metricToUIString(activeEntry.maxDepth, 'depth'));
        setWaterTemp(metricToUIString(activeEntry.waterTemp, 'temperature'));
        setVisibility(metricToUIString(activeEntry.visibility, 'distance'));
      } else {
        // Reset form
        setMaxDepth("");
        setWaterTemp("");
        setVisibility("");
      }
    }
  }, [activeEntry, prevActiveEntry, unitSystem]);

  // Handle unit system change - convert current values
  useEffect(() => {
    if (prevUnitSystem !== unitSystem) {
      // Convert current UI values to the other unit system
      if (maxDepth) {
        const numValue = parseFloat(maxDepth);
        if (!isNaN(numValue)) {
          // Convert: current UI unit -> metric -> new UI unit
          const metric = prevUnitSystem === 'metric' ? numValue : numValue / 3.28084;
          const newUI = unitSystem === 'metric' ? metric : metric * 3.28084;
          setMaxDepth(String(Math.round(newUI)));
        }
      }
      if (waterTemp) {
        const numValue = parseFloat(waterTemp);
        if (!isNaN(numValue)) {
          const metric = prevUnitSystem === 'metric' ? numValue : ((numValue - 32) * 5) / 9;
          const newUI = unitSystem === 'metric' ? metric : (metric * 9) / 5 + 32;
          setWaterTemp(String(Math.round(newUI)));
        }
      }
      if (visibility) {
        const numValue = parseFloat(visibility);
        if (!isNaN(numValue)) {
          const metric = prevUnitSystem === 'metric' ? numValue : numValue / 3.28084;
          const newUI = unitSystem === 'metric' ? metric : metric * 3.28084;
          setVisibility(String(Math.round(newUI)));
        }
      }
      setPrevUnitSystem(unitSystem);
    }
  }, [unitSystem, prevUnitSystem, maxDepth, waterTemp, visibility]);

  // Custom submit handler that sets hidden inputs with UI values
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // The actual conversion to metric will happen in useLogPageState
    onSubmit(e);
  };

  return (
    <form
      key={formKey}
      onSubmit={handleSubmit}
      className={cardStyles.cardForm}
      style={{ marginTop: "var(--space-4)", padding: "var(--space-6)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <div></div>
        <UnitToggle showLabel={true} />
      </div>
      <div className={formStyles.field}>
        <label htmlFor="date" className={formStyles.label}>
          Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          required
          defaultValue={activeEntry?.date ?? ""}
          className={formStyles.input}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="region" className={formStyles.label}>
          Region
        </label>
        <input
          type="text"
          id="region"
          name="region"
          placeholder="Roatán, Red Sea, local quarry..."
          required
          defaultValue={activeEntry?.region ?? ""}
          className={formStyles.input}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="siteName" className={formStyles.label}>
          Site name
        </label>
        <input
          type="text"
          id="siteName"
          name="siteName"
          placeholder="Mary's Place"
          required
          defaultValue={activeEntry?.siteName ?? ""}
          className={formStyles.input}
        />
      </div>

      <div className={formStyles.formGrid2}>
        <div className={formStyles.field}>
          <label htmlFor="maxDepth" className={formStyles.label}>
            Max depth ({getUnitLabel('depth', unitSystem)})
          </label>
          <input
            type="number"
            id="maxDepth"
            name="maxDepth"
            required
            value={maxDepth}
            onChange={(e) => setMaxDepth(e.target.value)}
            className={formStyles.input}
          />
        </div>
        <div className={formStyles.field}>
          <label htmlFor="bottomTime" className={formStyles.label}>
            Bottom time (min)
          </label>
          <input
            type="number"
            id="bottomTime"
            name="bottomTime"
            required
            defaultValue={
              activeEntry?.bottomTime != null
                ? String(activeEntry.bottomTime)
                : ""
            }
            className={formStyles.input}
          />
        </div>
      </div>

      <div className={formStyles.formGrid2}>
        <div className={formStyles.field}>
          <label htmlFor="waterTemp" className={formStyles.label}>
            Water temp ({getUnitLabel('temperature', unitSystem)})
          </label>
          <input
            type="number"
            id="waterTemp"
            name="waterTemp"
            value={waterTemp}
            onChange={(e) => setWaterTemp(e.target.value)}
            className={formStyles.input}
          />
        </div>
        <div className={formStyles.field}>
          <label htmlFor="visibility" className={formStyles.label}>
            Visibility ({getUnitLabel('distance', unitSystem)})
          </label>
          <input
            type="number"
            id="visibility"
            name="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className={formStyles.input}
          />
        </div>
      </div>

      <div className={formStyles.field}>
        <label htmlFor="buddyName" className={formStyles.label}>
          Buddy
        </label>
        <input
          type="text"
          id="buddyName"
          name="buddyName"
          placeholder="Optional"
          defaultValue={activeEntry?.buddyName ?? ""}
          className={formStyles.input}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="notes" className={formStyles.label}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Conditions, wildlife, gear notes…"
          defaultValue={activeEntry?.notes ?? ""}
          className={formStyles.textarea}
        />
      </div>

      {error && <p className={formStyles.error}>{error}</p>}

      <div className={formStyles.buttonGroup}>
        <button
          type="submit"
          disabled={saving}
          className={buttonStyles.primary}
        >
          {saving
            ? "Saving…"
            : editingEntryId
              ? "Update dive"
              : "Add dive to log"}
        </button>

        {editingEntryId && (
          <>
            <button
              type="button"
              onClick={(evt) =>
                onCancelEdit(
                  (evt.currentTarget.form as HTMLFormElement | null) ??
                    undefined
                )
              }
              className={buttonStyles.secondary}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={(evt) =>
                onDeleteFromForm(evt.currentTarget.form as HTMLFormElement)
              }
              className={buttonStyles.danger}
            >
              Delete dive
            </button>
          </>
        )}
      </div>
    </form>
  );
}
