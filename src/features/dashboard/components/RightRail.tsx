"use client";

import Link from "next/link";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import { GearCard } from "./GearCard";
import { CertificationsCard } from "./CertificationsCard";
import styles from "./RightRail.module.css";

interface RightRailProps {
  gearCount?: number;
}

export function RightRail({ gearCount: _gearCount = 0 }: RightRailProps) {
  return (
    <aside className={styles.rightRail}>
      {/* Quick actions - Elevated primary action zone */}
      <div
        className={`${styles.card} ${styles.cardTier1} ${styles.quickActionsElevated}`}
      >
        <h3 className={styles.cardTitle}>Quick actions</h3>
        <div className={styles.actions}>
          <Link href="/plan" className={styles.primaryAction}>
            Plan a dive
          </Link>
          <Link href="/dive-logs" className={styles.secondaryAction}>
            Log a dive
          </Link>
          <button
            className={styles.disabledAction}
            disabled
            title="Coming soon"
          >
            Import from dive computer (coming soon)
          </button>
        </div>
      </div>

      {/* Setup checklist - Tier 3 */}
      <div className={`${styles.card} ${styles.cardTier3}`}>
        <h3 className={styles.cardTitle}>Setup checklist</h3>
        <p className={styles.checklistSubtitle}>Complete your profile</p>
        <ul className={styles.checklist}>
          <li>
            <Link href="/certifications" className={styles.checklistItem}>
              <span className={styles.checkbox} />
              <span>Add certifications</span>
            </Link>
          </li>
          <li>
            <Link href="/gear" className={styles.checklistItem}>
              <span className={styles.checkbox} />
              <span>Add primary gear</span>
            </Link>
          </li>
          <li>
            <Link href="/settings" className={styles.checklistItem}>
              <span className={styles.checkbox} />
              <span>Set default tank & gas</span>
            </Link>
          </li>
          <li>
            <Link href="/settings" className={styles.checklistItem}>
              <span className={styles.checkbox} />
              <span>Add emergency contact</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Gear Card - Tier 3 */}
      <GearCard />

      {/* Certifications - Tier 3 */}
      <CertificationsCard />
    </aside>
  );
}
