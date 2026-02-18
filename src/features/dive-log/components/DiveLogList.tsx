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

  const listContent = entries.map((entry) => {
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
                <span>{visibility ? `${visibility.value}${visibility.unit}` : "—"}</span>
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
            className={`${cardStyles.listItemInteractive} ${listStyles.diveListItem} ${listStyles.expandedRow} ${
              isSelected ? layoutStyles.listItemSelected : ""
            }`}
            onClick={() => onSelect?.(entry)}
          >
            <div className={`${listStyles.diveCellSite} ${listStyles.colSite}`}>
              <span className={listStyles.diveSiteName}>
                {highlightMatch(entry.siteName, searchQuery)}
              </span>
              <span className={listStyles.diveRegionSep}> · </span>
              <span className={listStyles.diveRegion}>
                {highlightMatch(entry.region, searchQuery)}
              </span>
            </div>
            <div className={`${listStyles.diveCellBuddy} ${listStyles.colBuddy}`}>
              {entry.buddyName ? highlightMatch(entry.buddyName, searchQuery) : ""}
            </div>
            <div className={`${listStyles.diveCellDate} ${listStyles.colDate}`}>{entry.date}</div>
            <div className={`${listStyles.diveCellDepth} ${listStyles.colDepth}`}>
              {depth.value ? `${depth.value}${depth.unit}` : "—"}
            </div>
            <div className={`${listStyles.diveCellTime} ${listStyles.colTime}`}>{`${entry.bottomTime}m`}</div>
            <div className={`${listStyles.diveCellTemp} ${listStyles.colTemp}`}>
              {waterTemp ? `${waterTemp.value}${waterTemp.unit}` : "—"}
            </div>
            <div className={`${listStyles.diveCellVis} ${listStyles.colVisibility}`}>
              {visibility ? `${visibility.value}${visibility.unit}` : "—"}
            </div>
            <div className={`${listStyles.diveCellNotes} ${listStyles.colNotes}`}>
              {entry.notes ? highlightMatch(entry.notes, searchQuery) : ""}
            </div>
            <div className={`${listStyles.diveCellActions} ${listStyles.colActions}`}>
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
          </li>
        );
  });

  if (isCompact) {
    return <ul className={listStyles.listCompact}>{listContent}</ul>;
  }

  return (
    <div className={listStyles.expandedListWrapper}>
      <div className={listStyles.diveListHeader} role="presentation" aria-hidden="true">
        <span className={`${listStyles.diveListHeaderCell} ${listStyles.colSite}`}>Site</span>
        <span className={`${listStyles.diveListHeaderCell} ${listStyles.colBuddy}`}>Buddy</span>
        <span className={`${listStyles.diveListHeaderCell} ${listStyles.colDate}`}>Date</span>
        <span className={`${listStyles.diveListHeaderCell} ${listStyles.colDepth}`}>Depth</span>
        <span className={`${listStyles.diveListHeaderCell} ${listStyles.colTime}`}>Time</span>
        <span className={`${listStyles.diveListHeaderCell} ${listStyles.colTemp}`}>Temp</span>
        <span className={`${listStyles.diveListHeaderCell} ${listStyles.colVisibility}`}>Visibility</span>
        <span className={`${listStyles.diveListHeaderCell} ${listStyles.colNotes}`}>Notes</span>
        <span className={`${listStyles.diveListHeaderCell} ${listStyles.colActions}`} />
      </div>
      <ul className={listStyles.listCompact}>{listContent}</ul>
    </div>
  );
}

export default DiveLogList;
