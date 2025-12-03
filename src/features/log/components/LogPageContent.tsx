"use client";

import { useLogPageState } from "../hooks/useLogPageState";
import { DiveLogForm } from "./DiveLogForm";
import DiveLogList from "./DiveLogList";

export function LogPageContent() {
  const {
    entries,
    saving,
    loading,
    error,
    editingEntryId,
    activeEntry,
    formKey,
    statusMessage,
    totalBottomTime,
    handleSubmit,
    handleSelectEntry,
    handleCancelEdit,
    handleDeleteFromForm,
    handleDeleteFromList,
  } = useLogPageState();

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

          <DiveLogForm
            formKey={formKey}
            activeEntry={activeEntry}
            editingEntryId={editingEntryId}
            saving={saving}
            error={error}
            onSubmit={handleSubmit}
            onCancelEdit={handleCancelEdit}
            onDeleteFromForm={handleDeleteFromForm}
          />
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
