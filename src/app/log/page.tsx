"use client";

import { FormEvent, useEffect, useState } from "react";
import DiveLogList from "./components/DiveLogList";
import { DiveLogEntry, DiveLogInput } from "./types";

export default function LogPage() {
  const [entries, setEntries] = useState<DiveLogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiveLogEntry | null>(null);
  const [activeEntry, setActiveEntry] = useState<DiveLogEntry | null>(null);
  const [formKey, setFormKey] = useState<string>("new"); // force remount on edit/new
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const totalBottomTime = entries.reduce(
    (sum, entry) => sum + entry.bottomTime,
    0
  );

  // Load existing entries from API on mount
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const res = await fetch("/api/log");
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data: { entries: DiveLogEntry[] } = await res.json();
        setEntries(data.entries);
      } catch (err) {
        console.error(err);
        setError("Failed to load existing dives.");
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  const resetFormState = () => {
    setEditingEntryId(null);
    setActiveEntry(null);
    setError(null);
    setFormKey(`new-${Date.now()}`);
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: DiveLogInput = {
      date: formData.get("date") as string,
      region: (formData.get("region") as string) ?? "",
      siteName: (formData.get("siteName") as string) ?? "",
      maxDepth: Number(formData.get("maxDepth")),
      bottomTime: Number(formData.get("bottomTime")),
      waterTemp: formData.get("waterTemp")
        ? Number(formData.get("waterTemp"))
        : null,
      visibility: formData.get("visibility")
        ? Number(formData.get("visibility"))
        : null,
      buddyName: (formData.get("buddyName") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    const isEditing = Boolean(editingEntryId);

    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isEditing ? "update" : "create",
          id: isEditing ? editingEntryId : undefined,
          payload,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data: { entry: DiveLogEntry } = await res.json();

      setEntries((prev) =>
        isEditing
          ? prev.map((e) => (e.id === data.entry.id ? data.entry : e))
          : [data.entry, ...prev]
      );

      // Reset form + edit mode
      form.reset();
      setEditingEntryId(null);
      setEditingEntry(null);
      setActiveEntry(null);
      setFormKey(`log-${Date.now()}`);

      // Status message
      const msg = isEditing ? "Log entry updated ✅" : "Dive added to log ✅";
      showStatus(msg);
    } catch (err) {
      console.error(err);
      setError(
        isEditing
          ? "Failed to update entry. Please try again."
          : "Failed to save dive. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectEntry = (entry: DiveLogEntry) => {
    setEditingEntry(entry);
    setEditingEntryId(entry.id);
    setActiveEntry(entry);
    setError(null);
    setStatusMessage(null);
    setFormKey(`edit-${entry.id}-${Date.now()}`);
  };

  const handleCancelEdit = (form?: HTMLFormElement | null) => {
    if (form) form.reset();
    resetFormState();
  };

  const performDelete = async (id: string) => {
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      setEntries((prev) => prev.filter((e) => e.id !== id));
      resetFormState();
      showStatus("Dive deleted ✅");
    } catch (err) {
      console.error(err);
      setError("Failed to delete dive. Please try again.");
    }
  };

  const handleDeleteFromForm = async (form: HTMLFormElement) => {
    if (!editingEntryId) return;
    const ok = window.confirm(
      "Delete this dive from your log? This action cannot be undone."
    );
    if (!ok) return;

    await performDelete(editingEntryId);
    form.reset();
  };

  const handleDeleteFromList = async (id: string) => {
    const ok = window.confirm(
      "Delete this dive from your log? This action cannot be undone."
    );
    if (!ok) return;

    await performDelete(id);
  };

  return (
    <main className="flex min-h-screen justify-center bg-slate-950 p-6 text-slate-100 md:p-10">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2">
        {/* Left: log form */}
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Dive Log</h1>
          <p className="text-sm text-slate-400">
            Capture the essentials from each dive: conditions, depth, time, and
            notes. This will eventually feed stats and visualizations in your
            DiveIQ logbook.
          </p>

          <form
            key={formKey}
            onSubmit={handleSubmit}
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
                    activeEntry?.maxDepth != null
                      ? String(activeEntry.maxDepth)
                      : ""
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
                      handleCancelEdit(
                        evt.currentTarget.form as HTMLFormElement | null
                      )
                    }
                    className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-100 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={(evt) =>
                      handleDeleteFromForm(
                        evt.currentTarget.form as HTMLFormElement
                      )
                    }
                    className="inline-flex items-center justify-center rounded-md border border-red-600/70 bg-red-600/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-600/20 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
                  >
                    Delete dive
                  </button>
                </>
              )}
            </div>
          </form>
        </section>

        {/* Right: log list / stats */}
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">Log overview</h2>
            {loading ? (
              <p className="text-sm text-slate-400">Loading dives…</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-slate-400">
                No dives logged yet. Add your first dive on the left.
              </p>
            ) : (
              <div className="space-y-1 text-sm text-slate-300">
                <p>
                  <span className="font-semibold">{entries.length}</span> dive
                  {entries.length === 1 ? "" : "s"} logged.
                </p>
                <p>
                  <span className="font-semibold">{totalBottomTime}</span>{" "}
                  minutes total bottom time.
                </p>
              </div>
            )}
          </div>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Recent dives</h2>
            {loading ? (
              <p className="text-sm text-slate-400">Loading dives…</p>
            ) : (
              <DiveLogList
                entries={entries}
                onSelect={handleSelectEntry}
                onDelete={handleDeleteFromList}
              />
            )}
          </div>
        </section>
      </div>

      {statusMessage && (
        <div className="fixed bottom-4 left-4 rounded-lg border border-emerald-500/60 bg-emerald-900/80 px-3 py-2 text-sm text-emerald-100 shadow-lg backdrop-blur">
          {statusMessage}
        </div>
      )}
    </main>
  );
}
