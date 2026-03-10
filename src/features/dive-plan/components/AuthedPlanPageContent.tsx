"use client";

import { useAuthedPlanState } from "../hooks/useAuthedPlanState";
import { AIDiveBriefing } from "./AIDiveBriefing";
import { PlanForm } from "./PlanForm";
import { PastPlansList } from "./PastPlansList";
import { SaveDivePlanButton } from "./SaveDivePlanButton";
import layoutStyles from "@/styles/components/Layout.module.css";
import gridStyles from "@/styles/components/PageGrid.module.css";
import backgroundStyles from "@/styles/components/Background.module.css";

export function AuthedPlanPageContent() {
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
  } = useAuthedPlanState();

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
            {!editingPlanId && (
              <SaveDivePlanButton
                isAuthenticated={isAuthenticated}
                hasPlanDraft={hasDraftPlan}
                onSaveAuthed={saveDraftPlan}
                onRequireAuth={() => undefined}
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
              mode="authed"
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

          {/* Right column: AI briefing panel */}
          <section className={gridStyles.planAIColumn}>
            {loading || aiBriefing || submittedPlan ? (
              <div className={gridStyles.aiBriefingScrollWrapper}>
                <AIDiveBriefing
                  mode="authed"
                  briefing={aiBriefing}
                  loading={loading}
                  compact={false}
                  scrollable={true}
                />
              </div>
            ) : (
              <div className={gridStyles.aiBriefingPlaceholder}>
                Once you submit a plan, your AI dive briefing will appear here
                with location-specific conditions, site hazards, and
                personalized recommendations.
              </div>
            )}
          </section>
        </div>

        {/* Bottom zone: Past plans */}
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
    </main>
  );
}
