"use client";

import { useState, useMemo } from "react";
import type { GearItem } from "@prisma/client";
import {
  computeMaintenanceStatus,
  getNextServiceDueAt,
  type MaintenanceStatus,
} from "../lib/maintenance";
import { GearType } from "../constants";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import formStyles from "@/styles/components/Form.module.css";
import styles from "./GearListSection.module.css";

interface Props {
  gearItems: GearItem[];
  onEditGear: (item: GearItem) => void;
  onDeleteGear: (id: string) => void;
  onArchiveGear: (id: string, isActive: boolean) => void;
  onRefresh: () => void;
}

export function GearListSection({
  gearItems,
  onEditGear,
  onDeleteGear,
  onArchiveGear,
  onRefresh,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);

  const filteredItems = useMemo(() => {
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

    if (!showInactive) {
      filtered = filtered.filter((item) => item.isActive);
    }

    return filtered;
  }, [gearItems, typeFilter, statusFilter, showInactive]);

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

  const getDisplayName = (item: GearItem): string => {
    return item.nickname || `${item.manufacturer} ${item.model}`;
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
                  {type}
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
            <label className={formStyles.label}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className={styles.checkbox}
              />
              Show inactive
            </label>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className={styles.emptyState}>No gear items match your filters.</p>
        ) : (
          <ul className={styles.list}>
            {filteredItems.map((item) => {
              const status = computeMaintenanceStatus(item);
              const nextDue = getNextServiceDueAt(item);

              return (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemName}>
                        {getDisplayName(item)}
                      </span>
                      <span
                        className={`${styles.statusPill} ${getStatusClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    <div className={styles.itemMeta}>
                      <span className={styles.itemType}>{item.type}</span>
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

