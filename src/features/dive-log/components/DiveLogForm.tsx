"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { DiveLogEntry } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import {
  displayDepth,
  displayTemperature,
  displayDistance,
  getUnitLabel,
} from "@/lib/units";
import { GearSelection } from "./GearSelection";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

interface DiveLogFormProps {
  formKey: string;
  activeEntry: DiveLogEntry | null;
  editingEntryId: string | null;
  saving: boolean;
  error: string | null;
  selectedGearIds?: string[];
  onGearSelectionChange: (ids: string[]) => void;
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
  selectedGearIds = [],
  onGearSelectionChange,
  onSubmit,
  onCancelEdit,
  onDeleteFromForm,
}: DiveLogFormProps) {
  const { prefs } = useUnitPreferences();

  // Ensure onGearSelectionChange is always a function (defensive check)
  const handleGearSelectionChange =
    typeof onGearSelectionChange === "function"
      ? onGearSelectionChange
      : () => {
          console.error("DiveLogForm: onGearSelectionChange is not a function");
        };

  // Controlled state for unit-bearing fields (in UI units)
  // Initialize from activeEntry if it exists (convert from canonical)
  const [maxDepth, setMaxDepth] = useState<string>(() => {
    if (!activeEntry?.maxDepthCm) return "";
    const display = displayDepth(activeEntry.maxDepthCm, prefs.depth);
    return display.value;
  });
  const [waterTemp, setWaterTemp] = useState<string>(() => {
    if (!activeEntry?.waterTempCx10) return "";
    const display = displayTemperature(
      activeEntry.waterTempCx10,
      prefs.temperature
    );
    return display.value;
  });
  const [visibility, setVisibility] = useState<string>(() => {
    if (!activeEntry?.visibilityCm) return "";
    const display = displayDistance(activeEntry.visibilityCm, prefs.depth);
    return display.value;
  });
  const prevActiveEntryRef = useRef<typeof activeEntry>(activeEntry);

  // Track activeEntry changes using ref (no setState in effect)
  useEffect(() => {
    if (activeEntry !== prevActiveEntryRef.current) {
      prevActiveEntryRef.current = activeEntry;
    }
  }, [activeEntry]);

  // Custom submit handler that sets hidden inputs with UI values
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // The actual conversion to metric will happen in useLogPageState
    onSubmit(e);
  };

  return (
    <div
      className={cardStyles.elevatedForm}
      style={{ marginTop: "var(--space-4)" }}
    >
      <form
        key={`${formKey}-${prefs.depth}-${prefs.temperature}`}
        onSubmit={handleSubmit}
        className={formStyles.form}
      >
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
              Max depth ({getUnitLabel("depth", prefs)})
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
              Water temp ({getUnitLabel("temperature", prefs)})
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
              Visibility ({getUnitLabel("distance", prefs)})
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

        <GearSelection
          selectedGearIds={selectedGearIds ?? []}
          onSelectionChange={handleGearSelectionChange}
          editingEntryId={editingEntryId}
        />

        {error && <p className={formStyles.error}>{error}</p>}

        <div className={formStyles.buttonGroup}>
          <button
            type="submit"
            disabled={saving}
            className={buttonStyles.primaryGradient}
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
    </div>
  );
}
