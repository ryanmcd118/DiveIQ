"use client";

import { useState, useEffect, useMemo } from "react";
import { UserCertification, CertificationDefinition } from "../types";
import { CertificationCard } from "./CertificationCard";
import { CertificationFormModal } from "./CertificationFormModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Toast } from "@/components/Toast";
import layoutStyles from "@/styles/components/Layout.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./CertificationsPageContent.module.css";

export function CertificationsPageContent() {
  const [certifications, setCertifications] = useState<UserCertification[]>([]);
  const [definitions, setDefinitions] = useState<CertificationDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCert, setEditingCert] = useState<UserCertification | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [certsRes, defsRes] = await Promise.all([
        fetch("/api/certifications"),
        fetch("/api/certifications/definitions"),
      ]);

      if (!certsRes.ok || !defsRes.ok) {
        throw new Error("Failed to load data");
      }

      const certsData = await certsRes.json();
      const defsData = await defsRes.json();

      setCertifications(certsData.certifications || []);
      setDefinitions(defsData.definitions || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load certifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Helper to get date for sorting
  const getSortDate = (cert: UserCertification): number => {
    return cert.earnedDate
      ? new Date(cert.earnedDate).getTime()
      : new Date(cert.createdAt).getTime();
  };

  // Group and sort certifications
  const { featuredCerts, coreCerts, specialtyCerts, hasMaxFeatured } =
    useMemo(() => {
      // Separate featured and non-featured
      const featured: UserCertification[] = [];
      const core: UserCertification[] = [];
      const specialty: UserCertification[] = [];

      certifications.forEach((cert) => {
        if (cert.isFeatured) {
          featured.push(cert);
        } else {
          if (cert.certificationDefinition.category === "core") {
            core.push(cert);
          } else if (cert.certificationDefinition.category === "specialty") {
            specialty.push(cert);
          }
        }
      });

      // Sort featured: core first (levelRank DESC), then specialties (earnedDate DESC)
      const featuredCore = featured.filter(
        (c) => c.certificationDefinition.category === "core"
      );
      const featuredSpecialty = featured.filter(
        (c) => c.certificationDefinition.category === "specialty"
      );

      featuredCore.sort((a, b) => {
        const rankDiff =
          b.certificationDefinition.levelRank -
          a.certificationDefinition.levelRank;
        if (rankDiff !== 0) return rankDiff;
        return getSortDate(b) - getSortDate(a);
      });

      featuredSpecialty.sort((a, b) => getSortDate(b) - getSortDate(a));

      const sortedFeatured = [...featuredCore, ...featuredSpecialty].slice(
        0,
        3
      );

      // Sort core: by levelRank DESC, then earnedDate DESC (fallback createdAt)
      core.sort((a, b) => {
        const rankDiff =
          b.certificationDefinition.levelRank -
          a.certificationDefinition.levelRank;
        if (rankDiff !== 0) return rankDiff;

        const aDate = getSortDate(a);
        const bDate = getSortDate(b);
        return bDate - aDate;
      });

      // Sort specialty: by earnedDate DESC (fallback createdAt)
      specialty.sort((a, b) => {
        const aDate = getSortDate(a);
        const bDate = getSortDate(b);
        return bDate - aDate;
      });

      const hasMaxFeatured = sortedFeatured.length >= 3;

      return {
        featuredCerts: sortedFeatured,
        coreCerts: core,
        specialtyCerts: specialty,
        hasMaxFeatured,
      };
    }, [certifications]);

  const handleAdd = () => {
    setEditingCert(null);
    setShowForm(true);
  };

  const handleEdit = (cert: UserCertification) => {
    setEditingCert(cert);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await fetch(`/api/certifications/${deleteConfirm}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete certification");
      }

      // Optimistically remove from UI
      setCertifications((prev) => prev.filter((c) => c.id !== deleteConfirm));

      setDeleteConfirm(null);
      setToast({ message: "Certification deleted" });

      // Refetch to ensure consistency
      void loadData();
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete certification";
      setDeleteConfirm(null);
      setToast({ message: errorMessage });
    }
  };

  const handleToggleFeatured = async (cert: UserCertification) => {
    // Optimistic update
    setCertifications((prev) =>
      prev.map((c) =>
        c.id === cert.id ? { ...c, isFeatured: !c.isFeatured } : c
      )
    );

    try {
      const res = await fetch(`/api/certifications/${cert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !cert.isFeatured }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      void loadData();
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      setCertifications((prev) =>
        prev.map((c) =>
          c.id === cert.id ? { ...c, isFeatured: cert.isFeatured } : c
        )
      );
      alert("Failed to update featured status");
    }
  };

  const handleSave = (success: boolean = true, errorMessage?: string) => {
    if (success) {
      setShowForm(false);
      setEditingCert(null);
      setToast({
        message: editingCert ? "Certification updated" : "Certification added",
      });
      void loadData();
    } else {
      // Error is already shown in the modal, just keep it open
      if (errorMessage) {
        setToast({ message: errorMessage });
      }
    }
  };

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <main className={layoutStyles.page}>
      <div className={layoutStyles.pageContent}>
        <header className={layoutStyles.pageHeader}>
          <div>
            <h1 className={layoutStyles.pageTitle}>Certifications</h1>
            <p className={layoutStyles.pageSubtitle}>
              Track your diving certifications and achievements
            </p>
          </div>
          <div className={layoutStyles.headerActions}>
            <button
              onClick={handleAdd}
              className={buttonStyles.primaryGradient}
            >
              Add certification
            </button>
          </div>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <div className={styles.loading}>
            <p>Loading certifications...</p>
          </div>
        ) : certifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏆</div>
            <h2>No certifications yet</h2>
            <p>
              Start tracking your diving achievements by adding your first
              certification.
            </p>
            <button
              onClick={handleAdd}
              className={buttonStyles.primaryGradient}
            >
              Add certification
            </button>
          </div>
        ) : (
          <>
            {/* Featured Certifications Section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    Featured certifications
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    You can feature up to 3 certifications
                  </p>
                </div>
              </div>
              {featuredCerts.length === 0 ? (
                <div className={styles.featuredEmptyState}>
                  <p className={styles.featuredEmptyText}>
                    Feature up to three certifications to highlight your
                    experience.
                  </p>
                  <p className={styles.featuredEmptySubtext}>
                    These will appear on your dashboard and profile.
                  </p>
                </div>
              ) : (
                <div className={styles.featuredGrid}>
                  {featuredCerts.map((cert) => (
                    <CertificationCard
                      key={cert.id}
                      certification={cert}
                      isExpanded={expandedCards.has(cert.id)}
                      onToggle={() => toggleCard(cert.id)}
                      onEdit={() => handleEdit(cert)}
                      onDelete={() => handleDelete(cert.id)}
                      onToggleFeatured={() => handleToggleFeatured(cert)}
                      isFeaturedSection={true}
                      canFeature={!hasMaxFeatured || cert.isFeatured}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Core Certifications Section */}
            {coreCerts.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Core</h2>
                <div className={styles.cardsGrid}>
                  {coreCerts.map((cert) => (
                    <CertificationCard
                      key={cert.id}
                      certification={cert}
                      isExpanded={expandedCards.has(cert.id)}
                      onToggle={() => toggleCard(cert.id)}
                      onEdit={() => handleEdit(cert)}
                      onDelete={() => handleDelete(cert.id)}
                      onToggleFeatured={() => handleToggleFeatured(cert)}
                      canFeature={!hasMaxFeatured || cert.isFeatured}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Specialties Section */}
            {specialtyCerts.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Specialties</h2>
                <div className={styles.cardsGrid}>
                  {specialtyCerts.map((cert) => (
                    <CertificationCard
                      key={cert.id}
                      certification={cert}
                      isExpanded={expandedCards.has(cert.id)}
                      onToggle={() => toggleCard(cert.id)}
                      onEdit={() => handleEdit(cert)}
                      onDelete={() => handleDelete(cert.id)}
                      onToggleFeatured={() => handleToggleFeatured(cert)}
                      canFeature={!hasMaxFeatured || cert.isFeatured}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {showForm && (
          <CertificationFormModal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingCert(null);
            }}
            onSave={handleSave}
            editingCert={editingCert}
            definitions={definitions}
          />
        )}

        {deleteConfirm && (
          <ConfirmModal
            isOpen={true}
            title="Delete certification?"
            message="This permanently removes this certification. This cannot be undone."
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}

        {toast && (
          <Toast
            message={toast.message}
            onClose={() => setToast(null)}
            duration={3000}
          />
        )}
      </div>
    </main>
  );
}
