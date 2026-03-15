"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { GearItem } from "@prisma/client";
import { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import {
  computeMaintenanceStatus,
  sortGearByMaintenanceDue,
} from "../lib/maintenance";
import { GearType, formatGearTypeLabel } from "../constants";
import { getPrimaryTitle } from "../lib/gearListHelpers";
import { GearItemCard } from "./GearItemCard";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import styles from "./GearListSection.module.css";

type SortOption =
  | "soonest-due"
  | "most-overdue"
  | "name-az"
  | "recently-updated";

interface Props {
  gearItems: GearItem[];
  kits: GearKitWithItems[];
  onEditGear: (item: GearItem) => void;
  onDeleteGear: (id: string) => void;
  onArchiveGear: (id: string) => void;
  onRefresh?: () => void;
  autoExpandArchived?: boolean;
  onAutoExpandArchivedComplete?: () => void;
  onAddGear: () => void;
  highlightedGearId?: string | null;
  gearCardRefs: React.MutableRefObject<Map<string, HTMLLIElement>>;
}

export function GearListSection({
  gearItems,
  kits,
  onEditGear,
  onDeleteGear,
  onArchiveGear,
  autoExpandArchived = false,
  onAutoExpandArchivedComplete,
  onAddGear,
  highlightedGearId = null,
  gearCardRefs,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("soonest-due");
  const [archivedOpenState, setArchivedOpenState] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const archivedSectionRef = useRef<HTMLDivElement>(null);

  // Derive isArchivedOpen from autoExpandArchived or user-toggled state
  const isArchivedOpen = autoExpandArchived ? true : archivedOpenState;

  // Handle scrolling when auto-expand is triggered (effects can touch DOM)
  useEffect(() => {
    if (autoExpandArchived) {
      // Smooth scroll to archived section after a brief delay to allow render
      setTimeout(() => {
        if (archivedSectionRef.current) {
          const rect = archivedSectionRef.current.getBoundingClientRect();
          const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
          if (!isVisible) {
            archivedSectionRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }
        onAutoExpandArchivedComplete?.();
      }, 100);
    }
  }, [autoExpandArchived, onAutoExpandArchivedComplete]);

  // Create memoized map of gearId -> kit names
  const gearKitMap = useMemo(() => {
    const map = new Map<string, string[]>();
    kits.forEach((kit) => {
      kit.kitItems.forEach((kitItem) => {
        const gearId = kitItem.gearItemId;
        if (!map.has(gearId)) {
          map.set(gearId, []);
        }
        map.get(gearId)!.push(kit.name);
      });
    });
    return map;
  }, [kits]);

  // Split into active and inactive, then apply filters and sorting
  const { activeItems, inactiveItems } = useMemo(() => {
    const active = gearItems.filter((item) => item.isActive);
    const inactive = gearItems.filter((item) => !item.isActive);
    return { activeItems: active, inactiveItems: inactive };
  }, [gearItems]);

  const applyFiltersAndSort = useCallback(
    (items: GearItem[]) => {
      let filtered = [...items];

      if (typeFilter !== "all") {
        filtered = filtered.filter((item) => item.type === typeFilter);
      }

      if (statusFilter !== "all") {
        filtered = filtered.filter((item) => {
          const status = computeMaintenanceStatus(item);
          return status === statusFilter;
        });
      }

      // Apply sorting
      let sorted = [...filtered];

      if (sortBy === "soonest-due" || sortBy === "most-overdue") {
        sorted = sortGearByMaintenanceDue(sorted, computeMaintenanceStatus);
        if (sortBy === "most-overdue") {
          // Reverse to show most overdue first
          sorted = sorted.reverse();
        }
      } else if (sortBy === "name-az") {
        sorted.sort((a, b) => {
          const nameA = getPrimaryTitle(a).toLowerCase();
          const nameB = getPrimaryTitle(b).toLowerCase();
          return nameA.localeCompare(nameB);
        });
      } else if (sortBy === "recently-updated") {
        sorted.sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateB - dateA; // Most recent first
        });
      }

      return sorted;
    },
    [typeFilter, statusFilter, sortBy]
  );

  const filteredAndSortedActive = useMemo(
    () => applyFiltersAndSort(activeItems),
    [activeItems, applyFiltersAndSort]
  );

  const filteredAndSortedInactive = useMemo(
    () => applyFiltersAndSort(inactiveItems),
    [inactiveItems, applyFiltersAndSort]
  );

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionTitleText}>Your Gear</span>
        <button
          onClick={onAddGear}
          className={styles.addIcon}
          title="Add new gear"
          type="button"
        >
          +
        </button>
      </h2>
      <div className={cardStyles.card}>
        <div className={styles.filters}>
          <div className={formStyles.field}>
            <label htmlFor="typeFilter" className={formStyles.label}>
              Type
            </label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={formStyles.select}
            >
              <option value="all">All types</option>
              {Object.values(GearType).map((type) => (
                <option key={type} value={type}>
                  {formatGearTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.field}>
            <label htmlFor="statusFilter" className={formStyles.label}>
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={formStyles.select}
            >
              <option value="all">All statuses</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DUE_SOON">Due soon</option>
              <option value="UP_TO_DATE">Up to date</option>
              <option value="UNKNOWN">Unknown</option>
              <option value="NO_SCHEDULE">No schedule</option>
            </select>
          </div>

          <div className={formStyles.field}>
            <label htmlFor="sortBy" className={formStyles.label}>
              Sort
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={formStyles.select}
            >
              <option value="soonest-due">Soonest due</option>
              <option value="most-overdue">Most overdue</option>
              <option value="name-az">Name A–Z</option>
              <option value="recently-updated">Recently updated</option>
            </select>
          </div>
        </div>

        {/* Active gear list */}
        {filteredAndSortedActive.length === 0 ? (
          <p className={styles.emptyState}>
            No active gear items match your filters.
          </p>
        ) : (
          <ul className={styles.list}>
            {filteredAndSortedActive.map((item) => (
              <GearItemCard
                key={item.id}
                item={item}
                kitNames={gearKitMap.get(item.id) || []}
                isExpanded={expandedItems.has(item.id)}
                isHighlighted={highlightedGearId === item.id}
                onToggleExpand={toggleExpanded}
                onEdit={onEditGear}
                onArchive={onArchiveGear}
                onDelete={onDeleteGear}
                cardRef={(el) => {
                  if (el) {
                    gearCardRefs.current.set(item.id, el);
                  } else {
                    gearCardRefs.current.delete(item.id);
                  }
                }}
              />
            ))}
          </ul>
        )}

        {/* Archived gear section */}
        {filteredAndSortedInactive.length > 0 && (
          <div ref={archivedSectionRef} className={styles.archivedSection}>
            <button
              type="button"
              onClick={() => setArchivedOpenState(!archivedOpenState)}
              className={styles.archivedHeader}
            >
              <span className={styles.archivedHeaderText}>
                Archived gear ({filteredAndSortedInactive.length})
              </span>
              <span className={styles.chevron}>
                {isArchivedOpen ? "▼" : "▶"}
              </span>
            </button>
            {isArchivedOpen && (
              <ul className={styles.list}>
                {filteredAndSortedInactive.map((item) => (
                  <GearItemCard
                    key={item.id}
                    item={item}
                    kitNames={gearKitMap.get(item.id) || []}
                    isExpanded={expandedItems.has(item.id)}
                    isHighlighted={highlightedGearId === item.id}
                    onToggleExpand={toggleExpanded}
                    onEdit={onEditGear}
                    onArchive={onArchiveGear}
                    onDelete={onDeleteGear}
                    cardRef={(el) => {
                      if (el) {
                        gearCardRefs.current.set(item.id, el);
                      } else {
                        gearCardRefs.current.delete(item.id);
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
