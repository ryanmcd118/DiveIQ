"use client";

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

export function ProfileContextCard({
  profileContext: ctx,
  loading,
  error,
}: ProfileContextCardProps) {
  return (
    <div className={`${cardStyles.card} ${styles.wrapper}`}>
      {loading ? (
        <>
          <div className={`${styles.skeletonLine} ${styles.skeletonMed}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonMed}`} />
        </>
      ) : error ? (
        <p className={styles.errorText}>{error}</p>
      ) : !ctx ||
        (ctx.totalDives === 0 &&
          !ctx.lastDiveDate &&
          !ctx.experienceLevel &&
          !ctx.yearsDiving &&
          !ctx.homeDiveRegion &&
          ctx.primaryDiveTypes.length === 0 &&
          ctx.certifications.length === 0 &&
          ctx.gear.length === 0) ? (
        <>
          <p className={styles.header}>Profile context</p>
          <p className={styles.emptyText}>
            Add your certifications, gear, and logbook entries to get
            personalized dive planning recommendations.
          </p>
        </>
      ) : (
        <>
          <p className={styles.header}>
            Your plan will be personalized using this profile data.
          </p>
          <p className={styles.subtext}>
            To update this information, edit your profile, certifications, or
            gear.
          </p>

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
              <span className={styles.label}>Experience level:</span>
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

          {ctx.certifications.length > 0 && (
            <>
              <p className={styles.sectionLabel}>Certifications</p>
              {(["PADI", "SSI"] as const).map((agency) => {
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
              })}
              {/* Other agencies not in PADI/SSI */}
              {(() => {
                const otherCerts = ctx.certifications.filter(
                  (c) => c.agency !== "PADI" && c.agency !== "SSI"
                );
                if (otherCerts.length === 0) return null;
                const otherAgencies = [
                  ...new Set(otherCerts.map((c) => c.agency)),
                ];
                return otherAgencies.map((agency) => {
                  const agencyCerts = otherCerts
                    .filter((c) => c.agency === agency)
                    .sort((a, b) => a.levelRank - b.levelRank);
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
                });
              })()}
            </>
          )}

          {ctx.gear.length > 0 && (
            <>
              <p className={styles.sectionLabel}>Active gear</p>
              <ul className={styles.gearList}>
                {ctx.gear.map((g) => (
                  <li key={g.id} className={styles.gearItem}>
                    {g.nickname
                      ? `${g.type}: ${g.nickname}`
                      : `${g.type}${g.manufacturer || g.model ? `: ${[g.manufacturer, g.model].filter(Boolean).join(" ")}` : ""}`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
