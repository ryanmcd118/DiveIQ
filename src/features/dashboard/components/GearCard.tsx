"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { GearItem } from "@prisma/client";
import { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import {
  computeMaintenanceStatus,
  sortGearByMaintenanceDue,
  type MaintenanceStatus,
} from "@/features/gear/lib/maintenance";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./GearCard.module.css";

export function GearCard() {
  const [defaultKit, setDefaultKit] = useState<GearKitWithItems | null>(null);
  const [maintenanceItems, setMaintenanceItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [kitsRes, gearRes] = await Promise.all([
          fetch("/api/gear-kits"),
          fetch("/api/gear?includeInactive=false"),
        ]);

        if (kitsRes.ok && gearRes.ok) {
          const kitsData = await kitsRes.json();
          const gearData = await gearRes.json();

          const defaultKit = kitsData.kits.find((k: GearKitWithItems) => k.isDefault);
          setDefaultKit(defaultKit ?? null);

          // Get maintenance due items
          const itemsWithStatus: Array<{ item: GearItem; status: MaintenanceStatus }> = gearData.items.map((item: GearItem) => ({
            item,
            status: computeMaintenanceStatus(item),
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

          setMaintenanceItems(sorted.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load gear data", err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

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

  const getDisplayName = (item: GearItem): string => {
    return item.nickname || `${item.manufacturer} ${item.model}`;
  };

  if (loading) {
    return (
      <div className={`${cardStyles.card} ${styles.card}`}>
        <h3 className={styles.cardTitle}>Gear</h3>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`${cardStyles.card} ${styles.card}`}>
      <h3 className={styles.cardTitle}>Gear</h3>

      {/* Default Kit */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Default kit</h4>
        {defaultKit ? (
          <p className={styles.snapshotValue}>
            {defaultKit.name} ({defaultKit.kitItems.length} items)
          </p>
        ) : (
          <p className={styles.emptyState}>No default kit set</p>
        )}
      </div>

      {/* Maintenance Due */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Maintenance due</h4>
        {maintenanceItems.length === 0 ? (
          <p className={styles.emptyState}>All gear up to date.</p>
        ) : (
          <ul className={styles.maintenanceList}>
            {maintenanceItems.map((item) => {
              const status = computeMaintenanceStatus(item);
              return (
                <li key={item.id} className={styles.maintenanceItem}>
                  <span className={styles.itemName}>{getDisplayName(item)}</span>
                  <span
                    className={`${styles.statusPill} ${getStatusClass(status)}`}
                  >
                    {getStatusLabel(status)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={styles.actions}>
        <Link href="/gear" className={buttonStyles.ghost}>
          Manage gear
        </Link>
      </div>
    </div>
  );
}

