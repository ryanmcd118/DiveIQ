"use client";

import { DiveLogEntry } from "../types";

type Props = {
  entries: DiveLogEntry[];
  onSelect?: (entry: DiveLogEntry) => void;
  onDelete?: (id: string) => void;
};

function DiveLogList({ entries, onSelect, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        New entries will appear here with key details so you can quickly scan
        your recent dives.
      </p>
    );
  }

  return (
    <ul className="space-y-4 text-sm">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950/40 p-3 transition-colors hover:border-cyan-400 hover:bg-slate-900/80"
          onClick={() => onSelect?.(entry)}
        >
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <span className="font-semibold">
                {entry.siteName}{" "}
                <span className="text-slate-400">({entry.region})</span>
              </span>
              <p className="text-slate-300">
                {entry.maxDepth}m · {entry.bottomTime} min
                {entry.visibility != null && ` · ${entry.visibility}m vis`}
                {entry.waterTemp != null && ` · ${entry.waterTemp}°C`}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-xs whitespace-nowrap text-slate-400">
                {entry.date}
              </span>
              {onDelete && (
                <button
                  type="button"
                  aria-label="Delete dive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.id);
                  }}
                  className="rounded-full border border-slate-700 px-2 text-xs text-slate-400 hover:border-red-500 hover:bg-red-500/10 hover:text-red-300"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {entry.buddyName && (
            <p className="mt-1 text-xs text-slate-400">
              Buddy: {entry.buddyName}
            </p>
          )}
          {entry.notes && (
            <p className="mt-2 text-xs whitespace-pre-line text-slate-300">
              {entry.notes}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default DiveLogList;
