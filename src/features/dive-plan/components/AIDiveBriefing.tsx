"use client";

import { useState } from "react";
import type { AIBriefing, SourceTag } from "../types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { formatTemperatureRange, formatDistanceRange } from "@/lib/units";
import styles from "./AIDiveBriefing.module.css";

type AIDiveBriefingMode = "public" | "authed";

type AIDiveBriefingProps = {
  mode?: AIDiveBriefingMode;
  briefing: AIBriefing | null;
  loading?: boolean;
  /** Compact mode for preview (shows highlights instead of full sections) */
  compact?: boolean;
  /** Show expandable sections even in compact mode */
  showExpander?: boolean;
  /** Scrollable mode - removes outer border/radius for use inside scroll containers */
  scrollable?: boolean;
};

// Chevron icon component
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

// Source tag badge component
function SourceTagBadge({ tag }: { tag: SourceTag }) {
  const tagClass = {
    Forecast: styles.sourceTagForecast,
    Seasonal: styles.sourceTagSeasonal,
    Inferred: styles.sourceTagInferred,
  }[tag];

  return <span className={tagClass}>{tag}</span>;
}

// Difficulty chip styling helper
function getDifficultyChipClass(difficulty: string): string {
  const lowerDiff = difficulty.toLowerCase();
  if (lowerDiff.includes("easy")) return styles.chipDifficultyEasy;
  if (lowerDiff.includes("moderate")) return styles.chipDifficultyModerate;
  if (lowerDiff.includes("challenging"))
    return styles.chipDifficultyChallenging;
  if (lowerDiff.includes("advanced")) return styles.chipDifficultyAdvanced;
  return styles.chip;
}

// Confidence level styling helper
function getConfidenceClass(level: string): string {
  const lowerLevel = level.toLowerCase();
  if (lowerLevel === "high") return styles.confidenceHigh;
  if (lowerLevel === "medium") return styles.confidenceMedium;
  return styles.confidenceLow;
}

// Skeleton Loading State
function BriefingSkeleton({
  compact,
  scrollable,
}: {
  compact?: boolean;
  scrollable?: boolean;
}) {
  const containerClass = scrollable
    ? compact
      ? styles.briefingContainerScrollableCompact
      : styles.briefingContainerScrollable
    : compact
      ? styles.briefingContainerCompact
      : styles.briefingContainer;

  return (
    <div className={containerClass}>
      {/* Skeleton snapshot */}
      <div className={styles.skeletonSnapshot} />

      {/* Skeleton chips */}
      <div className={styles.quickLookContainer}>
        <div className={styles.skeletonChip} />
        <div className={styles.skeletonChipWide} />
        <div className={styles.skeletonChip} />
        <div className={styles.skeletonChip} />
        <div className={styles.skeletonChip} />
        <div className={styles.skeletonChipWide} />
      </div>

      {/* Skeleton what matters */}
      <div className={styles.skeletonWhatMatters} />

      {/* Skeleton sections or highlights */}
      {compact ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <div className={styles.skeletonHighlight} style={{ width: "90%" }} />
          <div className={styles.skeletonHighlight} style={{ width: "85%" }} />
          <div className={styles.skeletonHighlight} style={{ width: "75%" }} />
        </div>
      ) : (
        <div className={styles.sectionsContainer}>
          <div className={styles.skeletonSection} />
          <div className={styles.skeletonSection} />
          <div className={styles.skeletonSection} />
          <div className={styles.skeletonSection} />
          <div className={styles.skeletonSection} />
        </div>
      )}
    </div>
  );
}

// Quick Look Chips
function QuickLookChips({
  quickLook,
  mode = "authed",
}: {
  quickLook: AIBriefing["quickLook"];
  mode?: AIDiveBriefingMode;
}) {
  // Use guest mode for public pages so it updates live on toggle changes
  const unitMode = mode === "public" ? "guest" : "authed";
  const { prefs } = useUnitPreferences({ mode: unitMode });

  // Format temperature and visibility using canonical numeric values if available
  const waterTempDisplay = quickLook.waterTemp.numericValue
    ? formatTemperatureRange(
        quickLook.waterTemp.numericValue,
        prefs.temperature
      )
    : quickLook.waterTemp.value; // Fallback to original string if no numeric value

  const visibilityDisplay = quickLook.visibility.numericValue
    ? formatDistanceRange(quickLook.visibility.numericValue, prefs.depth)
    : quickLook.visibility.value; // Fallback to original string if no numeric value

  return (
    <div className={styles.quickLookContainer}>
      {/* Difficulty */}
      <div className={getDifficultyChipClass(quickLook.difficulty.value)}>
        <span className={styles.chipLabel}>Difficulty</span>
        <span className={styles.chipValue}>{quickLook.difficulty.value}</span>
        {quickLook.difficulty.reason && (
          <span className={styles.chipReason}>
            {quickLook.difficulty.reason}
          </span>
        )}
      </div>

      {/* Suggested Experience */}
      <div className={styles.chip}>
        <span className={styles.chipLabel}>Experience</span>
        <span className={styles.chipValue}>
          {quickLook.suggestedExperience.value}
        </span>
      </div>

      {/* Water Temp */}
      <div className={styles.chip}>
        <span className={styles.chipLabel}>Water Temp</span>
        <span className={styles.chipValue}>
          {waterTempDisplay}
          {quickLook.waterTemp.sourceTag && (
            <SourceTagBadge tag={quickLook.waterTemp.sourceTag} />
          )}
        </span>
      </div>

      {/* Visibility */}
      <div className={styles.chip}>
        <span className={styles.chipLabel}>Visibility</span>
        <span className={styles.chipValue}>
          {visibilityDisplay}
          {quickLook.visibility.sourceTag && (
            <SourceTagBadge tag={quickLook.visibility.sourceTag} />
          )}
        </span>
      </div>

      {/* Sea State / Wind */}
      <div className={styles.chip}>
        <span className={styles.chipLabel}>Sea State</span>
        <span className={styles.chipValue}>
          {quickLook.seaStateWind.value}
          {quickLook.seaStateWind.sourceTag && (
            <SourceTagBadge tag={quickLook.seaStateWind.sourceTag} />
          )}
        </span>
      </div>

      {/* Confidence */}
      <div className={styles.chipConfidence}>
        <span className={styles.chipLabel}>Confidence</span>
        <span
          className={`${styles.chipValue} ${getConfidenceClass(quickLook.confidence.level)}`}
        >
          {quickLook.confidence.level}
        </span>
        {quickLook.confidence.reason && (
          <span className={styles.chipReason}>
            {quickLook.confidence.reason}
          </span>
        )}
      </div>
    </div>
  );
}

// Accordion Section Item
function AccordionSection({
  section,
  defaultOpen = false,
}: {
  section: AIBriefing["sections"][0];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hasContent =
    (section.bullets && section.bullets.length > 0) ||
    (section.paragraphs && section.paragraphs.length > 0);

  if (!hasContent) return null;

  return (
    <div className={styles.sectionItem}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.sectionTitleRow}>
          <span className={styles.sectionTitle}>{section.title}</span>
          {section.sourceTags && section.sourceTags.length > 0 && (
            <div className={styles.sectionSourceTags}>
              {section.sourceTags.map((tag, i) => (
                <SourceTagBadge key={i} tag={tag} />
              ))}
            </div>
          )}
        </div>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && (
        <div className={styles.sectionContent}>
          {section.bullets && section.bullets.length > 0 && (
            <ul className={styles.sectionBullets}>
              {section.bullets.map((bullet, i) => (
                <li key={i} className={styles.sectionBullet}>
                  <span className={styles.sectionBulletDot} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
          {section.paragraphs && section.paragraphs.length > 0 && (
            <>
              {section.paragraphs.map((para, i) => (
                <p key={i} className={styles.sectionParagraph}>
                  {para}
                </p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Highlights list (for compact/preview mode)
function HighlightsList({ highlights }: { highlights: string[] }) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <ul className={styles.highlightsList}>
      {highlights.slice(0, 3).map((highlight, i) => (
        <li key={i} className={styles.highlightItem}>
          <span className={styles.highlightBullet} />
          <span>{highlight}</span>
        </li>
      ))}
    </ul>
  );
}

// Main Component
export function AIDiveBriefing({
  mode = "authed",
  briefing,
  loading = false,
  compact = false,
  showExpander = false,
  scrollable = false,
}: AIDiveBriefingProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return <BriefingSkeleton compact={compact} scrollable={scrollable} />;
  }

  if (!briefing) {
    return null;
  }

  const containerClass = scrollable
    ? compact
      ? styles.briefingContainerScrollableCompact
      : styles.briefingContainerScrollable
    : compact
      ? styles.briefingContainerCompact
      : styles.briefingContainer;

  return (
    <div className={containerClass}>
      {/* Briefing Header */}
      <div className={styles.briefingHeader}>
        {/* Conditions Snapshot */}
        <div className={styles.conditionsSnapshot}>
          {briefing.conditionsSnapshot}
        </div>

        {/* Quick Look Chips */}
        <QuickLookChips quickLook={briefing.quickLook} mode={mode} />

        {/* What Matters Most */}
        <div className={styles.whatMattersMost}>
          <span className={styles.whatMattersLabel}>
            What matters most on this dive
          </span>
          {briefing.whatMattersMost}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Compact mode: show highlights */}
      {compact && !expanded && (
        <>
          <HighlightsList highlights={briefing.highlights} />

          {showExpander &&
            briefing.sections &&
            briefing.sections.length > 0 && (
              <button
                type="button"
                className={styles.expanderButton}
                onClick={() => setExpanded(true)}
              >
                <span>See full briefing</span>
                <ChevronIcon open={false} />
              </button>
            )}
        </>
      )}

      {/* Full mode or expanded: show accordion sections */}
      {(!compact || expanded) &&
        briefing.sections &&
        briefing.sections.length > 0 && (
          <div className={styles.sectionsContainer}>
            {briefing.sections.map((section, i) => (
              <AccordionSection key={i} section={section} />
            ))}

            {expanded && (
              <button
                type="button"
                className={styles.expanderButton}
                onClick={() => setExpanded(false)}
              >
                <span>Show less</span>
                <svg
                  className={styles.expanderIconOpen}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
          </div>
        )}
    </div>
  );
}

// Re-export skeleton for use in loading states
export { BriefingSkeleton };
