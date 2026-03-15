"use client";

import { FormEvent } from "react";
import type { DiveLogEntry } from "@/features/dive-log/types";
import type { SoftWarning } from "@/features/dive-log/types/softWarnings";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { useDiveFormState } from "../hooks/useDiveFormState";
import { BasicDiveSection } from "./BasicDiveSection";
import { AdvancedDiveSection } from "./AdvancedDiveSection";
import { AccordionSection } from "./AccordionSection";
import formStyles from "@/styles/components/Form.module.css";
import styles from "./LogbookForm.module.css";

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

  const state = useDiveFormState({
    activeEntry,
    formKey,
    entries,
    suggestedDiveNumber,
    onGearSelectionChange,
    prefs,
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (state.todayStr && state.date && state.date > state.todayStr) {
      e.preventDefault();
      state.setDateError("Future dates invalid.");
      return;
    }
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
            <BasicDiveSection
              state={state}
              prefs={prefs}
              suggestedDiveNumber={suggestedDiveNumber}
            />
          </div>
        </div>

        {/* Advanced accordion */}
        <div className={styles.advancedSectionWrap}>
          <AccordionSection
            id="advanced"
            title="Advanced"
            defaultOpen={false}
            summary="Gear, exposure, training"
          >
            <AdvancedDiveSection
              state={state}
              selectedGearIds={selectedGearIds}
              onGearSelectionChange={onGearSelectionChange}
              editingEntryId={editingEntryId}
            />
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
