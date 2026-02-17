"use client";

import { DiveLogEntry } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { displayDepth, displayTemperature, displayDistance } from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import listStyles from "@/styles/components/List.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import layoutStyles from "./LogbookLayout.module.css";
import { highlightMatch } from "./SearchHighlight";

type Props = {
  entries: DiveLogEntry[];
  searchQuery?: string;
  onSelect?: (entry: DiveLogEntry) => void;
  onDelete?: (id: string) => void;
  selectedId?: string | null;
};

function DiveLogList({ entries, searchQuery = "", onSelect, onDelete, selectedId }: Props) {
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
    <ul className={listStyles.listCompact}>
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

        const statsParts = [
          depth.value ? `${depth.value}${depth.unit}` : null,
          `${entry.bottomTime} min`,
        ];
        if (waterTemp) statsParts.push(`${waterTemp.value}${waterTemp.unit}`);
        if (visibility) statsParts.push(`${visibility.value}${visibility.unit} vis`);
        const statsLine = statsParts.filter(Boolean).join(" · ");

        const hasMeta = entry.buddyName || (entry.gearItems && entry.gearItems.length > 0);

        return (
          <li
            key={entry.id}
            className={`${cardStyles.listItemInteractive} ${
              isSelected ? layoutStyles.listItemSelected : ""
            }`}
            onClick={() => onSelect?.(entry)}
          >
            <div className={listStyles.diveRowMain}>
              <div className={listStyles.diveColPlace}>
                <span className={listStyles.diveTitle}>
                  {highlightMatch(entry.siteName, searchQuery)}
                </span>
                <span className={listStyles.diveRegion}>
                  {highlightMatch(entry.region, searchQuery)}
                </span>
              </div>
              <div className={listStyles.diveColDate}>{entry.date}</div>
              <div className={listStyles.diveColStats}>
                <span className={listStyles.diveStats}>{statsLine}</span>
                {isSelected && (
                  <span className={listStyles.diveDate}>Selected</span>
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
              </div>
            </div>
            {hasMeta && (
              <p className={listStyles.diveMetaRow}>
                {entry.buddyName && (
                  <>
                    Buddy: {highlightMatch(entry.buddyName, searchQuery)}
                    {entry.gearItems?.length ? " · " : ""}
                  </>
                )}
                {entry.gearItems?.length
                  ? `Gear: ${entry.gearItems.map((g) => g.nickname || `${g.manufacturer} ${g.model}`).join(", ")}`
                  : null}
              </p>
            )}
            {entry.notes && (
              <p className={listStyles.diveNotes}>{highlightMatch(entry.notes, searchQuery)}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default DiveLogList;
