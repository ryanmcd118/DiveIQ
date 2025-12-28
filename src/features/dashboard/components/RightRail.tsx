"use client";

import Link from "next/link";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./RightRail.module.css";

interface RightRailProps {
  gearCount?: number;
  certCount?: number;
}

export function RightRail({ gearCount = 0, certCount = 0 }: RightRailProps) {
  return (
    <aside className={styles.rightRail}>
      {/* Quick actions */}
      <div className={`${cardStyles.card} ${cardStyles.cardCompact} ${styles.card}`}>
        <h3 className={cardStyles.title}>Quick actions</h3>
        <div className={styles.actions}>
          <Link href="/dive-plans" className={buttonStyles.ghost}>
            Plan a dive
          </Link>
          <Link href="/dive-logs" className={buttonStyles.ghost}>
            Log a dive
          </Link>
          <button className={buttonStyles.disabled} disabled title="Coming soon">
            Import from dive computer (coming soon)
          </button>
        </div>
      </div>

      {/* Setup checklist */}
      <div className={`${cardStyles.card} ${cardStyles.cardCompact} ${styles.card}`}>
        <h3 className={cardStyles.title}>Setup checklist</h3>
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

      {/* Gear & certifications snapshot */}
      <div className={`${cardStyles.card} ${cardStyles.cardCompact} ${styles.card}`}>
        <h3 className={cardStyles.title}>Gear & certifications</h3>
        <div className={styles.snapshot}>
          <div className={styles.snapshotItem}>
            <span className={styles.snapshotLabel}>Gear</span>
            <span className={styles.snapshotValue}>
              {gearCount} item{gearCount !== 1 ? "s" : ""} tracked
              {gearCount === 0 && " (coming soon)"}
            </span>
          </div>
          <div className={styles.snapshotItem}>
            <span className={styles.snapshotLabel}>Certifications</span>
            <span className={styles.snapshotValue}>
              {certCount} on file
              {certCount === 0 && " (coming soon)"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

