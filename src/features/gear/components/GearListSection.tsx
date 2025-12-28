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
  onArchiveGear: (id: string) => void;
  onRefresh: () => void;
  autoExpandArchived?: boolean;
  onAutoExpandArchivedComplete?: () => void;
  onAddGear: () => void;
}

export function GearListSection({
  gearItems,
  kits,
  onEditGear,
  onDeleteGear,
  onArchiveGear,
  onRefresh,
  autoExpandArchived = false,
  onAutoExpandArchivedComplete,
  onAddGear,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("soonest-due");
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const archivedSectionRef = useRef<HTMLDivElement>(null);

  // Handle auto-expand when archiving
  useEffect(() => {
    if (autoExpandArchived) {
      setIsArchivedOpen(true);
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
          {/* Top-right: Edit, Archive, and Delete icons */}
          <div className={styles.itemActionsTop}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditGear(item);
              }}
              className={styles.iconButton}
              title="Edit gear"
              type="button"
              aria-label="Edit gear"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.5 2.5L11.5 5.5M10.5 1.5C10.8978 1.10218 11.4374 0.878679 12 0.878679C12.5626 0.878679 13.1022 1.10218 13.5 1.5C13.8978 1.89782 14.1213 2.43739 14.1213 3C14.1213 3.56261 13.8978 4.10218 13.5 4.5L4.5 13.5H0.5V9.5L9.5 0.5C9.89782 0.102178 10.4374 -0.121323 11 -0.121323C11.5626 -0.121323 12.1022 0.102178 12.5 0.5L10.5 1.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchiveGear(item.id);
              }}
              className={styles.iconButton}
              title={item.isActive ? "Archive gear" : "Restore gear"}
              type="button"
              aria-label={item.isActive ? "Archive gear" : "Restore gear"}
            >
              {item.isActive ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 2.5H11.5C12.0523 2.5 12.5 2.94772 12.5 3.5V11.5C12.5 12.0523 12.0523 12.5 11.5 12.5H2.5C1.94772 12.5 1.5 12.0523 1.5 11.5V3.5C1.5 2.94772 1.94772 2.5 2.5 2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.5 5.5H8.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 2.5H11.5C12.0523 2.5 12.5 2.94772 12.5 3.5V11.5C12.5 12.0523 12.0523 12.5 11.5 12.5H2.5C1.94772 12.5 1.5 12.0523 1.5 11.5V3.5C1.5 2.94772 1.94772 2.5 2.5 2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.5 5.5L7 7L8.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGear(item.id);
              }}
              className={`${styles.iconButton} ${styles.iconButtonDanger}`}
              title="Delete gear"
              type="button"
              aria-label="Delete gear"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 3.5L10.5 11.5C10.5 12.0523 10.0523 12.5 9.5 12.5H4.5C3.94772 12.5 3.5 12.0523 3.5 11.5L3 3.5M5.5 3.5V2.5C5.5 1.94772 5.94772 1.5 6.5 1.5H7.5C8.05228 1.5 8.5 1.94772 8.5 2.5V3.5M1.5 3.5H12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Bottom-right: Status pills */}
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
        </div>
      </li>
    );
  };

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
            {filteredAndSortedActive.map((item) => {
              const kitNames = gearKitMap.get(item.id) || [];
              return renderGearItem(item, kitNames);
            })}
          </ul>
        )}

        {/* Archived gear section */}
        {filteredAndSortedInactive.length > 0 && (
          <div ref={archivedSectionRef} className={styles.archivedSection}>
            <button
              type="button"
              onClick={() => setIsArchivedOpen(!isArchivedOpen)}
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
