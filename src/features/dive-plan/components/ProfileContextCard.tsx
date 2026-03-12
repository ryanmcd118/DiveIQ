"use client";

import { useState } from "react";
import type { ProfileContext } from "@/features/dive-plan/types";
import cardStyles from "@/styles/components/Card.module.css";
import styles from "./ProfileContextCard.module.css";

interface ProfileContextCardProps {
  profileContext: ProfileContext | null;
  loading: boolean;
  error: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isMoreThan6MonthsAgo(dateStr: string): boolean {
  const date = new Date(dateStr);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return date < sixMonthsAgo;
}

function buildSummaryText(
  ctx: ProfileContext | null,
  loading: boolean,
  error: string | null
): string {
  if (loading) return "Profile loading…";
  if (error) return "Profile context";
  if (
    !ctx ||
    (ctx.totalDives === 0 &&
      !ctx.lastDiveDate &&
      !ctx.experienceLevel &&
      ctx.certifications.length === 0 &&
      ctx.gear.length === 0)
  ) {
    return "Profile context · no data yet";
  }
  const parts: string[] = ["Personalized"];
  if (ctx.totalDives > 0) parts.push(`${ctx.totalDives} dives`);
  if (ctx.certifications.length > 0)
    parts.push(`${ctx.certifications.length} certs`);
  if (ctx.gear.length > 0) parts.push(`${ctx.gear.length} gear items`);
  return parts.join(" · ");
}

function ModalContent({ ctx }: { ctx: ProfileContext }) {
  const allAgencies = [...new Set(ctx.certifications.map((c) => c.agency))];
  const padiFirst = ["PADI", "SSI"];
  const orderedAgencies = [
    ...padiFirst.filter((a) => allAgencies.includes(a)),
    ...allAgencies.filter((a) => !padiFirst.includes(a)),
  ];

  const isEmpty =
    ctx.totalDives === 0 &&
    !ctx.lastDiveDate &&
    !ctx.experienceLevel &&
    !ctx.yearsDiving &&
    !ctx.homeDiveRegion &&
    ctx.primaryDiveTypes.length === 0 &&
    ctx.certifications.length === 0 &&
    ctx.gear.length === 0;

  if (isEmpty) {
    return (
      <p className={styles.emptyText}>
        Add your certifications, gear, and logbook entries to get personalized
        dive planning recommendations.
      </p>
    );
  }

  return (
    <div className={styles.modalColumns}>
      {/* Column 1: Dive Overview */}
      <div className={styles.modalColumn}>
        <p className={styles.columnTitle}>Dive Overview</p>

        {ctx.totalDives > 0 && (
          <div className={styles.row}>
            <span className={styles.label}>Total dives:</span>
            <span className={styles.value}>{ctx.totalDives}</span>
          </div>
        )}

        {ctx.lastDiveDate && (
          <div className={styles.row}>
            <span className={styles.label}>Last dive:</span>
            <span className={styles.value}>
              {formatDate(ctx.lastDiveDate)}
              {isMoreThan6MonthsAgo(ctx.lastDiveDate) && (
                <span
                  className={styles.warningIcon}
                  title="More than 6 months ago"
                >
                  {" "}
                  ⚠
                </span>
              )}
            </span>
          </div>
        )}

        {ctx.experienceLevel && (
          <div className={styles.row}>
            <span className={styles.label}>Experience:</span>
            <span className={styles.value}>{ctx.experienceLevel}</span>
          </div>
        )}

        {ctx.yearsDiving != null && (
          <div className={styles.row}>
            <span className={styles.label}>Years diving:</span>
            <span className={styles.value}>{ctx.yearsDiving}</span>
          </div>
        )}

        {ctx.homeDiveRegion && (
          <div className={styles.row}>
            <span className={styles.label}>Home region:</span>
            <span className={styles.value}>{ctx.homeDiveRegion}</span>
          </div>
        )}

        {ctx.primaryDiveTypes.length > 0 && (
          <div className={styles.row}>
            <span className={styles.label}>Dive types:</span>
            <span className={styles.value}>
              {ctx.primaryDiveTypes.join(", ")}
            </span>
          </div>
        )}

        <a href="/dive-logs" className={styles.editLink}>
          Edit dive history
        </a>
      </div>

      {/* Column 2: Certifications */}
      <div className={styles.modalColumn}>
        <p className={styles.columnTitle}>Certifications</p>
        {ctx.certifications.length === 0 ? (
          <p className={styles.noneText}>No certifications added</p>
        ) : (
          orderedAgencies.map((agency) => {
            const agencyCerts = ctx.certifications
              .filter((c) => c.agency === agency)
              .sort((a, b) => a.levelRank - b.levelRank);
            if (agencyCerts.length === 0) return null;
            return (
              <div key={agency} className={styles.agencyGroup}>
                <p className={styles.agencyLabel}>{agency}</p>
                <ul className={styles.certList}>
                  {agencyCerts.map((cert) => (
                    <li key={cert.slug} className={styles.certItem}>
                      {cert.name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}

        <a href="/certifications" className={styles.editLink}>
          Edit certifications
        </a>
      </div>

      {/* Column 3: Active Gear */}
      <div className={styles.modalColumn}>
        <p className={styles.columnTitle}>Active Gear</p>
        {ctx.gear.length === 0 ? (
          <p className={styles.noneText}>No gear added</p>
        ) : (
          <ul className={styles.gearList}>
            {ctx.gear.map((g) => (
              <li key={g.id} className={styles.gearItem}>
                {g.nickname
                  ? `${g.type}: ${g.nickname}`
                  : `${g.type}${g.manufacturer || g.model ? `: ${[g.manufacturer, g.model].filter(Boolean).join(" ")}` : ""}`}
              </li>
            ))}
          </ul>
        )}

        <a href="/gear" className={styles.editLink}>
          Edit gear
        </a>
      </div>
    </div>
  );
}

export function ProfileContextCard({
  profileContext: ctx,
  loading,
  error,
}: ProfileContextCardProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem("diveiq:profileCardCollapsed") !== "false";
    } catch {
      return true;
    }
  });

  const open = () => {
    setCollapsed(false);
    try {
      localStorage.setItem("diveiq:profileCardCollapsed", "false");
    } catch {
      // ignore
    }
  };

  const close = () => {
    setCollapsed(true);
    try {
      localStorage.setItem("diveiq:profileCardCollapsed", "true");
    } catch {
      // ignore
    }
  };

  const summaryText = buildSummaryText(ctx, loading, error);

  return (
    <>
      {/* Always-visible summary bar */}
      <div className={cardStyles.card}>
        <button
          type="button"
          className={styles.summaryBar}
          onClick={open}
          aria-expanded={!collapsed}
          aria-haspopup="dialog"
        >
          <span className={styles.summaryBarText}>{summaryText}</span>
          <span className={styles.summaryBarIcon} aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
        </button>
      </div>

      {/* Modal overlay */}
      {!collapsed && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Diver profile context"
          onClick={close}
        >
          <div
            className={styles.modalPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Diver Profile</h2>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={close}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div>
                <div
                  className={`${styles.skeletonLine} ${styles.skeletonMed}`}
                />
                <div
                  className={`${styles.skeletonLine} ${styles.skeletonShort}`}
                />
                <div
                  className={`${styles.skeletonLine} ${styles.skeletonMed}`}
                />
              </div>
            ) : error ? (
              <p className={styles.errorText}>{error}</p>
            ) : ctx ? (
              <ModalContent ctx={ctx} />
            ) : (
              <p className={styles.emptyText}>
                Add your certifications, gear, and logbook entries to get
                personalized dive planning recommendations.
              </p>
            )}

            <p
              style={{
                marginTop: "var(--space-6)",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              Your plan will be personalized using this profile data. To update
              it, edit your profile, certifications, or gear.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
