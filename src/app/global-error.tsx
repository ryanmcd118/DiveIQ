"use client";

import styles from "./global-error.module.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.icon} aria-hidden="true">
              ⚠
            </div>
            <h1 className={styles.heading}>Something went wrong</h1>
            <p className={styles.message}>
              An unexpected error occurred. Please try again.
            </p>
            <button className={styles.button} onClick={() => reset()}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
