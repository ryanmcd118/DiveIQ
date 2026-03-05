"use client";

import { useState } from "react";
import styles from "./LogbookForm.module.css";

interface AccordionSectionProps {
  id: string;
  title: string;
  summary?: string | null;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span className={`${styles.accordionChevron} ${open ? styles.accordionChevronOpen : ""}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
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
    <section className={styles.sectionCard} aria-labelledby={`${id}-heading`}>
      <button
        type="button"
        id={`${id}-heading`}
        className={styles.accordionHeader}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
      >
        <span className={styles.title}>{title}</span>
        {summary && !isOpen && (
          <span className={styles.accordionSummary}>{summary}</span>
        )}
        <ChevronIcon open={isOpen} />
      </button>
      {isOpen && (
        <div
          id={`${id}-content`}
          className={styles.sectionBody}
          role="region"
          aria-labelledby={`${id}-heading`}
        >
          {children}
        </div>
      )}
    </section>
  );
}
