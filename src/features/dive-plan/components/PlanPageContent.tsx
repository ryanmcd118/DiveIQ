"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePlanPageState } from "../hooks/usePlanPageState";
import { AIDiveBriefing } from "./AIDiveBriefing";
import { PlanForm } from "./PlanForm";
import { PastPlansList } from "./PastPlansList";
import { SaveDivePlanButton } from "./SaveDivePlanButton";
import { AuthModal } from "@/features/auth/components/AuthModal";
import layoutStyles from "@/styles/components/Layout.module.css";
import gridStyles from "@/styles/components/PageGrid.module.css";
import backgroundStyles from "@/styles/components/Background.module.css";

type PlanPageMode = "public" | "authed";

interface PlanPageContentProps {
  mode?: PlanPageMode;
}

export function PlanPageContent({ mode = "authed" }: PlanPageContentProps) {
  const router = useRouter();
  const {
    submittedPlan,
    hasDraftPlan,
    aiBriefing,
    apiError,
    loading,
    saving,
    pastPlans,
    plansLoading,
    plansError,
    editingPlanId,
    statusMessage,
    formKey,
    isAuthenticated,
    isSessionLoading,
    handleSubmit,
    saveDraftPlan,
    handleSelectPastPlan,
    handleDeletePlan,
    handleCancelEdit,
    deletePlan,
    refreshAfterAuth,
  } = usePlanPageState();

  const [showAuthModal, setShowAuthModal] = useState(false);

  // Handle save button click for unauthenticated users
  const handleRequireAuth = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  // Handle successful authentication from modal
  const handleAuthSuccess = useCallback(async () => {
    setShowAuthModal(false);

    // Refresh the router to update session state
    router.refresh();

    // Wait a moment for session to update, then try to save
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Refresh past plans
    await refreshAfterAuth();

    // Attempt to save the draft plan automatically
    try {
      await saveDraftPlan();
    } catch (err) {
      console.error("Auto-save after auth failed:", err);
      // Even if auto-save fails, user is now authenticated and can retry
    }
  }, [router, refreshAfterAuth, saveDraftPlan]);

  // Show a loading skeleton while session is being determined
  if (isSessionLoading) {
    return (
      <main
        className={`${layoutStyles.page} ${backgroundStyles.pageGradientSubtle}`}
      >
        <div className={gridStyles.planPageContainer}>
          <header className={gridStyles.planPageHeader}>
            <h1 className={layoutStyles.pageTitle}>Dive Plan</h1>
            <p className={layoutStyles.pageSubtitle}>Loading...</p>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`${layoutStyles.page} ${backgroundStyles.pageGradientSubtle}`}
    >
      <div className={gridStyles.planPageContainer}>
        {/* Top zone: Page header */}
        <header className={layoutStyles.pageHeader}>
          <div>
            <h1 className={layoutStyles.pageTitle}>Dive Plan</h1>
            <p className={layoutStyles.pageSubtitle}>
              Fill out the form to generate a dive plan and get safety-focused
              feedback from DiveIQ.
            </p>
          </div>
          <div className={layoutStyles.headerActions}>
            {/* Save button in header - shown when plan is generated */}
            {!editingPlanId && (
              <SaveDivePlanButton
                isAuthenticated={isAuthenticated}
                hasPlanDraft={hasDraftPlan}
                onSaveAuthed={saveDraftPlan}
                onRequireAuth={handleRequireAuth}
                isSaving={saving}
                variant="header"
              />
            )}
          </div>
        </header>

        {/* Middle zone: Two-column layout */}
        <div className={gridStyles.planPageMiddle}>
          {/* Left column: Form */}
          <section className={gridStyles.planFormColumn}>
            <PlanForm
              mode={mode}
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

          {/* Right column: AI briefing panel (scrollable) */}
          <section className={gridStyles.planAIColumn}>
            {/* AI Briefing Panel - shows skeleton when loading, briefing when ready */}
            {loading || aiBriefing || submittedPlan ? (
              <div className={gridStyles.aiBriefingScrollWrapper}>
                <AIDiveBriefing
                  mode={mode}
                  briefing={aiBriefing}
                  loading={loading}
                  compact={false}
                  scrollable={true}
                />
              </div>
            ) : (
              /* Placeholder when no plan submitted yet */
              <div className={gridStyles.aiBriefingPlaceholder}>
                Once you submit a plan, your AI dive briefing will appear here
                with location-specific conditions, site hazards, and
                personalized recommendations.
              </div>
            )}
          </section>
        </div>

        {/* Bottom zone: Full-width past plans - only visible for authenticated users */}
        {isAuthenticated && (
          <section className={gridStyles.planPageBottom}>
            <PastPlansList
              pastPlans={pastPlans}
              plansLoading={plansLoading}
              plansError={plansError}
              onSelectPlan={handleSelectPastPlan}
              onDeletePlan={deletePlan}
            />
          </section>
        )}
      </div>

      {statusMessage && (
        <div className={gridStyles.statusToast}>
          <div className={gridStyles.statusToastContent}>
            <span style={{ fontSize: "var(--font-size-lg)" }}>✅</span>
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Auth Modal for unauthenticated save attempts */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode="signup"
      />
    </main>
  );
}
