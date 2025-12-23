"use client";

import styles from "./PublicHomePage.module.css";

const features = [
  {
    icon: "/feature-icon_checklist.svg",
    title: "Plan dives the way divers actually do.",
    body: "A clean space to think through depth, time, gas, and conditions with an experienced AI dive buddy.",
  },
  {
    icon: "/feature-icon_logbook.svg",
    title: "A logbook you won't lose or forget.",
    body: "Record depth, time, gear, conditions, and notes, while watching your progress unfold over time.",
  },
  {
    icon: "/feature-icon_map.svg",
    title: "Know the site before you splash.",
    body: "Browse locations, compare notes, and build plans with more context.",
  },
];

export function FeatureTrio() {
  return (
    <section className={`${styles.section} ${styles.featureTrio}`}>
      <div className={styles.featureGrid}>
        {features.map((feature) => (
          <article key={feature.title} className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true">
              <img src={feature.icon} alt="" />
            </div>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureBody}>{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
