"use client";

import { DiveLogEntry } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { displayDepth, displayTemperature, displayDistance } from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import listStyles from "@/styles/components/List.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

type Props = {
  entries: DiveLogEntry[];
  onSelect?: (entry: DiveLogEntry) => void;
  onDelete?: (id: string) => void;
};

function DiveLogList({ entries, onSelect, onDelete }: Props) {
  const { prefs } = useUnitPreferences();

  if (entries.length === 0) {
    return (
      <p className={listStyles.empty}>
        New entries will appear here with key details so you can quickly scan
        your recent dives.
      </p>
    );
  }

  return (
    <ul className={listStyles.list}>
      {entries.map((entry) => {
        const depth = displayDepth(entry.maxDepthCm, prefs.depth);
        const visibility = entry.visibilityCm != null 
          ? displayDistance(entry.visibilityCm, prefs.depth)
          : null;
        const waterTemp = entry.waterTempCx10 != null
          ? displayTemperature(entry.waterTempCx10, prefs.temperature)
          : null;

        return (
        <li
          key={entry.id}
          className={cardStyles.listItemInteractive}
          onClick={() => onSelect?.(entry)}
        >
          <div className={listStyles.diveHeader}>
            <div>
              <span className={listStyles.diveTitle}>
                {entry.siteName}{" "}
                <span className={listStyles.diveRegion}>({entry.region})</span>
              </span>
              <p className={listStyles.diveStats}>
                {depth.value}{depth.unit} · {entry.bottomTime} min
                {visibility && ` · ${visibility.value}${visibility.unit} vis`}
                {waterTemp && ` · ${waterTemp.value}${waterTemp.unit}`}
              </p>
            </div>

            <div className={listStyles.actions}>
              <span className={listStyles.diveDate}>{entry.date}</span>
              {onDelete && (
                <button
                  type="button"
                  aria-label="Delete dive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.id);
                  }}
                  className={buttonStyles.iconDelete}
                  style={{
                    borderRadius: "var(--radius-full)",
                    borderColor: "var(--color-bg-elevated)",
                    padding: "var(--space-1)",
                    fontSize: "var(--font-size-xs)",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {entry.buddyName && (
            <p className={listStyles.diveMeta}>Buddy: {entry.buddyName}</p>
          )}
          {entry.gearItems && entry.gearItems.length > 0 && (
            <p className={listStyles.diveMeta}>
              Gear: {entry.gearItems.map((g) => g.nickname || `${g.manufacturer} ${g.model}`).join(", ")}
            </p>
          )}
          {entry.notes && <p className={listStyles.diveNotes}>{entry.notes}</p>}
        </li>
        );
      })}
    </ul>
  );
}

export default DiveLogList;
