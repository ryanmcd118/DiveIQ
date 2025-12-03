'use client';

import { FormEvent, useState } from 'react';
import DiveLogList from './components/DiveLogList';
import { DiveLogEntry, DiveLogInput } from './types';

export default function LogPage() {
  const [entries, setEntries] = useState<DiveLogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBottomTime = entries.reduce(
    (sum, entry) => sum + entry.bottomTime,
    0
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // cache the form element before any await
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: DiveLogInput = {
      date: formData.get('date') as string,
      region: (formData.get('region') as string) ?? '',
      siteName: (formData.get('siteName') as string) ?? '',
      maxDepth: Number(formData.get('maxDepth')),
      bottomTime: Number(formData.get('bottomTime')),
      waterTemp: formData.get('waterTemp')
        ? Number(formData.get('waterTemp'))
        : null,
      visibility: formData.get('visibility')
        ? Number(formData.get('visibility'))
        : null,
      buddyName: (formData.get('buddyName') as string) || null,
      notes: (formData.get('notes') as string) || null,
    };

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data: { entry: DiveLogEntry } = await res.json();

      setEntries((prev) => [data.entry, ...prev]);
      form.reset();
    } catch (err) {
      console.error(err);
      setError('Failed to save dive. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-6 md:p-10">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-2">
        {/* Left: log form */}
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Dive Log</h1>
          <p className="text-sm text-slate-400">
            Capture the essentials from each dive: conditions, depth, time, and
            notes. This will eventually feed stats and visualizations in your
            DiveIQ logbook.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-4 space-y-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800 shadow-lg"
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
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
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
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
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
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
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
                  className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="bottomTime"
                  className="text-sm text-slate-300"
                >
                  Bottom time (min)
                </label>
                <input
                  type="number"
                  id="bottomTime"
                  name="bottomTime"
                  required
                  className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
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
                  className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="visibility"
                  className="text-sm text-slate-300"
                >
                  Visibility (m)
                </label>
                <input
                  type="number"
                  id="visibility"
                  name="visibility"
                  className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
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
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
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
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-2 inline-flex items-center justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add dive to log'}
            </button>
          </form>
        </section>

        {/* Right: log list / stats */}
        <section className="space-y-4">
          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Log overview</h2>
            {entries.length === 0 ? (
              <p className="text-sm text-slate-400">
                No dives logged yet. Add your first dive on the left.
              </p>
            ) : (
              <div className="space-y-1 text-sm text-slate-300">
                <p>
                  <span className="font-semibold">{entries.length}</span> dive
                  {entries.length === 1 ? '' : 's'} logged.
                </p>
                <p>
                  <span className="font-semibold">{totalBottomTime}</span>{' '}
                  minutes total bottom time.
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 shadow-lg space-y-4 max-h-[60vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">Recent dives</h2>
            <DiveLogList entries={entries} />
          </div>
        </section>
      </div>
    </main>
  );
}
