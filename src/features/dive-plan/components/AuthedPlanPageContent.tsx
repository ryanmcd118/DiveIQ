"use client";

import { useState, useMemo } from "react";
import { useAuthedPlanState } from "../hooks/useAuthedPlanState";
import { AIDiveBriefing } from "./AIDiveBriefing";
import { PlanLoadingScreen } from "./PlanLoadingScreen";
import { Toast } from "@/components/Toast";
import { PlanForm } from "./PlanForm";
import { ProfileContextCard } from "./ProfileContextCard";
import { PastPlan } from "@/features/dive-plan/types";
import { matchesQuery } from "@/features/dive-plan/utils/searchMatch";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { displayDepth, depthInputToCm } from "@/lib/units";
import layoutStyles from "@/styles/components/Layout.module.css";
import backgroundStyles from "@/styles/components/Background.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./AuthedPlanPageContent.module.css";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function riskBadgeStyle(risk: string): { background: string; color: string } {
  if (risk === "Low")
    return { background: "rgba(16,185,129,0.15)", color: "#6ee7b7" };
  if (risk === "High")
    return { background: "rgba(249,115,22,0.15)", color: "#fdba74" };
  if (risk === "Extreme")
    return { background: "rgba(239,68,68,0.15)", color: "#fca5a5" };
  return { background: "rgba(245,158,11,0.15)", color: "#fcd34d" };
}

function PlanSidebarItem({
  plan,
  isSelected,
  onClick,
}: {
  plan: PastPlan;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { prefs } = useUnitPreferences();
  const depth = displayDepth(plan.maxDepthCm, prefs.depth);
  const badgeStyle = riskBadgeStyle(plan.riskLevel);

  return (
    <button
      type="button"
      className={`${styles.sidebarItem} ${isSelected ? styles.sidebarItemSelected : ""}`}
      onClick={onClick}
    >
      <div className={styles.sidebarItemTop}>
        <span className={styles.sidebarSiteName}>{plan.siteName}</span>
        <span className={styles.sidebarDate}>{formatDate(plan.date)}</span>
      </div>
      <div className={styles.sidebarRegion}>{plan.region}</div>
      <div className={styles.sidebarItemBottom}>
        <span className={styles.sidebarStats}>
          {depth.value}
          {depth.unit} · {plan.bottomTime}min
        </span>
        <span className={styles.sidebarRiskBadge} style={badgeStyle}>
          {plan.riskLevel}
        </span>
      </div>
    </button>
  );
}

export function AuthedPlanPageContent() {
  const {
    submittedPlan,
    aiBriefing,
    draftRiskLevel,
    apiError,
    loading,
    saving,
    pastPlans,
    plansLoading,
    plansError,
    editingPlanId,
    statusMessage,
    isAuthenticated,
    isSessionLoading,
    profileContext,
    profileLoading,
    profileError,
    handleSubmit,
    saveDraftPlan,
    handleCancelEdit,
    handleDeletePlan,
    handleEditFromView,
    clearBriefing,
    clearStatusMessage,
    deletePlan,
    handleNewPlan: hookHandleNewPlan,
  } = useAuthedPlanState();

  const { prefs } = useUnitPreferences();
  const [viewingPlan, setViewingPlan] = useState<PastPlan | null>(null);
  const [planSortKey, setPlanSortKey] = useState<
    "date-desc" | "date-asc" | "createdAt-desc" | "risk-desc" | "region-asc"
  >("date-desc");
  const [planSearchQuery, setPlanSearchQuery] = useState("");

  const sortedPlans = useMemo(() => {
    const q = planSearchQuery.trim().toLowerCase();

    const filtered = q
      ? pastPlans.filter(
          (plan) =>
            matchesQuery(plan.siteName, q) ||
            matchesQuery(plan.region, q) ||
            matchesQuery(plan.riskLevel, q)
        )
      : pastPlans;

    return [...filtered].sort((a, b) => {
      switch (planSortKey) {
        case "date-desc":
          if (a.date < b.date) return 1;
          if (a.date > b.date) return -1;
          return 0;
        case "date-asc":
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;
          return 0;
        case "createdAt-desc": {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        }
        case "risk-desc": {
          const rank = (r: string) => {
            if (r === "Extreme") return 0;
            if (r === "High") return 1;
            if (r === "Moderate") return 2;
            return 3;
          };
          return rank(a.riskLevel) - rank(b.riskLevel);
        }
        case "region-asc":
          return a.region.localeCompare(b.region);
        default:
          return 0;
      }
    });
  }, [pastPlans, planSortKey, planSearchQuery]);

  const isView3 = viewingPlan !== null;
  const isView2 = !isView3 && (!!aiBriefing || loading);
  const isView1 = !isView3 && !isView2;

  const handleSavePlan = async () => {
    try {
      const savedPlan = await saveDraftPlan();
      if (savedPlan) setViewingPlan(savedPlan);
    } catch {
      // error state handled by hook
    }
  };

  const handleNewPlan = () => {
    hookHandleNewPlan();
    setViewingPlan(null);
  };

  const handleEditFromView2 = () => {
    clearBriefing();
  };

  const handleEditFromView3 = () => {
    if (!viewingPlan) return;
    handleEditFromView(viewingPlan);
    setViewingPlan(null);
  };

  const handleDeleteFromView3 = async () => {
    if (!viewingPlan) return;
    const deleted = await deletePlan(viewingPlan.id);
    if (deleted) setViewingPlan(null);
  };

  if (isSessionLoading) {
    return (
      <main
        className={`${layoutStyles.page} ${backgroundStyles.pageGradientSubtle}`}
      >
        <div className={styles.pageContainer}>
          <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`${layoutStyles.page} ${backgroundStyles.pageGradientSubtle}`}
    >
      <div className={styles.pageContainer}>
        {/* Page header */}
        <header className={layoutStyles.pageHeader}>
          <div>
            <h1 className={layoutStyles.pageTitle}>Dive Plan</h1>
            <p className={layoutStyles.pageSubtitle}>
              Fill out the form to generate a dive plan and get safety-focused
              feedback from DiveIQ.
            </p>
          </div>
        </header>

        {/* Full-width profile bar */}
        <ProfileContextCard
          profileContext={profileContext}
          loading={profileLoading}
          error={profileError}
        />

        {/* Two-column body */}
        <div className={styles.bodyGrid}>
          {/* ── Main content area ── */}
          <section className={styles.mainArea}>
            {/* VIEW 1: Form */}
            {isView1 && (
              <PlanForm
                mode="authed"
                formKey={
                  submittedPlan
                    ? `edit-${JSON.stringify(submittedPlan)}`
                    : "new"
                }
                submittedPlan={submittedPlan}
                editingPlanId={editingPlanId}
                loading={loading}
                apiError={apiError}
                onSubmit={handleSubmit}
                onCancelEdit={handleCancelEdit}
                onDeletePlan={handleDeletePlan}
                profileContext={profileContext}
              />
            )}

            {/* VIEW 2: New briefing (just submitted, not yet saved) */}
            {isView2 && (
              <>
                <div className={styles.briefingWrapper}>
                  {loading || saving ? (
                    <PlanLoadingScreen
                      mode={loading && !editingPlanId ? "generating" : "saving"}
                    />
                  ) : (
                    <AIDiveBriefing
                      briefing={aiBriefing}
                      riskLevel={draftRiskLevel ?? undefined}
                      loading={false}
                      scrollable={true}
                      plannedDepthCm={
                        submittedPlan
                          ? (depthInputToCm(
                              String(submittedPlan.maxDepth),
                              prefs.depth
                            ) ?? undefined)
                          : undefined
                      }
                      userCerts={profileContext?.certifications.map(
                        (c) => c.name
                      )}
                    />
                  )}
                </div>

                <div className={styles.ctaRow}>
                  <button
                    type="button"
                    className={buttonStyles.primaryGradient}
                    onClick={handleSavePlan}
                    disabled={saving || loading}
                  >
                    {saving ? "Saving…" : "Save Plan"}
                  </button>
                  <button
                    type="button"
                    className={buttonStyles.secondary}
                    onClick={handleEditFromView2}
                    disabled={loading}
                  >
                    Edit Plan
                  </button>
                  <button
                    type="button"
                    className={buttonStyles.ghost}
                    onClick={handleNewPlan}
                    disabled={loading}
                  >
                    New Plan
                  </button>
                </div>

                {(aiBriefing ?? submittedPlan) && (
                  <p className={styles.disclaimer}>
                    DiveIQ provides regional and conditions-based guidance. For
                    site-specific information, consult local dive operators.
                    Site-level conditions data isn&apos;t reliably available in
                    any digital platform — we focus on what we can assess with
                    confidence.
                  </p>
                )}
              </>
            )}

            {/* VIEW 3: Past plan briefing */}
            {isView3 && viewingPlan && (
              <>
                <div className={styles.planViewHeader}>
                  <span className={styles.planViewSiteName}>
                    {viewingPlan.siteName}
                  </span>
                  <span className={styles.planViewMeta}>
                    {viewingPlan.region} · {formatDate(viewingPlan.date)}
                  </span>
                </div>

                <div className={styles.briefingWrapper}>
                  {viewingPlan.aiBriefing ? (
                    <AIDiveBriefing
                      briefing={viewingPlan.aiBriefing}
                      riskLevel={viewingPlan.riskLevel}
                      loading={false}
                      scrollable={true}
                      plannedDepthCm={viewingPlan.maxDepthCm}
                      userCerts={profileContext?.certifications.map(
                        (c) => c.name
                      )}
                    />
                  ) : (
                    <div
                      style={{
                        padding: "var(--space-8)",
                        color: "var(--color-text-muted)",
                        fontSize: "var(--font-size-sm)",
                        textAlign: "center",
                      }}
                    >
                      No briefing available for this plan.
                    </div>
                  )}
                </div>

                <div className={styles.ctaRow}>
                  <button
                    type="button"
                    className={buttonStyles.secondary}
                    onClick={handleEditFromView3}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={buttonStyles.ghost}
                    onClick={handleNewPlan}
                  >
                    New Plan
                  </button>
                  <span className={styles.ctaRowEnd}>
                    <button
                      type="button"
                      className={buttonStyles.danger}
                      onClick={handleDeleteFromView3}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              </>
            )}
          </section>

          {/* ── Right sidebar ── */}
          {isAuthenticated && (
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <span className={styles.sidebarTitle}>Plans</span>
                <button
                  type="button"
                  className={buttonStyles.ghost}
                  style={{
                    fontSize: "var(--font-size-xs)",
                    padding: "2px 8px",
                  }}
                  onClick={handleNewPlan}
                >
                  + New
                </button>
              </div>

              <div className={styles.sidebarSort}>
                <select
                  className={styles.sidebarSortSelect}
                  value={planSortKey}
                  onChange={(e) =>
                    setPlanSortKey(e.target.value as typeof planSortKey)
                  }
                >
                  <option value="date-desc">Date (descending)</option>
                  <option value="date-asc">Date (ascending)</option>
                  <option value="createdAt-desc">Most recently added</option>
                  <option value="risk-desc">Risk level (High first)</option>
                  <option value="region-asc">Region (A–Z)</option>
                </select>
              </div>

              <div className={styles.sidebarSearch}>
                <input
                  type="search"
                  className={styles.sidebarSearchInput}
                  placeholder="Search by site, region, or risk"
                  value={planSearchQuery}
                  onChange={(e) => setPlanSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.sidebarList}>
                {plansLoading ? (
                  <p className={styles.sidebarEmptyState}>Loading…</p>
                ) : plansError ? (
                  <p className={styles.sidebarEmptyState}>{plansError}</p>
                ) : pastPlans.length === 0 ? (
                  <p className={styles.sidebarEmptyState}>
                    No plans yet. Submit a plan to start building your history.
                  </p>
                ) : sortedPlans.length === 0 ? (
                  <p className={styles.sidebarEmptyState}>No plans found.</p>
                ) : (
                  sortedPlans.map((plan) => (
                    <PlanSidebarItem
                      key={plan.id}
                      plan={plan}
                      isSelected={viewingPlan?.id === plan.id}
                      onClick={() => setViewingPlan(plan)}
                    />
                  ))
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {statusMessage && (
        <Toast
          message={statusMessage}
          onClose={clearStatusMessage}
          duration={3000}
        />
      )}
    </main>
  );
}
