"use client";

import { DiveLogEntry } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { displayDepth, displayTemperature, displayDistance } from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import listStyles from "@/styles/components/List.module.css";
import layoutStyles from "./LogbookLayout.module.css";
import { highlightMatch } from "./SearchHighlight";
import { DiveLogTable } from "./DiveLogTable";

type Props = {
  entries: DiveLogEntry[];
  searchQuery?: string;
  onSelect?: (entry: DiveLogEntry) => void;
  onDelete?: (id: string) => void;
  selectedId?: string | null;
  /** When true (detail pane open), use compact 2-row layout and hide buddy/region */
  isCompact?: boolean;
  /** When true, use mobile stacked list (site+location) instead of table */
  isMobile?: boolean;
};

function DiveLogList({
  entries,
  searchQuery = "",
  onSelect,
  onDelete,
  selectedId,
  isCompact = false,
  isMobile = false,
}: Props) {
  const { prefs } = useUnitPreferences();

  if (entries.length === 0) {
    return (
      <p className={listStyles.empty}>
        New entries will appear here with key details so you can quickly scan
        your recent dives.
      </p>
    );
  }

  /* Desktop, detail pane OPEN: compact list (unchanged) */
  if (isCompact) {
    const compactContent = entries.map((entry) => {
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
    });
    return <ul className={listStyles.listCompact}>{compactContent}</ul>;
  }

  /* Mobile: stacked list with site + location */
  if (isMobile) {
    const mobileContent = entries.map((entry) => {
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
            {entry.region ? (
              <>
                {highlightMatch(entry.siteName, searchQuery)}
                <span className={listStyles.diveRegionSep}> · </span>
                {highlightMatch(entry.region, searchQuery)}
              </>
            ) : (
              highlightMatch(entry.siteName, searchQuery)
            )}
          </div>
          <div className={listStyles.cellNotes}>
            {entry.notes ? highlightMatch(entry.notes, searchQuery) : ""}
          </div>
        </li>
      );
    });
    return <ul className={listStyles.listCompact}>{mobileContent}</ul>;
  }

  /* Desktop, detail pane CLOSED: table */
  return (
    <DiveLogTable
      entries={entries}
      searchQuery={searchQuery}
      onSelect={onSelect}
      onDelete={onDelete}
      selectedId={selectedId}
    />
  );
}

export default DiveLogList;
