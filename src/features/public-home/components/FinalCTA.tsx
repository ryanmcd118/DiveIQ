"use client";

import Link from "next/link";
import styles from "./PublicHomePage.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

export function FinalCTA() {
  return (
    <section className={`${styles.section} ${styles.finalCta}`}>
      <h2 className={styles.finalCtaTitle}>Where are you diving next?</h2>
      <div className={styles.finalCtaButtons}>
        <Link href="/dive-plans" className={buttonStyles.primaryGradient}>
          Start a Dive Plan →
        </Link>
        <Link href="/signup" className={buttonStyles.secondaryText}>
          Create a Free Account
        </Link>
      </div>
    </section>
  );
}

