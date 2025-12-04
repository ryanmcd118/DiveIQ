"use client";

import { FormEvent } from "react";
import { DiveLogEntry } from "@/features/log/types";
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
  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
      className={cardStyles.cardForm}
      style={{ marginTop: "var(--space-4)", padding: "var(--space-6)" }}
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
            Max depth (m)
          </label>
          <input
            type="number"
            id="maxDepth"
            name="maxDepth"
            required
            defaultValue={
              activeEntry?.maxDepth != null ? String(activeEntry.maxDepth) : ""
            }
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
            Water temp (°C)
          </label>
          <input
            type="number"
            id="waterTemp"
            name="waterTemp"
            defaultValue={
              activeEntry?.waterTemp != null
                ? String(activeEntry.waterTemp)
                : ""
            }
            className={formStyles.input}
          />
        </div>
        <div className={formStyles.field}>
          <label htmlFor="visibility" className={formStyles.label}>
            Visibility (m)
          </label>
          <input
            type="number"
            id="visibility"
            name="visibility"
            defaultValue={
              activeEntry?.visibility != null
                ? String(activeEntry.visibility)
                : ""
            }
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
