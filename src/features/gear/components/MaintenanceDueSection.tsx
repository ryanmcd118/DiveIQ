"use client";

import { useMemo } from "react";
import type { GearItem } from "@prisma/client";
import {
  computeMaintenanceStatus,
  getNextServiceDueAt,
  sortGearByMaintenanceDue,
  type MaintenanceStatus,
} from "../lib/maintenance";
import { formatGearTypeLabel, GearType } from "../constants";
import styles from "./MaintenanceDueSection.module.css";

interface Props {
  gearItems: GearItem[];
  onJumpToGear: (gearId: string) => void;
}

export function MaintenanceDueSection({ gearItems, onJumpToGear }: Props) {
  const maintenanceItems = useMemo(() => {
    // Filter out archived/inactive items
    const activeItems = gearItems.filter((item) => item.isActive);
    
    const itemsWithStatus = activeItems.map((item) => ({
      item,
      status: computeMaintenanceStatus(item),
      nextDue: getNextServiceDueAt(item),
    }));

    const dueItems = itemsWithStatus.filter(
      (i) => i.status === "OVERDUE" || i.status === "DUE_SOON"
    );

    const sorted = sortGearByMaintenanceDue(
      dueItems.map((i) => i.item),
      (item) => {
        const found = itemsWithStatus.find((i) => i.item.id === item.id);
        return found?.status ?? "NO_SCHEDULE";
      }
    );

    return sorted.map((item) => {
      const found = itemsWithStatus.find((i) => i.item.id === item.id);
      return {
        item,
        status: found?.status ?? "NO_SCHEDULE",
        nextDue: found?.nextDue ?? null,
      };
    });
  }, [gearItems]);

  const getStatusLabel = (status: MaintenanceStatus): string => {
    switch (status) {
      case "OVERDUE":
        return "Overdue";
      case "DUE_SOON":
        return "Due soon";
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
    }).format(date);
  };

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

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Maintenance Due</h2>
      <div className={styles.panel}>
        {maintenanceItems.length === 0 ? (
          <p className={styles.emptyState}>No maintenance due 🎉</p>
        ) : (
          <div className={styles.rows}>
            {maintenanceItems.map(({ item, status, nextDue }) => (
              <button
                key={item.id}
                type="button"
                className={styles.row}
                onClick={() => onJumpToGear(item.id)}
                aria-label={`Jump to ${getPrimaryTitle(item)}`}
              >
                <div className={styles.rowLeft}>
                  <span className={styles.rowName}>
                    {getPrimaryTitle(item)}
                  </span>
                  <span className={styles.rowMeta}>
                    {formatGearTypeLabel(item.type as GearType)}
                    {nextDue && ` • Due: ${formatDate(nextDue)}`}
                  </span>
                </div>
                <div className={styles.rowRight}>
                  <span className={`${styles.statusPill} ${getStatusClass(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

