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
  /** When true (detail pane open), use compact 2-row layout and hide buddy/region */
  isCompact?: boolean;
};

function DiveLogList({ entries, searchQuery = "", onSelect, onDelete, selectedId, isCompact = false }: Props) {
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

        if (isCompact) {
          return (
            <li
              key={entry.id}
              className={`${cardStyles.listItemInteractive} ${listStyles.diveListItem} ${listStyles.compact} ${
                isSelected ? layoutStyles.listItemSelected : ""
              }`}
              onClick={() => onSelect?.(entry)}
            >
              <div className={listStyles.cellDate}>{entry.date}</div>
              <div className={listStyles.cellMetrics}>
                <span>{depth.value ? `${depth.value}${depth.unit}` : "—"}</span>
                <span>{`${entry.bottomTime}m`}</span>
                <span>{waterTemp ? `${waterTemp.value}${waterTemp.unit}` : "—"}</span>
                <span>{visibility ? `${visibility.value}${visibility.unit} vis` : "—"}</span>
              </div>
              <div className={listStyles.cellPlace}>
                {highlightMatch(entry.siteName, searchQuery)}
              </div>
              <div className={listStyles.cellNotes}>
                {entry.notes ? highlightMatch(entry.notes, searchQuery) : ""}
              </div>
            </li>
          );
        }

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
            {/* Grid (1,2): Right rail (stats + notes) + Selected + delete - spans both rows */}
            <div className={listStyles.diveCellRight}>
              <div className={listStyles.rightRail}>
                {/* Stats rail: always 5 columns so alignment is consistent across rows */}
                <div className={listStyles.diveCellStats}>
                  <span className={listStyles.statDate}>{entry.date}</span>
                  <span className={listStyles.stat}>
                    {depth.value ? `${depth.value}${depth.unit}` : "—"}
                  </span>
                  <span className={listStyles.stat}>{`${entry.bottomTime}m`}</span>
                  <span className={listStyles.stat}>
                    {waterTemp ? `${waterTemp.value}${waterTemp.unit}` : "—"}
                  </span>
                  <span className={listStyles.statVis}>
                    {visibility ? `${visibility.value}${visibility.unit} vis` : "—"}
                  </span>
                </div>
                {/* Notes aligned to start of stats rail */}
                <div className={listStyles.diveCellNotes}>
                  {entry.notes ? (
                    <span className={listStyles.diveNotesPreview}>
                      {highlightMatch(entry.notes, searchQuery)}
                    </span>
                  ) : null}
                </div>
              </div>
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
            {/* Grid (2,2): Empty (notes are in rightRail above) */}
            <div />
          </li>
        );
      })}
    </ul>
  );
}

export default DiveLogList;
