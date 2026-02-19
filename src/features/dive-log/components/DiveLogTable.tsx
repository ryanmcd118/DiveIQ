"use client";

import { DiveLogEntry } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import {
  displayDepth,
  displayTemperature,
  displayDistance,
} from "@/lib/units";
import buttonStyles from "@/styles/components/Button.module.css";
import layoutStyles from "./LogbookLayout.module.css";
import { highlightMatch } from "./SearchHighlight";
import styles from "./DiveLogTable.module.css";

type Props = {
  entries: DiveLogEntry[];
  searchQuery?: string;
  onSelect?: (entry: DiveLogEntry) => void;
  onDelete?: (id: string) => void;
  selectedId?: string | null;
};

export function DiveLogTable({
  entries,
  searchQuery = "",
  onSelect,
  onDelete,
  selectedId,
}: Props) {
  const { prefs } = useUnitPreferences();
  const showActions = Boolean(onDelete) || Boolean(selectedId);

  return (
    <div className={styles.tableScroll} role="region" aria-label="Dive log table">
      <table className={styles.table}>
        <colgroup>
          <col className={styles.colSite} />
          <col className={styles.colLocation} />
          <col className={styles.colBuddy} />
          <col className={styles.colDate} />
          <col className={styles.colDepth} />
          <col className={styles.colTime} />
          <col className={styles.colTemp} />
          <col className={styles.colVis} />
          <col className={styles.colNotes} />
          {showActions && <col className={styles.colActions} />}
        </colgroup>
        <thead>
          <tr>
            <th className={styles.colSite}>Site</th>
            <th className={styles.colLocation}>Location</th>
            <th className={styles.colBuddy}>Buddy</th>
            <th className={styles.colDate}>Date</th>
            <th className={styles.colDepth}>Depth</th>
            <th className={styles.colTime}>Time</th>
            <th className={styles.colTemp}>Temp</th>
            <th className={styles.colVis}>Visibility</th>
            <th className={styles.colNotes}>Notes</th>
            {showActions && (
              <th className={styles.colActions} aria-label="Actions" />
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const depth = displayDepth(entry.maxDepthCm, prefs.depth);
            const visibility =
              entry.visibilityCm != null
                ? displayDistance(entry.visibilityCm, prefs.depth)
                : null;
            const waterTemp =
              entry.waterTempCx10 != null
                ? displayTemperature(entry.waterTempCx10, prefs.temperature)
                : null;
            const isSelected = selectedId === entry.id;

            return (
              <tr
                key={entry.id}
                className={`${styles.row} ${styles.rowInteractive} ${
                  isSelected ? layoutStyles.listItemSelected : ""
                }`}
                onClick={() => onSelect?.(entry)}
              >
                <td className={styles.colSite}>
                  <span className={styles.cellContent}>
                    {highlightMatch(entry.siteName, searchQuery)}
                  </span>
                </td>
                <td className={styles.colLocation}>
                  <span className={styles.cellContent}>
                    {highlightMatch(entry.region, searchQuery)}
                  </span>
                </td>
                <td className={styles.colBuddy}>
                  <span className={styles.cellContent}>
                    {entry.buddyName
                      ? highlightMatch(entry.buddyName, searchQuery)
                      : ""}
                  </span>
                </td>
                <td className={styles.colDate}>{entry.date}</td>
                <td className={styles.colDepth}>
                  {depth.value ? `${depth.value}${depth.unit}` : "—"}
                </td>
                <td className={styles.colTime}>{`${entry.bottomTime}m`}</td>
                <td className={styles.colTemp}>
                  {waterTemp
                    ? `${waterTemp.value}${waterTemp.unit}`
                    : "—"}
                </td>
                <td className={styles.colVis}>
                  {visibility
                    ? `${visibility.value}${visibility.unit}`
                    : "—"}
                </td>
                <td className={styles.colNotes}>
                  <span className={styles.notesCell}>
                    {entry.notes ?? ""}
                  </span>
                </td>
                {showActions && (
                  <td className={styles.colActions}>
                    {isSelected && (
                      <span className={styles.selectedBadge}>Selected</span>
                    )}
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
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
