"use client";

import Link from "next/link";
import styles from "./PublicHomePage.module.css";

export function FinalCTA() {
  return (
    <section className={`${styles.section} ${styles.finalCta}`}>
      <h2 className={styles.finalCtaTitle}>Where are you diving next?</h2>
      <div className={styles.finalCtaButtons}>
        <Link href="/dive-plans" className={styles.ctaPrimary}>
          Start a Dive Plan →
        </Link>
        <Link href="/signup" className={styles.ctaSecondary}>
          Create a Free Account
        </Link>
      </div>
    </section>
  );
}

