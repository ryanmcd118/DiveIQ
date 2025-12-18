"use client";

import Link from "next/link";
import styles from "./PublicHomePage.module.css";

export function HeroSection() {
  return (
    <section className={`${styles.section} ${styles.hero}`}>
      <div className={styles.heroGrid}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            Plan better dives.{" "}
            <span className={styles.heroHeadlineAccent}>
              Remember the ones that matter.
            </span>
          </h1>

          <p className={styles.heroSubheadline}>
            Modern dive planning and logging — built by divers who wanted
            something better.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/dive-plans" className={styles.ctaPrimary}>
              Start a Dive Plan →
            </Link>
            <Link href="/signup" className={styles.ctaSecondary}>
              Create a Free Account
            </Link>
          </div>
        </div>

        <div className={styles.heroImageContainer}>
          <div className={styles.placeholderHero}>
            <span className={styles.placeholderLabel}>
              Screenshot Placeholder: Planner UI
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

