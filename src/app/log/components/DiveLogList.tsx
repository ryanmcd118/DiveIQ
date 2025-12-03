"use client";

import { DiveLogEntry } from "../types";

type Props = {
  entries: DiveLogEntry[];
};

function DiveLogList({ entries }: Props) {
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
          className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
        >
          <div className="mb-1 flex justify-between gap-2">
            <span className="font-semibold">
              {entry.siteName}{" "}
              <span className="text-slate-400">({entry.region})</span>
            </span>
            <span className="text-xs text-slate-400">{entry.date}</span>
          </div>
          <p className="text-slate-300">
            {entry.maxDepth}m · {entry.bottomTime} min
            {entry.visibility != null && ` · ${entry.visibility}m vis`}
            {entry.waterTemp != null && ` · ${entry.waterTemp}°C`}
          </p>
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
