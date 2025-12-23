"use client";

import styles from "./PublicHomePage.module.css";

// const features = [
//   {
//     icon: "/feature-icon_checklist.svg",
//     title: "Plan dives the way divers actually do.",
//     body: "A clean space to think through depth, time, gas, and conditions with an experienced AI dive buddy.",
//   },
//   {
//     icon: "/feature-icon_logbook.svg",
//     title: "A logbook you won't lose or forget.",
//     body: "Record depth, time, gear, conditions, and notes, while watching your progress unfold over time.",
//   },
//   {
//     icon: "/feature-icon_map.svg",
//     title: "Know the site before you splash.",
//     body: "Browse locations, compare notes, and build plans with more context.",
//   },
// ];

const features = [
  {
    icon: "/feature-icon_checklist.svg",
    title: "Dive planning, done right.",
    body: "Think through depth, time, gas, and conditions in a clear workflow, so you're confident before you ever hit the water.",
  },
  {
    icon: "/feature-icon_logbook.svg",
    title: "Your dive log, all in one place.",
    body: "Record details of your dives and gear without scattered logbooks, so you can easily relive your favorites.",
  },
  {
    icon: "/feature-icon_map.svg",
    title: "Know the site before you splash.",
    body: "Browse dive sites while learning from other divers and AI insights, so you're prepared for your next adventure.",
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
