"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { UserCertification } from "@/features/certifications/types";
import styles from "./ProfileCertifications.module.css";

interface ProfileCertificationsProps {
  isOwner?: boolean;
}

export function ProfileCertifications({
  isOwner = true,
}: ProfileCertificationsProps) {
  const [certifications, setCertifications] = useState<UserCertification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/certifications");
        if (res.ok) {
          const data = await res.json();
          setCertifications(data.certifications || []);
        }
      } catch (err) {
        console.error("Failed to load certifications", err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  // Helper to get date for sorting
  const getSortDate = (cert: UserCertification): number => {
    return cert.earnedDate
      ? new Date(cert.earnedDate).getTime()
      : new Date(cert.createdAt).getTime();
  };

  // Calculate highlights and other certs (same logic as dashboard widget)
  const { highlightCerts, otherCerts } = useMemo(() => {
    if (certifications.length === 0) {
      return { highlightCerts: [], otherCerts: [] };
    }

    // Separate featured and non-featured
    const featured = certifications.filter((c) => c.isFeatured);
    const nonFeatured = certifications.filter((c) => !c.isFeatured);

    let highlights: UserCertification[] = [];
    const highlightIds = new Set<string>();

    if (featured.length > 0) {
      // Sort featured: core first by levelRank DESC, then specialties by earnedDate DESC
      const featuredCore = featured.filter(
        (c) => c.certificationDefinition.category === "core"
      );
      const featuredSpecialty = featured.filter(
        (c) => c.certificationDefinition.category === "specialty"
      );

      // Sort featured core by levelRank DESC
      featuredCore.sort((a, b) => {
        const aDef = a.certificationDefinition;
        const bDef = b.certificationDefinition;
        if (aDef.levelRank !== bDef.levelRank) {
          return bDef.levelRank - aDef.levelRank;
        }
        return getSortDate(b) - getSortDate(a);
      });

      // Sort featured specialties by earnedDate DESC
      featuredSpecialty.sort((a, b) => getSortDate(b) - getSortDate(a));

      // Combine: core first, then specialties
      highlights = [...featuredCore, ...featuredSpecialty].slice(0, 3);
    } else {
      // No featured: show highest core + up to 2 most recent specialties
      const core = nonFeatured.filter(
        (c) => c.certificationDefinition.category === "core"
      );
      const specialties = nonFeatured.filter(
        (c) => c.certificationDefinition.category === "specialty"
      );

      // Sort core by levelRank DESC
      core.sort((a, b) => {
        const aDef = a.certificationDefinition;
        const bDef = b.certificationDefinition;
        if (aDef.levelRank !== bDef.levelRank) {
          return bDef.levelRank - aDef.levelRank;
        }
        return getSortDate(b) - getSortDate(a);
      });

      // Sort specialties by earnedDate DESC
      specialties.sort((a, b) => getSortDate(b) - getSortDate(a));

      // Add highest core (if exists)
      if (core.length > 0) {
        highlights.push(core[0]);
      }
      // Add up to 2 most recent specialties
      highlights.push(...specialties.slice(0, 2));
    }

    // Track highlight cert IDs to exclude from other certs
    highlights.forEach((cert) => highlightIds.add(cert.id));

    // Other certs: all remaining certifications
    // Sort by: core first (levelRank DESC), then specialties (earnedDate DESC)
    const remaining = certifications.filter((c) => !highlightIds.has(c.id));
    const remainingCore = remaining.filter(
      (c) => c.certificationDefinition.category === "core"
    );
    const remainingSpecialty = remaining.filter(
      (c) => c.certificationDefinition.category === "specialty"
    );

    // Sort remaining core by levelRank DESC
    remainingCore.sort((a, b) => {
      const aDef = a.certificationDefinition;
      const bDef = b.certificationDefinition;
      if (aDef.levelRank !== bDef.levelRank) {
        return bDef.levelRank - aDef.levelRank;
      }
      return getSortDate(b) - getSortDate(a);
    });

    // Sort remaining specialties by earnedDate DESC
    remainingSpecialty.sort((a, b) => getSortDate(b) - getSortDate(a));

    const other = [...remainingCore, ...remainingSpecialty];

    return { highlightCerts: highlights, otherCerts: other };
  }, [certifications]);

  const getEarnedYear = (cert: UserCertification): string | null => {
    if (!cert.earnedDate) return null;
    return new Date(cert.earnedDate).getFullYear().toString();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading certifications...</p>
      </div>
    );
  }

  if (certifications.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>
          This user hasn&apos;t added any certifications yet.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Highlights Section */}
      <div className={styles.highlightsSection}>
        <div className={styles.highlightsLabel}>Highlights</div>
        {highlightCerts.length === 0 ? (
          <p className={styles.emptyState}>
            This user hasn&apos;t added any certifications yet.
          </p>
        ) : (
          <div className={styles.highlightsGrid}>
            {highlightCerts.map((cert) => {
              const def = cert.certificationDefinition;
              const year = getEarnedYear(cert);
              return (
                <div key={cert.id} className={styles.highlightCard}>
                  <div className={styles.highlightName}>{def.name}</div>
                  <div className={styles.highlightMeta}>
                    <span className={styles.highlightAgencyTag}>
                      {def.agency}
                    </span>
                    {year && (
                      <span className={styles.highlightYear}>{year}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Other Certs Section */}
      {otherCerts.length > 0 && (
        <div className={styles.otherCertsSection}>
          <div className={styles.otherCertsLabel}>Other certs</div>
          <ul className={styles.otherCertsList}>
            {otherCerts.map((cert) => {
              const def = cert.certificationDefinition;
              const year = getEarnedYear(cert);
              return (
                <li key={cert.id} className={styles.otherCertsItem}>
                  <span className={styles.otherCertsName}>{def.name}</span>
                  <div className={styles.otherCertsMeta}>
                    <span className={styles.otherCertsAgencyTag}>
                      {def.agency}
                    </span>
                    {year && (
                      <span className={styles.otherCertsYear}>{year}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* View All / Manage Link */}
      {isOwner && (
        <div className={styles.viewAll}>
          <Link href="/certifications" className={styles.viewAllLink}>
            Manage certifications
          </Link>
        </div>
      )}
    </div>
  );
}
