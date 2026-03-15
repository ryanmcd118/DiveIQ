"use client";

import { GearSelection } from "./GearSelection";
import type { DiveFormState } from "../hooks/useDiveFormState";
import styles from "./AdvancedDiveSection.module.css";

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

interface Props {
  state: DiveFormState;
  selectedGearIds: string[];
  onGearSelectionChange: (ids: string[]) => void;
  editingEntryId: string | null;
}

export function AdvancedDiveSection({
  state,
  selectedGearIds,
  onGearSelectionChange,
  editingEntryId,
}: Props) {
  return (
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
              value={state.gearKitId}
              onChange={(e) => state.handleGearKitSelect(e.target.value)}
            >
              <option value="">None</option>
              {state.gearKits.map((k) => (
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
              value={state.gearNotes}
              onChange={(e) => state.setGearNotes(e.target.value)}
              className={styles.textarea}
            />
          </div>
        </div>
      </div>

      <h4 className={styles.subsectionHeader}>Training</h4>
      <div className={styles.formGrid12}>
        <Field col={12}>
          <label className={styles.safetyStopRow} style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              name="isTrainingDive"
              checked={state.isTrainingDive}
              onChange={(e) => state.setIsTrainingDive(e.target.checked)}
            />
            <span className={styles.label}>Training dive?</span>
          </label>
        </Field>
        {state.isTrainingDive && (
          <>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="trainingCourse" className={styles.label}>
                  Course
                </label>
                <input
                  type="text"
                  id="trainingCourse"
                  name="trainingCourse"
                  placeholder="e.g. AOW, Rescue"
                  value={state.trainingCourse}
                  onChange={(e) => state.setTrainingCourse(e.target.value)}
                  className={styles.input}
                />
              </div>
            </Field>
            <Field col={6}>
              <div className={styles.field}>
                <label htmlFor="trainingInstructor" className={styles.label}>
                  Instructor / DM
                </label>
                <input
                  type="text"
                  id="trainingInstructor"
                  name="trainingInstructor"
                  value={state.trainingInstructor}
                  onChange={(e) => state.setTrainingInstructor(e.target.value)}
                  className={styles.input}
                />
              </div>
            </Field>
            <Field col={12}>
              <div className={styles.field}>
                <label htmlFor="trainingSkills" className={styles.label}>
                  Skills practiced
                </label>
                <input
                  type="text"
                  id="trainingSkills"
                  name="trainingSkills"
                  placeholder="Comma-separated or list"
                  value={state.trainingSkills}
                  onChange={(e) => state.setTrainingSkills(e.target.value)}
                  className={styles.input}
                />
              </div>
            </Field>
          </>
        )}
      </div>
    </div>
  );
}
