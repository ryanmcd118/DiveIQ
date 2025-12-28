"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { GearItem } from "@prisma/client";
import { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import {
  computeMaintenanceStatus,
  getNextServiceDueAt,
  sortGearByMaintenanceDue,
  type MaintenanceStatus,
} from "../lib/maintenance";
import { GearType, formatGearTypeLabel } from "../constants";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
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
  onArchiveGear: (id: string, isActive: boolean) => void;
  onRefresh: () => void;
  hideArchived: boolean;
  onHideArchivedChange: (hide: boolean) => void;
  autoExpandInactive?: boolean;
  onAutoExpandInactiveComplete?: () => void;
  onAddGear: () => void;
}

export function GearListSection({
  gearItems,
  kits,
  onEditGear,
  onDeleteGear,
  onArchiveGear,
  onRefresh,
  hideArchived,
  onHideArchivedChange,
  autoExpandInactive = false,
  onAutoExpandInactiveComplete,
  onAddGear,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("soonest-due");
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const inactiveSectionRef = useRef<HTMLDivElement>(null);

  // Handle auto-expand when archiving
  useEffect(() => {
    if (autoExpandInactive && !hideArchived) {
      setIsInactiveOpen(true);
      // Smooth scroll to inactive section after a brief delay to allow render
      setTimeout(() => {
        if (inactiveSectionRef.current) {
          const rect = inactiveSectionRef.current.getBoundingClientRect();
          const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
          if (!isVisible) {
            inactiveSectionRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }
        onAutoExpandInactiveComplete?.();
      }, 100);
    }
  }, [autoExpandInactive, hideArchived, onAutoExpandInactiveComplete]);

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

  const getPrimaryTitle = (item: GearItem): string => {
    // Priority: manufacturer + model > manufacturer alone > model alone > nickname > gear type
    if (item.manufacturer && item.model) {
      return `${item.manufacturer} ${item.model}`;
    }
    if (item.manufacturer) {
      return item.manufacturer;
    }
    if (item.model) {
      return item.model;
    }
    if (item.nickname) {
      return item.nickname;
    }
    // Final fallback to gear type
    return formatGearTypeLabel(item.type as GearType);
  };

  const getSecondaryText = (item: GearItem): string | null => {
    // Show nickname as secondary if it exists and is different from primary title
    if (item.nickname) {
      const primary = getPrimaryTitle(item);
      if (item.nickname !== primary) {
        return item.nickname;
      }
    }
    return null;
  };

  // Split into active and inactive, then apply filters and sorting
  const { activeItems, inactiveItems } = useMemo(() => {
    const active = gearItems.filter((item) => item.isActive);
    const inactive = gearItems.filter((item) => !item.isActive);
    return { activeItems: active, inactiveItems: inactive };
  }, [gearItems]);

  const applyFiltersAndSort = (items: GearItem[]) => {
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
  };

  const filteredAndSortedActive = useMemo(
    () => applyFiltersAndSort(activeItems),
    [activeItems, typeFilter, statusFilter, sortBy]
  );

  const filteredAndSortedInactive = useMemo(
    () => applyFiltersAndSort(inactiveItems),
    [inactiveItems, typeFilter, statusFilter, sortBy]
  );

  const getStatusLabel = (status: MaintenanceStatus): string => {
    switch (status) {
      case "NO_SCHEDULE":
        return "No schedule";
      case "UNKNOWN":
        return "Unknown";
      case "UP_TO_DATE":
        return "Up to date";
      case "DUE_SOON":
        return "Due soon";
      case "OVERDUE":
        return "Overdue";
      default:
        return "";
    }
  };

  const getStatusClass = (status: MaintenanceStatus): string => {
    switch (status) {
      case "OVERDUE":
        return styles.statusOverdue;
      case "DUE_SOON":
        return styles.statusDueSoon;
      case "UP_TO_DATE":
        return styles.statusUpToDate;
      case "UNKNOWN":
        return styles.statusUnknown;
      case "NO_SCHEDULE":
        return styles.statusNoSchedule;
      default:
        return "";
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const renderGearItem = (item: GearItem, kitNames: string[]) => {
    const status = computeMaintenanceStatus(item);
    const nextDue = getNextServiceDueAt(item);
    const isExpanded = expandedItems.has(item.id);

    const primaryTitle = getPrimaryTitle(item);
    const secondaryText = getSecondaryText(item);

    // Check if expanded content should be shown
    const hasExpandedContent =
      item.purchaseDate || item.notes || item.serviceIntervalMonths;

    const handleCardClick = (e: React.MouseEvent) => {
      // Don't expand if clicking on action buttons or their container
      const target = e.target as HTMLElement;
      if (
        target.closest(`.${styles.itemActions}`) ||
        target.closest(`button`)
      ) {
        return;
      }
      if (hasExpandedContent) {
        toggleExpanded(item.id);
      }
    };

    return (
      <li
        key={item.id}
        className={`${styles.item} ${isExpanded ? styles.itemExpanded : ""} ${
          hasExpandedContent ? styles.itemExpandable : ""
        }`}
        onClick={hasExpandedContent ? handleCardClick : undefined}
      >
        <div className={styles.itemContent}>
          <div className={styles.itemTitleRow}>
            <span className={styles.itemName}>{primaryTitle}</span>
            {secondaryText && (
              <span className={styles.itemNickname}>{secondaryText}</span>
            )}
          </div>
          <div className={styles.itemMeta}>
            <span className={styles.itemType}>
              {formatGearTypeLabel(item.type as GearType)}
            </span>
            {item.lastServicedAt && (
              <span className={styles.itemMetaText}>
                Last serviced: {formatDate(item.lastServicedAt)}
              </span>
            )}
            {nextDue && (
              <span className={styles.itemMetaText}>
                Due: {formatDate(nextDue)}
              </span>
            )}
          </div>
          {kitNames.length > 0 && (
            <div className={styles.kitPills}>
              {kitNames.map((kitName) => (
                <span key={kitName} className={styles.kitPill}>
                  {kitName}
                </span>
              ))}
            </div>
          )}
          {isExpanded && hasExpandedContent && (
            <div className={styles.itemExpandedContent}>
              {item.purchaseDate && (
                <div className={styles.itemExpandedRow}>
                  <span className={styles.itemExpandedLabel}>Purchased:</span>
                  <span className={styles.itemExpandedValue}>
                    {formatDate(item.purchaseDate)}
                  </span>
                </div>
              )}
              {item.serviceIntervalMonths && (
                <div className={styles.itemExpandedRow}>
                  <span className={styles.itemExpandedLabel}>
                    Service interval:
                  </span>
                  <span className={styles.itemExpandedValue}>
                    {item.serviceIntervalMonths} month
                    {item.serviceIntervalMonths !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {item.notes && (
                <div className={styles.itemExpandedRow}>
                  <span className={styles.itemExpandedLabel}>Notes:</span>
                  <span className={styles.itemExpandedValue}>
                    {item.notes}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.itemRight}>
          <div className={styles.statusPills}>
            <span className={`${styles.statusPill} ${getStatusClass(status)}`}>
              {getStatusLabel(status)}
            </span>
            {!item.isActive && (
              <span className={`${styles.statusPill} ${styles.statusInactive}`}>
                Inactive
              </span>
            )}
          </div>
          <div className={styles.itemActions}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditGear(item);
              }}
              className={buttonStyles.secondary}
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchiveGear(item.id, !item.isActive);
              }}
              className={buttonStyles.ghost}
            >
              {item.isActive ? "Archive" : "Unarchive"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGear(item.id);
              }}
              className={buttonStyles.danger}
            >
              Delete
            </button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Your Gear</h2>
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

          <div className={formStyles.field}>
            <label className={styles.hideArchivedToggle}>
              <input
                type="checkbox"
                checked={hideArchived}
                onChange={(e) => onHideArchivedChange(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Hide archived gear</span>
            </label>
          </div>

          <button onClick={onAddGear} className={styles.addGearButton}>
            Add gear
          </button>
        </div>

        {/* Active gear list */}
        {filteredAndSortedActive.length === 0 ? (
          <p className={styles.emptyState}>
            No active gear items match your filters.
          </p>
        ) : (
          <ul className={styles.list}>
            {filteredAndSortedActive.map((item) => {
              const kitNames = gearKitMap.get(item.id) || [];
              return renderGearItem(item, kitNames);
            })}
          </ul>
        )}

        {/* Inactive gear section */}
        {!hideArchived && filteredAndSortedInactive.length > 0 && (
          <div ref={inactiveSectionRef} className={styles.inactiveSection}>
            <button
              type="button"
              onClick={() => setIsInactiveOpen(!isInactiveOpen)}
              className={styles.inactiveHeader}
            >
              <span className={styles.inactiveHeaderText}>
                Inactive ({filteredAndSortedInactive.length})
              </span>
              <span className={styles.chevron}>
                {isInactiveOpen ? "▼" : "▶"}
              </span>
            </button>
            {isInactiveOpen && (
              <ul className={styles.list}>
                {filteredAndSortedInactive.map((item) => {
                  const kitNames = gearKitMap.get(item.id) || [];
                  return renderGearItem(item, kitNames);
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
