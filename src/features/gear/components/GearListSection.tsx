"use client";

import { useState, useMemo } from "react";
import type { GearItem } from "@prisma/client";
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

type SortOption = "soonest-due" | "most-overdue" | "name-az" | "recently-updated";

interface Props {
  gearItems: GearItem[];
  onEditGear: (item: GearItem) => void;
  onDeleteGear: (id: string) => void;
  onArchiveGear: (id: string, isActive: boolean) => void;
  onRefresh: () => void;
  showInactive: boolean;
  onShowInactiveChange: (show: boolean) => void;
}

export function GearListSection({
  gearItems,
  onEditGear,
  onDeleteGear,
  onArchiveGear,
  onRefresh,
  showInactive,
  onShowInactiveChange,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("soonest-due");

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

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...gearItems];

    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const status = computeMaintenanceStatus(item);
        return status === statusFilter;
      });
    }

    // Note: isActive filtering is handled by the API based on showInactive prop
    // We don't need to filter here since the API already returns the correct set

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
  }, [gearItems, typeFilter, statusFilter, sortBy]);

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
            <label className={formStyles.label}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => onShowInactiveChange(e.target.checked)}
                className={styles.checkbox}
              />
              Show inactive
            </label>
          </div>
        </div>

        {filteredAndSortedItems.length === 0 ? (
          <p className={styles.emptyState}>No gear items match your filters.</p>
        ) : (
          <ul className={styles.list}>
            {filteredAndSortedItems.map((item) => {
              const status = computeMaintenanceStatus(item);
              const nextDue = getNextServiceDueAt(item);

              const primaryTitle = getPrimaryTitle(item);
              const secondaryText = getSecondaryText(item);

              return (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitleRow}>
                      <span className={styles.itemName}>
                        {primaryTitle}
                      </span>
                      {secondaryText && (
                        <span className={styles.itemNickname}>
                          {secondaryText}
                        </span>
                      )}
                    </div>
                    <div className={styles.itemMeta}>
                      <span className={styles.itemType}>{formatGearTypeLabel(item.type as GearType)}</span>
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
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.statusPills}>
                      {!item.isActive && (
                        <span className={`${styles.statusPill} ${styles.statusInactive}`}>
                          Inactive
                        </span>
                      )}
                      <span
                        className={`${styles.statusPill} ${getStatusClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        onClick={() => onEditGear(item)}
                        className={buttonStyles.secondary}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onArchiveGear(item.id, !item.isActive)}
                        className={buttonStyles.ghost}
                      >
                        {item.isActive ? "Archive" : "Unarchive"}
                      </button>
                      <button
                        onClick={() => onDeleteGear(item.id)}
                        className={buttonStyles.danger}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

