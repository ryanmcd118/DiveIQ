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
  onCreateKit: () => void;
}

export function KitsSection({
  kits,
  gearItems,
  onEditKit,
  onDeleteKit,
  onSetDefaultKit,
  onCreateKit,
}: Props) {
  // Create a set of active gear item IDs for quick lookup
  const activeGearIds = useMemo(() => {
    return new Set(gearItems.filter((g) => g.isActive).map((g) => g.id));
  }, [gearItems]);
  if (kits.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleText}>Your Kits</span>
          <button
            onClick={onCreateKit}
            className={styles.addIcon}
            title="Add a new kit"
            type="button"
          >
            +
          </button>
        </h2>
        <div className={cardStyles.card}>
          <p className={styles.emptyState}>
            No kits yet. Create one to get started.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionTitleText}>Your Kits</span>
        <button
          onClick={onCreateKit}
          className={styles.addIcon}
          title="Add a new kit"
          type="button"
        >
          +
        </button>
      </h2>
      <div className={styles.kitsGrid}>
        {kits.map((kit) => {
          const activeItemCount = kit.kitItems.filter((ki) =>
            activeGearIds.has(ki.gearItemId)
          ).length;
          return (
            <div
              key={kit.id}
              className={`${cardStyles.card} ${styles.kitCard}`}
              style={{ position: "relative" }}
            >
              {/* Top-right: Edit and Delete icons */}
              <div className={styles.kitActionsTop}>
                <button
                  onClick={() => onEditKit(kit)}
                  className={styles.iconButton}
                  title="Edit kit"
                  type="button"
                  aria-label="Edit kit"
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
                  onClick={() => onDeleteKit(kit.id)}
                  className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                  title="Delete kit"
                  type="button"
                  aria-label="Delete kit"
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
              {!kit.isDefault && (
                <div className={styles.kitActionsBottom}>
                  <button
                    onClick={() => onSetDefaultKit(kit.id)}
                    className={buttonStyles.ghost}
                  >
                    Set default
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
