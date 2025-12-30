"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { UserCertification } from "@/features/certifications/types";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./CertificationsCard.module.css";

export function CertificationsCard() {
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

  // Calculate primary and secondary sections
  const { primaryCerts, secondaryCerts } = useMemo(() => {
    if (certifications.length === 0) {
      return { primaryCerts: [], secondaryCerts: [] };
    }

    // Separate featured and non-featured
    const featured = certifications.filter((c) => c.isFeatured);
    const nonFeatured = certifications.filter((c) => !c.isFeatured);

    let primary: UserCertification[] = [];
    const primaryIds = new Set<string>();

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
      primary = [...featuredCore, ...featuredSpecialty].slice(0, 3);
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
        primary.push(core[0]);
      }
      // Add up to 2 most recent specialties
      primary.push(...specialties.slice(0, 2));
    }

    // Track primary cert IDs to exclude from secondary
    primary.forEach((cert) => primaryIds.add(cert.id));

    // Secondary: all remaining certifications
    // Sort by: core first (levelRank DESC), then specialties (earnedDate DESC)
    const remaining = certifications.filter((c) => !primaryIds.has(c.id));
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

    const secondary = [...remainingCore, ...remainingSpecialty];

    return { primaryCerts: primary, secondaryCerts: secondary };
  }, [certifications]);

  const getEarnedYear = (cert: UserCertification): string | null => {
    if (!cert.earnedDate) return null;
    return new Date(cert.earnedDate).getFullYear().toString();
  };

  if (loading) {
    return (
      <div className={`${cardStyles.card} ${styles.card} ${styles.cardTier3}`}>
        <h3 className={styles.cardTitle}>Certifications</h3>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`${cardStyles.card} ${styles.card} ${styles.cardTier3}`}>
      <h3 className={styles.cardTitle}>Certifications</h3>

      {certifications.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No certifications yet</p>
          <Link href="/certifications" className={styles.addLink}>
            Add certification
          </Link>
        </div>
      ) : (
        <>
          {/* Primary / Featured Section */}
          {primaryCerts.length > 0 && (
            <div className={styles.primarySection}>
              <ul className={styles.primaryList}>
                {primaryCerts.map((cert) => {
                  const def = cert.certificationDefinition;
                  const year = getEarnedYear(cert);
                  return (
                    <li key={cert.id} className={styles.primaryItem}>
                      <div className={styles.certInfo}>
                        <span className={styles.certName}>{def.name}</span>
                        <div className={styles.certMeta}>
                          <span className={styles.agencyTag}>{def.agency}</span>
                          {year && <span className={styles.year}>{year}</span>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Secondary / Other Certifications Section */}
          {secondaryCerts.length > 0 && (
            <div className={styles.secondarySection}>
              <ul className={styles.secondaryList}>
                {secondaryCerts.map((cert) => {
                  const def = cert.certificationDefinition;
                  const year = getEarnedYear(cert);
                  return (
                    <li key={cert.id} className={styles.secondaryItem}>
                      <span className={styles.secondaryName}>{def.name}</span>
                      <div className={styles.secondaryMeta}>
                        <span className={styles.secondaryAgencyTag}>
                          {def.agency}
                        </span>
                        {year && (
                          <span className={styles.secondaryYear}>{year}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}

      <div className={styles.actions}>
        <Link href="/certifications" className={buttonStyles.ghost}>
          Manage certifications
        </Link>
      </div>
    </div>
  );
}

