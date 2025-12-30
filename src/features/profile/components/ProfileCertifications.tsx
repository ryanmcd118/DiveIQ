"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { UserCertification } from "@/features/certifications/types";
import styles from "./ProfileCertifications.module.css";

interface ProfileCertificationsProps {
  isOwner?: boolean;
}

export function ProfileCertifications({ isOwner = true }: ProfileCertificationsProps) {
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

  // Determine which certifications to show
  const displayCertifications = useMemo(() => {
    if (certifications.length === 0) return [];

    // Check if featured certifications exist
    const featured = certifications.filter((c) => c.isFeatured);
    
    if (featured.length > 0) {
      // Show up to 3 featured
      // Sort: core first, then levelRank DESC, then earnedDate DESC
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

        // Then by earnedDate DESC
        const aDate = a.earnedDate
          ? new Date(a.earnedDate).getTime()
          : new Date(a.createdAt).getTime();
        const bDate = b.earnedDate
          ? new Date(b.earnedDate).getTime()
          : new Date(b.createdAt).getTime();
        return bDate - aDate;
      });

      return featured.slice(0, 3);
    }

    // No featured: show highest core cert + 2 most recent specialties
    const core = certifications.filter(
      (c) => c.certificationDefinition.category === "core"
    );
    const specialties = certifications.filter(
      (c) => c.certificationDefinition.category === "specialty"
    );

    // Sort core by levelRank DESC, then earnedDate DESC
    core.sort((a, b) => {
      const aDef = a.certificationDefinition;
      const bDef = b.certificationDefinition;

      if (aDef.levelRank !== bDef.levelRank) {
        return bDef.levelRank - aDef.levelRank;
      }

      const aDate = a.earnedDate
        ? new Date(a.earnedDate).getTime()
        : new Date(a.createdAt).getTime();
      const bDate = b.earnedDate
        ? new Date(b.earnedDate).getTime()
        : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    // Sort specialties by earnedDate DESC
    specialties.sort((a, b) => {
      const aDate = a.earnedDate
        ? new Date(a.earnedDate).getTime()
        : new Date(a.createdAt).getTime();
      const bDate = b.earnedDate
        ? new Date(b.earnedDate).getTime()
        : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    const result: UserCertification[] = [];
    if (core.length > 0) {
      result.push(core[0]);
    }
    result.push(...specialties.slice(0, 2));

    return result;
  }, [certifications]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading certifications...</p>
      </div>
    );
  }

  if (displayCertifications.length === 0) {
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
      <div className={styles.certList}>
        {displayCertifications.map((cert) => {
          const def = cert.certificationDefinition;
          return (
            <div key={cert.id} className={styles.certItem}>
              <div className={styles.certInfo}>
                <span className={styles.certName}>{def.name}</span>
                <span className={styles.agencyTag}>{def.agency}</span>
              </div>
            </div>
          );
        })}
      </div>
      {isOwner && (
        <div className={styles.viewAll}>
          <Link href="/certifications" className={styles.viewAllLink}>
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

