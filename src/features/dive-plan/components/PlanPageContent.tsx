"use client";

import Link from "next/link";
import { usePlanPageState } from "../hooks/usePlanPageState";
import { AIDiveBriefing } from "./AIDiveBriefing";
import { PlanForm } from "./PlanForm";
import { PastPlansList } from "./PastPlansList";
import layoutStyles from "@/styles/components/Layout.module.css";
import gridStyles from "@/styles/components/PageGrid.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

export function PlanPageContent() {
  const {
    submittedPlan,
    aiBriefing,
    apiError,
    loading,
    pastPlans,
    plansLoading,
    plansError,
    editingPlanId,
    statusMessage,
    formKey,
    isAuthenticated,
    handleSubmit,
    handleSelectPastPlan,
    handleDeletePlan,
    handleCancelEdit,
    deletePlan,
  } = usePlanPageState();

  // Show sign-in prompt for unauthenticated users
  if (!plansLoading && !isAuthenticated) {
    return (
      <main className={layoutStyles.page}>
        <div className={layoutStyles.pageContent}>
          <header className={layoutStyles.pageHeader}>
            <div>
              <h1 className={layoutStyles.pageTitle}>Dive Plan</h1>
              <p className={layoutStyles.pageSubtitle}>
                Sign in to create AI-powered dive plans with personalized safety recommendations.
              </p>
            </div>
          </header>
          <div style={{ 
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-xl)",
            textAlign: "center", 
            padding: "var(--space-8)" 
          }}>
            <p style={{ marginBottom: "var(--space-4)" }}>
              Create an account or sign in to start planning your dives with AI-assisted safety feedback.
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
              <Link href="/signup" className={buttonStyles.primary}>
                Create account
              </Link>
              <Link href="/signin" className={buttonStyles.secondary}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={layoutStyles.page}>
      <div className={gridStyles.planPageGrid}>
        {/* Left column: form */}
        <section className={gridStyles.section}>
          <div>
            <h1 className={layoutStyles.pageTitle}>Dive Plan</h1>
            <p className={layoutStyles.pageSubtitle}>
              Fill out the form to generate a dive plan and get safety-focused
              feedback from DiveIQ.
            </p>
          </div>

          <PlanForm
            formKey={formKey}
            submittedPlan={submittedPlan}
            editingPlanId={editingPlanId}
            loading={loading}
            apiError={apiError}
            onSubmit={handleSubmit}
            onCancelEdit={handleCancelEdit}
            onDeletePlan={handleDeletePlan}
          />
        </section>

        {/* Right column: AI briefing and past plans */}
        <section className={gridStyles.section}>
          {/* AI Briefing Panel - shows skeleton when loading, briefing when ready */}
          {(loading || aiBriefing || submittedPlan) && (
            <AIDiveBriefing
              briefing={aiBriefing}
              loading={loading}
              compact={false}
            />
          )}

          {/* Placeholder when no plan submitted yet */}
          {!submittedPlan && !loading && !aiBriefing && (
            <div className={gridStyles.placeholderCard}>
              Once you submit a plan, your AI dive briefing will appear here with 
              location-specific conditions, site hazards, and personalized recommendations.
            </div>
          )}

          <PastPlansList
            pastPlans={pastPlans}
            plansLoading={plansLoading}
            plansError={plansError}
            onSelectPlan={handleSelectPastPlan}
            onDeletePlan={deletePlan}
          />
        </section>
      </div>

      {statusMessage && (
        <div className={gridStyles.statusToast}>
          <div className={gridStyles.statusToastContent}>
            <span style={{ fontSize: "var(--font-size-lg)" }}>✅</span>
            <span>{statusMessage}</span>
          </div>
        </div>
      )}
    </main>
  );
}
