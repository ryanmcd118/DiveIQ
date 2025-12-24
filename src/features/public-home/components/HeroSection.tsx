"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./PublicHomePage.module.css";

export function HeroSection() {
  return (
    <section className={`${styles.section} ${styles.hero}`}>
      <div className={styles.heroGrid}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            <span className={styles.heroHeadlineLine}>
              Diving is complicated.
            </span>
            <span
              className={`${styles.heroHeadlineLine} ${styles.heroHeadlineAccent}`}
            >
              Your tools shouldn&apos;t be.
            </span>
          </h1>

          <p className={styles.heroSubheadline}>
            DiveIQ simplifies how you plan dives, log details, manage your gear,
            and revisit your favorites, all in one place. Built by divers, for
            divers.
          </p>

          <p className={styles.heroSubheadline}>
            Think through a dive before you get wet, and remember it long after
            you&apos;re dry.
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
          <Image
            src="/hero_image.jpg"
            alt="DiveIQ Planner UI"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={styles.heroImage}
            priority
          />
          <div className={styles.heroImageOverlay} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
