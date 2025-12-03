"use client";

import { FormEvent } from "react";
import { DiveLogEntry } from "@/app/log/types";

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
      className="mt-4 space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="date" className="text-sm text-slate-300">
          Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          required
          defaultValue={activeEntry?.date ?? ""}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="region" className="text-sm text-slate-300">
          Region
        </label>
        <input
          type="text"
          id="region"
          name="region"
          placeholder="Roatán, Red Sea, local quarry..."
          required
          defaultValue={activeEntry?.region ?? ""}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="siteName" className="text-sm text-slate-300">
          Site name
        </label>
        <input
          type="text"
          id="siteName"
          name="siteName"
          placeholder="Mary's Place"
          required
          defaultValue={activeEntry?.siteName ?? ""}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="maxDepth" className="text-sm text-slate-300">
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
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bottomTime" className="text-sm text-slate-300">
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
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="waterTemp" className="text-sm text-slate-300">
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
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="visibility" className="text-sm text-slate-300">
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
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="buddyName" className="text-sm text-slate-300">
          Buddy
        </label>
        <input
          type="text"
          id="buddyName"
          name="buddyName"
          placeholder="Optional"
          defaultValue={activeEntry?.buddyName ?? ""}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm text-slate-300">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Conditions, wildlife, gear notes…"
          defaultValue={activeEntry?.notes ?? ""}
          className="resize-none rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="mt-2 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none disabled:opacity-60"
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
              className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-100 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={(evt) =>
                onDeleteFromForm(evt.currentTarget.form as HTMLFormElement)
              }
              className="inline-flex items-center justify-center rounded-md border border-red-600/70 bg-red-600/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-600/20 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
            >
              Delete dive
            </button>
          </>
        )}
      </div>
    </form>
  );
}
