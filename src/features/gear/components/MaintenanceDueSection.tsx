"use client";

import { useMemo } from "react";
import type { GearItem } from "@prisma/client";
import {
  computeMaintenanceStatus,
  getNextServiceDueAt,
  sortGearByMaintenanceDue,
  type MaintenanceStatus,
} from "../lib/maintenance";
import cardStyles from "@/styles/components/Card.module.css";
import styles from "./MaintenanceDueSection.module.css";

interface Props {
  gearItems: GearItem[];
  onEditGear: (item: GearItem) => void;
}

export function MaintenanceDueSection({ gearItems, onEditGear }: Props) {
  const maintenanceItems = useMemo(() => {
    const itemsWithStatus = gearItems.map((item) => ({
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

  const getDisplayName = (item: GearItem): string => {
    return item.nickname || `${item.manufacturer} ${item.model}`;
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Maintenance Due</h2>
      <div className={cardStyles.card}>
        {maintenanceItems.length === 0 ? (
          <p className={styles.emptyState}>All gear up to date.</p>
        ) : (
          <ul className={styles.list}>
            {maintenanceItems.map(({ item, status, nextDue }) => (
              <li
                key={item.id}
                className={styles.item}
                onClick={() => onEditGear(item)}
              >
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemName}>
                      {getDisplayName(item)}
                    </span>
                    <span className={`${styles.statusPill} ${getStatusClass(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemType}>{item.type}</span>
                    {nextDue && (
                      <span className={styles.itemDue}>
                        Due: {formatDate(nextDue)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

