"use client";

import styles from "../feature-error.module.css";

export default function GearError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          ⚠
        </div>
        <h2 className={styles.heading}>Couldn&apos;t load your gear</h2>
        <p className={styles.message}>
          Something went wrong loading this page. Please try again.
        </p>
        <button className={styles.button} onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
