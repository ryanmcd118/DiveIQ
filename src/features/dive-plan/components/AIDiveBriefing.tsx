"use client";

import type { AIBriefing, ConditionBadge } from "../types";
import styles from "./AIDiveBriefing.module.css";

type AIDiveBriefingProps = {
  briefing: AIBriefing | null;
  summary?: string;
  riskLevel?: string;
  loading?: boolean;
  compact?: boolean;
  scrollable?: boolean;
  plannedDepthCm?: number;
  userCerts?: string[];
  highestCertOverride?: string;
};

// ── Cert card helpers ──────────────────────────────────────────────────────

type CertQualifier = "ow" | "aow" | "deep" | "tech";

function getRequiredCert(depthCm: number): {
  level: string;
  qualifier: CertQualifier;
} {
  const depthM = depthCm / 100;
  if (depthM <= 18) return { level: "Open Water", qualifier: "ow" };
  if (depthM <= 30) return { level: "Adv. Open Water", qualifier: "aow" };
  if (depthM <= 40) return { level: "Deep Specialty", qualifier: "deep" };
  return { level: "Technical", qualifier: "tech" };
}

function checkQualification(
  qualifier: CertQualifier,
  userCerts: string[]
): boolean {
  if (qualifier === "tech") return false;

  const lower = userCerts.map((c) => c.toLowerCase());

  const hasDeepOrTech = lower.some(
    (n) =>
      n.includes("deep specialty") ||
      n.includes("technical") ||
      n.includes("trimix") ||
      n.includes("cave") ||
      n.includes("sidemount")
  );
  if (hasDeepOrTech) return true;

  const hasAOW = lower.some(
    (n) =>
      n.includes("advanced open water") ||
      n.includes("aow") ||
      (n.includes("advanced") && n.includes("water"))
  );
  if (hasAOW && (qualifier === "ow" || qualifier === "aow")) return true;

  const hasOW = lower.some(
    (n) => (n.includes("open water") || n === "ow") && !n.includes("advanced")
  );
  if (hasOW && qualifier === "ow") return true;

  return false;
}

function checkQualificationByOverride(
  qualifier: CertQualifier,
  override: string
): boolean | null {
  if (qualifier === "tech") return false;
  const lower = override.toLowerCase();
  const hasDeep = lower.includes("deep");
  const hasAOW = lower.includes("advanced") || lower.includes("aow");
  const hasOW = lower.includes("open water") && !lower.includes("advanced");
  if (hasDeep) return true; // qualifies up to 130ft/40m
  if (hasAOW && (qualifier === "ow" || qualifier === "aow")) return true;
  if (hasOW && qualifier === "ow") return true;
  if (hasAOW || hasOW || hasDeep) return false; // known cert but doesn't qualify
  return null; // cert string unrecognized
}

// ── Condition badge ────────────────────────────────────────────────────────

function conditionBadgeClass(badge: ConditionBadge): string | null {
  if (!badge) return null;
  if (badge === "seasonal") return styles.conditionBadgeSeasonal;
  if (badge === "forecast") return styles.conditionBadgeForecast;
  if (badge === "inferred") return styles.conditionBadgeInferred;
  return null;
}

// ── Risk badge style ───────────────────────────────────────────────────────

function riskBadgeStyle(risk: string): { background: string; color: string } {
  if (risk === "Low")
    return { background: "rgba(16,185,129,0.15)", color: "#6ee7b7" };
  if (risk === "High")
    return { background: "rgba(249,115,22,0.15)", color: "#fdba74" };
  if (risk === "Extreme")
    return { background: "rgba(239,68,68,0.15)", color: "#fca5a5" };
  return { background: "rgba(245,158,11,0.15)", color: "#fcd34d" };
}

// ── Skeleton ───────────────────────────────────────────────────────────────

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
        <div className={styles.skeletonConditionCard} />
      </div>

      <div className={styles.skeletonBeforeYouDive} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        }}
      >
        <div
          className={styles.skeletonSection}
          style={{ height: "1rem", width: "90%" }}
        />
        <div
          className={styles.skeletonSection}
          style={{ height: "1rem", width: "75%" }}
        />
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

// ── Static section ─────────────────────────────────────────────────────────

function StaticSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className={styles.sectionItem}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{title}</span>
      </div>
      <div className={styles.sectionContent}>
        <ul className={styles.sectionBullets}>
          {items.map((item, i) => (
            <li key={i} className={styles.sectionBullet}>
              <span className={styles.sectionBulletDot} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function AIDiveBriefing({
  briefing,
  summary,
  riskLevel,
  loading = false,
  scrollable = false,
  plannedDepthCm,
  userCerts,
  highestCertOverride,
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

  // Defensive fallbacks — old-schema DB records have none of these fields
  const conditions = briefing.conditions ?? {
    waterTemp: { value: "—", badge: null as ConditionBadge },
    visibility: { value: "—", badge: null as ConditionBadge },
    seaState: { value: "—", badge: null as ConditionBadge },
  };
  const bottomLine = briefing.bottomLine ?? "";
  const keyConsiderations = briefing.keyConsiderations ?? [];
  const siteConditions = briefing.siteConditions ?? [];
  const hazards = briefing.hazards ?? [];
  const experienceNotes = briefing.experienceNotes ?? [];
  const gearNotes = briefing.gearNotes ?? [];

  const SECTIONS = [
    { title: "Site conditions", data: siteConditions },
    { title: "Hazards", data: hazards },
    { title: "For your experience level", data: experienceNotes },
    { title: "Gear notes", data: gearNotes },
  ];

  const showHeader = riskLevel || summary;

  // Cert card
  const certInfo =
    plannedDepthCm !== undefined ? getRequiredCert(plannedDepthCm) : null;
  const qualified: boolean | null = (() => {
    if (!certInfo) return null;
    if (userCerts && userCerts.length > 0) {
      return checkQualification(certInfo.qualifier, userCerts);
    }
    if (highestCertOverride) {
      return checkQualificationByOverride(
        certInfo.qualifier,
        highestCertOverride
      );
    }
    return null;
  })();

  return (
    <div className={containerClass}>
      {/* Header row: risk badge + summary */}
      {showHeader && (
        <div className={styles.briefingHeaderRow}>
          {riskLevel && (
            <span
              className={styles.riskBadge}
              style={riskBadgeStyle(riskLevel)}
            >
              {riskLevel} risk
            </span>
          )}
          {summary && <p className={styles.summaryText}>{summary}</p>}
        </div>
      )}

      {/* Condition cards strip */}
      <div className={styles.conditionCardsRow}>
        <div className={styles.conditionCard}>
          <span className={styles.conditionCardLabel}>Water Temp</span>
          <span className={styles.conditionCardValue}>
            {conditions.waterTemp.value}
          </span>
          {conditions.waterTemp.badge && (
            <span
              className={conditionBadgeClass(conditions.waterTemp.badge) ?? ""}
            >
              {conditions.waterTemp.badge}
            </span>
          )}
        </div>
        <div className={styles.conditionCard}>
          <span className={styles.conditionCardLabel}>Visibility</span>
          <span className={styles.conditionCardValue}>
            {conditions.visibility.value}
          </span>
          {conditions.visibility.badge && (
            <span
              className={conditionBadgeClass(conditions.visibility.badge) ?? ""}
            >
              {conditions.visibility.badge}
            </span>
          )}
        </div>
        <div className={styles.conditionCard}>
          <span className={styles.conditionCardLabel}>Sea State</span>
          <span className={styles.conditionCardValue}>
            {conditions.seaState.value}
          </span>
          {conditions.seaState.badge && (
            <span
              className={conditionBadgeClass(conditions.seaState.badge) ?? ""}
            >
              {conditions.seaState.badge}
            </span>
          )}
        </div>
        {/* Cert card */}
        <div className={styles.conditionCard}>
          <span className={styles.conditionCardLabel}>Certification</span>
          {certInfo ? (
            <>
              <span className={styles.conditionCardValue}>
                {certInfo.level}
              </span>
              {qualified === true && (
                <span className={styles.certQualified}>✓ Qualified</span>
              )}
              {(qualified === false || qualified === null) && (
                <span className={styles.certVerify}>✕ Verify cert</span>
              )}
            </>
          ) : (
            <span
              className={styles.conditionCardValue}
              style={{ color: "var(--color-text-disabled)" }}
            >
              —
            </span>
          )}
        </div>
      </div>

      {/* Before you dive callout */}
      <div className={styles.beforeYouDiveBlock}>
        <span className={styles.beforeYouDiveLabel}>Before you dive</span>
        <p className={styles.beforeYouDiveText}>{bottomLine}</p>
      </div>

      {/* Key considerations */}
      {keyConsiderations.length > 0 && (
        <div className={styles.keyConsiderationsBlock}>
          <span className={styles.keyConsiderationsLabel}>
            Key considerations
          </span>
          <ul className={styles.sectionBullets}>
            {keyConsiderations.map((item, i) => (
              <li key={i} className={styles.sectionBullet}>
                <span className={styles.sectionBulletDot} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.divider} />

      {/* Static sections */}
      <div className={styles.sectionsContainer}>
        {SECTIONS.map((section) => (
          <StaticSection
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
