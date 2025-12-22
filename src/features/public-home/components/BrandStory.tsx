"use client";

import styles from "./PublicHomePage.module.css";

export function BrandStory() {
  return (
    <section className={`${styles.section} ${styles.brandSection}`}>
      <div className={styles.brandContainer}>
        <h2 className={styles.brandTitle}>
          Built by a diver who wanted something better.
        </h2>
        <p className={styles.brandBody}>
          DiveIQ started as a personal logbook experiment — too many paper logs,
          too many half-finished plans, too many tabs open before a trip. There
          wasn&apos;t a calm, modern space that reflected the way divers actually
          think. So I built one. A place to plan dives, log them, learn from
          them, and keep everything in one clean, simple space.
        </p>
        <div className={styles.brandDivider} />
      </div>
    </section>
  );
}

