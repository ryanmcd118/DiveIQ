"use client";

import { useState } from "react";
import styles from "./AccordionSection.module.css";

interface AccordionSectionProps {
  id: string;
  title: string;
  summary?: string | null;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccordionSection({
  id,
  title,
  summary,
  defaultOpen = false,
  children,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={styles.section} aria-labelledby={`${id}-heading`}>
      <button
        type="button"
        id={`${id}-heading`}
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
      >
        <span className={styles.triggerTitle}>{title}</span>
        {summary && (
          <span className={styles.triggerSummary}>{summary}</span>
        )}
        <span className={styles.chevron} aria-hidden>
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <div
        id={`${id}-content`}
        className={`${styles.content} ${isOpen ? styles.contentOpen : ""}`}
        aria-hidden={!isOpen}
      >
        <div className={styles.contentInner}>{children}</div>
      </div>
    </section>
  );
}
