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

  // Sort and select top 3 certifications
  const topCertifications = useMemo(() => {
    if (certifications.length === 0) return [];

    // Separate featured and non-featured
    const featured = certifications.filter((c) => c.isFeatured);
    const nonFeatured = certifications.filter((c) => !c.isFeatured);

    // Sort featured: core first, then levelRank DESC, then earnedDate DESC
    featured.sort((a, b) => {
      const aDef = a.certificationDefinition;
      const bDef = b.certificationDefinition;

      // Core before specialty
      if (aDef.category === "core" && bDef.category !== "core") return -1;
      if (aDef.category !== "core" && bDef.category === "core") return 1;

      // Then by levelRank DESC
      if (aDef.levelRank !== bDef.levelRank) {
        return bDef.levelRank - aDef.levelRank;
      }

      // Then by earnedDate DESC (fallback to createdAt)
      const aDate = a.earnedDate
        ? new Date(a.earnedDate).getTime()
        : new Date(a.createdAt).getTime();
      const bDate = b.earnedDate
        ? new Date(b.earnedDate).getTime()
        : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    // Sort non-featured core: levelRank DESC, then earnedDate DESC
    const nonFeaturedCore = nonFeatured.filter(
      (c) => c.certificationDefinition.category === "core"
    );
    nonFeaturedCore.sort((a, b) => {
      const aDef = a.certificationDefinition;
      const bDef = b.certificationDefinition;

      // levelRank DESC
      if (aDef.levelRank !== bDef.levelRank) {
        return bDef.levelRank - aDef.levelRank;
      }

      // Then earnedDate DESC
      const aDate = a.earnedDate
        ? new Date(a.earnedDate).getTime()
        : new Date(a.createdAt).getTime();
      const bDate = b.earnedDate
        ? new Date(b.earnedDate).getTime()
        : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    // Sort non-featured specialties: earnedDate DESC
    const nonFeaturedSpecialty = nonFeatured.filter(
      (c) => c.certificationDefinition.category === "specialty"
    );
    nonFeaturedSpecialty.sort((a, b) => {
      const aDate = a.earnedDate
        ? new Date(a.earnedDate).getTime()
        : new Date(a.createdAt).getTime();
      const bDate = b.earnedDate
        ? new Date(b.earnedDate).getTime()
        : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    // Combine: featured first, then non-featured core, then non-featured specialty
    const combined = [
      ...featured,
      ...nonFeaturedCore,
      ...nonFeaturedSpecialty,
    ];

    // Return top 3
    return combined.slice(0, 3);
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

      {topCertifications.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No certifications yet</p>
          <Link href="/certifications" className={styles.addLink}>
            Add
          </Link>
        </div>
      ) : (
        <ul className={styles.certList}>
          {topCertifications.map((cert) => {
            const def = cert.certificationDefinition;
            const year = getEarnedYear(cert);
            return (
              <li key={cert.id} className={styles.certItem}>
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
      )}

      <div className={styles.actions}>
        <Link href="/certifications" className={buttonStyles.ghost}>
          Manage certifications
        </Link>
      </div>
    </div>
  );
}

