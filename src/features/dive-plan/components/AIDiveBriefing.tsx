"use client";

import { useState } from "react";
import type { AIBriefing, ConditionBadge } from "../types";
import styles from "./AIDiveBriefing.module.css";

type AIDiveBriefingProps = {
  briefing: AIBriefing | null;
  summary?: string;
  riskLevel?: string;
  loading?: boolean;
  compact?: boolean;
  scrollable?: boolean;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={open ? styles.sectionChevronOpen : styles.sectionChevron}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function riskBadgeStyle(risk: string): { background: string; color: string } {
  if (risk === "Low")
    return { background: "rgba(16,185,129,0.15)", color: "#6ee7b7" };
  if (risk === "High")
    return { background: "rgba(239,68,68,0.15)", color: "#fca5a5" };
  return { background: "rgba(245,158,11,0.15)", color: "#fcd34d" };
}

function conditionBadgeClass(badge: ConditionBadge): string | null {
  if (!badge) return null;
  if (badge === "seasonal") return styles.conditionBadgeSeasonal;
  if (badge === "forecast") return styles.conditionBadgeForecast;
  if (badge === "inferred") return styles.conditionBadgeInferred;
  return null;
}

function BriefingSkeleton({ scrollable }: { scrollable?: boolean }) {
  const containerClass = scrollable
    ? styles.briefingContainerScrollable
    : styles.briefingContainer;

  return (
    <div className={containerClass}>
      <div className={styles.skeletonConditionCards}>
        <div className={styles.skeletonConditionCard} />
        <div className={styles.skeletonConditionCard} />
        <div className={styles.skeletonConditionCard} />
      </div>

      <div className={styles.skeletonBottomLine} />

      <div
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}
      >
        <div className={styles.skeletonSection} style={{ height: "1rem", width: "90%" }} />
        <div className={styles.skeletonSection} style={{ height: "1rem", width: "75%" }} />
      </div>

      <div className={styles.sectionsContainer}>
        <div className={styles.skeletonSection} />
        <div className={styles.skeletonSection} />
        <div className={styles.skeletonSection} />
        <div className={styles.skeletonSection} />
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.sectionItem}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.sectionTitleRow}>
          <span className={styles.sectionTitle}>{title}</span>
        </div>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && (
        <div className={styles.sectionContent}>
          {items.length === 0 ? (
            <p className={styles.sectionParagraph} style={{ color: "var(--color-text-disabled)" }}>
              No specific notes for this section.
            </p>
          ) : (
            <ul className={styles.sectionBullets}>
              {items.map((item, i) => (
                <li key={i} className={styles.sectionBullet}>
                  <span className={styles.sectionBulletDot} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function AIDiveBriefing({
  briefing,
  summary,
  riskLevel,
  loading = false,
  scrollable = false,
}: AIDiveBriefingProps) {
  const containerClass = scrollable
    ? styles.briefingContainerScrollable
    : styles.briefingContainer;

  if (loading) {
    return <BriefingSkeleton scrollable={scrollable} />;
  }

  if (!briefing) {
    return null;
  }

  const SECTIONS = [
    { title: "Site conditions", data: briefing.siteConditions },
    { title: "Hazards", data: briefing.hazards },
    { title: "For your experience level", data: briefing.experienceNotes },
    { title: "Gear notes", data: briefing.gearNotes },
  ];

  const showHeader = riskLevel || summary;

  return (
    <div className={containerClass}>
      {/* Header row: risk badge + summary */}
      {showHeader && (
        <div className={styles.briefingHeaderRow}>
          {riskLevel && (
            <span className={styles.riskBadge} style={riskBadgeStyle(riskLevel)}>
              {riskLevel}
            </span>
          )}
          {summary && (
            <p className={styles.summaryText}>{summary}</p>
          )}
        </div>
      )}

      {/* Condition cards strip */}
      <div className={styles.conditionCardsRow}>
        <div className={styles.conditionCard}>
          <span className={styles.conditionCardLabel}>Water Temp</span>
          <span className={styles.conditionCardValue}>
            {briefing.conditions.waterTemp.value}
          </span>
          {briefing.conditions.waterTemp.badge && (
            <span className={conditionBadgeClass(briefing.conditions.waterTemp.badge) ?? ""}>
              {briefing.conditions.waterTemp.badge}
            </span>
          )}
        </div>
        <div className={styles.conditionCard}>
          <span className={styles.conditionCardLabel}>Visibility</span>
          <span className={styles.conditionCardValue}>
            {briefing.conditions.visibility.value}
          </span>
          {briefing.conditions.visibility.badge && (
            <span className={conditionBadgeClass(briefing.conditions.visibility.badge) ?? ""}>
              {briefing.conditions.visibility.badge}
            </span>
          )}
        </div>
        <div className={styles.conditionCard}>
          <span className={styles.conditionCardLabel}>Sea State</span>
          <span className={styles.conditionCardValue}>
            {briefing.conditions.seaState.value}
          </span>
          {briefing.conditions.seaState.badge && (
            <span className={conditionBadgeClass(briefing.conditions.seaState.badge) ?? ""}>
              {briefing.conditions.seaState.badge}
            </span>
          )}
        </div>
      </div>

      {/* Bottom line callout */}
      <div className={styles.bottomLineBlock}>
        <span className={styles.bottomLineLabel}>The bottom line</span>
        <p className={styles.bottomLineText}>{briefing.bottomLine}</p>
      </div>

      {/* Key considerations */}
      {briefing.keyConsiderations.length > 0 && (
        <div className={styles.keyConsiderationsBlock}>
          <span className={styles.keyConsiderationsLabel}>Key considerations</span>
          <ul className={styles.sectionBullets}>
            {briefing.keyConsiderations.map((item, i) => (
              <li key={i} className={styles.sectionBullet}>
                <span className={styles.sectionBulletDot} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.divider} />

      {/* Accordion sections */}
      <div className={styles.sectionsContainer}>
        {SECTIONS.map((section) => (
          <AccordionSection
            key={section.title}
            title={section.title}
            items={section.data}
          />
        ))}
      </div>
    </div>
  );
}

export { BriefingSkeleton };
