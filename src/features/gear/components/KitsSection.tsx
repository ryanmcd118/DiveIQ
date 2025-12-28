"use client";

import { useMemo } from "react";
import type { GearItem } from "@prisma/client";
import { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./KitsSection.module.css";

interface Props {
  kits: GearKitWithItems[];
  gearItems: GearItem[];
  onEditKit: (kit: GearKitWithItems) => void;
  onDeleteKit: (id: string) => void;
  onSetDefaultKit: (id: string) => void;
}

export function KitsSection({
  kits,
  gearItems,
  onEditKit,
  onDeleteKit,
  onSetDefaultKit,
}: Props) {
  // Create a set of active gear item IDs for quick lookup
  const activeGearIds = useMemo(() => {
    return new Set(gearItems.filter((g) => g.isActive).map((g) => g.id));
  }, [gearItems]);
  if (kits.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Kits</h2>
        <div className={cardStyles.card}>
          <p className={styles.emptyState}>No kits yet. Create one to get started.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Your Kits</h2>
      <div className={styles.kitsGrid}>
        {kits.map((kit) => {
          const activeItemCount = kit.kitItems.filter((ki) =>
            activeGearIds.has(ki.gearItemId)
          ).length;
          return (
            <div key={kit.id} className={cardStyles.card}>
              <div className={styles.kitHeader}>
                <div>
                  <h3 className={styles.kitName}>
                    {kit.name}
                    {kit.isDefault && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                  </h3>
                  <p className={styles.kitCount}>
                    {activeItemCount} item{activeItemCount !== 1 ? "s" : ""}
                  </p>
              </div>
            </div>
            <div className={styles.kitActions}>
              <button
                onClick={() => onEditKit(kit)}
                className={buttonStyles.secondary}
              >
                Edit
              </button>
              {!kit.isDefault && (
                <button
                  onClick={() => onSetDefaultKit(kit.id)}
                  className={buttonStyles.ghost}
                >
                  Set default
                </button>
              )}
              <button
                onClick={() => onDeleteKit(kit.id)}
                className={buttonStyles.danger}
              >
                Delete
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}

