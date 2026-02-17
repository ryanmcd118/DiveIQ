"use client";

import { DiveLogEntry } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { displayDepth, displayTemperature, displayDistance } from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import { highlightMatch } from "./SearchHighlight";
import styles from "./DiveLogGrid.module.css";

type Props = {
  entries: DiveLogEntry[];
  searchQuery?: string;
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

export function DiveLogGrid({ entries, searchQuery = "", selectedId, onSelect }: Props) {
  const { prefs } = useUnitPreferences();

  if (entries.length === 0) {
    return (
      <p className={styles.empty}>
        New entries will appear here with key details so you can quickly scan
        your recent dives.
      </p>
    );
  }

  return (
    <div className={styles.grid}>
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

        const summaryParts = [
          depth.value ? `${depth.value}${depth.unit}` : null,
          `${entry.bottomTime} min`,
        ];
        if (waterTemp) summaryParts.push(`${waterTemp.value}${waterTemp.unit}`);
        if (visibility) summaryParts.push(`${visibility.value}${visibility.unit} vis`);
        const summary = summaryParts.filter(Boolean).join(" · ");

        return (
          <div
            key={entry.id}
            className={`${cardStyles.listItemInteractive} ${styles.card} ${
              isSelected ? styles.cardSelected : ""
            }`}
            onClick={() => onSelect(entry.id)}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{highlightMatch(entry.siteName, searchQuery)}</h3>
                <span className={styles.cardRegion}>{highlightMatch(entry.region, searchQuery)}</span>
              </div>
              <p className={styles.cardDate}>{entry.date}</p>
              <p className={styles.cardSummary}>{summary}</p>
              {entry.notes && (
                <p className={styles.cardNotesPreview}>{highlightMatch(entry.notes, searchQuery)}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
