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
  const [editingCert, setEditingCert] = useState<UserCertification | null>(null);
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

  // Group and sort certifications
  const { coreCerts, specialtyCerts } = useMemo(() => {
    const core: UserCertification[] = [];
    const specialty: UserCertification[] = [];

    certifications.forEach((cert) => {
      if (cert.certificationDefinition.category === "core") {
        core.push(cert);
      } else if (cert.certificationDefinition.category === "specialty") {
        specialty.push(cert);
      }
    });

    // Sort core: by levelRank DESC, then earnedDate DESC (fallback createdAt)
    core.sort((a, b) => {
      const rankDiff = b.certificationDefinition.levelRank - a.certificationDefinition.levelRank;
      if (rankDiff !== 0) return rankDiff;
      
      const aDate = a.earnedDate ? new Date(a.earnedDate).getTime() : new Date(a.createdAt).getTime();
      const bDate = b.earnedDate ? new Date(b.earnedDate).getTime() : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    // Sort specialty: by earnedDate DESC (fallback createdAt)
    specialty.sort((a, b) => {
      const aDate = a.earnedDate ? new Date(a.earnedDate).getTime() : new Date(a.createdAt).getTime();
      const bDate = b.earnedDate ? new Date(b.earnedDate).getTime() : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    return { coreCerts: core, specialtyCerts: specialty };
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
        throw new Error("Failed to delete");
      }

      setDeleteConfirm(null);
      setToast({ message: "Certification deleted" });
      void loadData();
    } catch (err) {
      console.error(err);
      setDeleteConfirm(null);
      alert("Failed to delete certification");
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

  const handleSave = () => {
    setShowForm(false);
    setEditingCert(null);
    setToast({ message: editingCert ? "Certification updated" : "Certification added" });
    void loadData();
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
            <p>Start tracking your diving achievements by adding your first certification.</p>
            <button
              onClick={handleAdd}
              className={buttonStyles.primaryGradient}
            >
              Add certification
            </button>
          </div>
        ) : (
          <>
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
                    />
                  ))}
                </div>
              </section>
            )}

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

