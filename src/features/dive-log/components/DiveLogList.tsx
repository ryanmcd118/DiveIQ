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
          entry.date,
          depth.value ? `${depth.value}${depth.unit}` : null,
          `${entry.bottomTime}m`,
        ];
        if (waterTemp) statsParts.push(`${waterTemp.value}${waterTemp.unit}`);
        if (visibility) statsParts.push(`${visibility.value}${visibility.unit} vis`);
        const statsLine = statsParts.filter(Boolean).join(" · ");

        return (
          <li
            key={entry.id}
            className={`${cardStyles.listItemInteractive} ${listStyles.diveListItem} ${
              isSelected ? layoutStyles.listItemSelected : ""
            }`}
            onClick={() => onSelect?.(entry)}
          >
            {/* Grid (1,1): Site · Region */}
            <div className={listStyles.diveCellPlace}>
              <span className={listStyles.diveSiteName}>
                {highlightMatch(entry.siteName, searchQuery)}
              </span>
              <span className={listStyles.diveRegionSep}> · </span>
              <span className={listStyles.diveRegion}>
                {highlightMatch(entry.region, searchQuery)}
              </span>
            </div>
            {/* Grid (1,2): Stats cluster + Selected + delete */}
            <div className={listStyles.diveCellStats}>
              <span className={listStyles.diveStatsCluster}>{statsLine}</span>
              {isSelected && (
                <span className={listStyles.diveSelectedBadge}>Selected</span>
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
            {/* Grid (2,1): Buddy: Name */}
            <div className={listStyles.diveCellBuddy}>
              {entry.buddyName ? (
                <>
                  <span className={listStyles.diveBuddyLabel}>Buddy: </span>
                  {highlightMatch(entry.buddyName, searchQuery)}
                </>
              ) : (
                <span className={listStyles.diveRow2Placeholder} />
              )}
            </div>
            {/* Grid (2,2): Notes preview (1 line) */}
            <div className={listStyles.diveCellNotes}>
              {entry.notes ? (
                <span className={listStyles.diveNotesPreview}>
                  {highlightMatch(entry.notes, searchQuery)}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default DiveLogList;
