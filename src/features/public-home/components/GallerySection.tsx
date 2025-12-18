"use client";

import styles from "./PublicHomePage.module.css";

const galleryItems = [
  {
    header: "Dial in your next dive.",
    subtext: "A clear, simple way to plan — depth, time, conditions, gear, notes.",
    placeholder: "Screenshot Placeholder: Dive Planning Interface",
    reverse: false,
  },
  {
    header: "Keep the important dives close.",
    subtext:
      "Your history, organized. Track dives and revisit the ones you'll never forget.",
    placeholder: "Screenshot Placeholder: Dive Logbook View",
    reverse: true,
  },
  {
    header: "Plan with more context.",
    subtext: "Explore sites and prep for new water with less guesswork.",
    placeholder: "Screenshot Placeholder: Dive Site Browser",
    reverse: false,
  },
];

export function GallerySection() {
  return (
    <section className={`${styles.section} ${styles.gallerySection}`}>
      {galleryItems.map((item, index) => (
        <div
          key={index}
          className={item.reverse ? styles.galleryBlockReverse : styles.galleryBlock}
        >
          <div className={styles.placeholderGallery}>
            <span className={styles.placeholderLabel}>{item.placeholder}</span>
          </div>

          <div className={styles.galleryContent}>
            <h3 className={styles.galleryTitle}>{item.header}</h3>
            <p className={styles.gallerySubtext}>{item.subtext}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

