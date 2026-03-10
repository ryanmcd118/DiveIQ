"use client";

import { usePublicPlanState } from "../hooks/usePublicPlanState";
import { AIDiveBriefing } from "./AIDiveBriefing";
import { PlanForm } from "./PlanForm";
import { SaveDivePlanButton } from "./SaveDivePlanButton";
import { AuthModal } from "@/features/auth/components/AuthModal";
import layoutStyles from "@/styles/components/Layout.module.css";
import gridStyles from "@/styles/components/PageGrid.module.css";
import backgroundStyles from "@/styles/components/Background.module.css";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

export function PublicPlanPageContent() {
  const {
    submittedPlan,
    hasDraftPlan,
    aiBriefing,
    apiError,
    loading,
    saving,
    formKey,
    isAuthenticated,
    isSessionLoading,
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    statusMessage,
    handleSubmit,
    saveDraftPlan,
    handleRequireAuth,
    handleCreateAccount,
    handleLogIn,
    handleAuthSuccess,
    handleGoogleSignIn,
  } = usePublicPlanState();

  if (isSessionLoading) {
    return (
      <>
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
        {/* Keep AuthModal mounted during session loading so async signup
            callbacks aren't dropped when the session briefly enters "loading" */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          initialMode={authModalMode}
          onGoogleSignIn={handleGoogleSignIn}
        />
      </>
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
            <SaveDivePlanButton
              isAuthenticated={isAuthenticated}
              hasPlanDraft={hasDraftPlan}
              onSaveAuthed={saveDraftPlan}
              onRequireAuth={handleRequireAuth}
              isSaving={saving}
              variant="header"
            />
          </div>
        </header>

        {/* Middle zone: Two-column layout */}
        <div className={gridStyles.planPageMiddle}>
          {/* Left column: Form */}
          <section className={gridStyles.planFormColumn}>
            <PlanForm
              mode="public"
              formKey={formKey}
              submittedPlan={submittedPlan}
              editingPlanId={null}
              loading={loading}
              apiError={apiError}
              onSubmit={handleSubmit}
              onCancelEdit={() => undefined}
              onDeletePlan={() => undefined}
            />
          </section>

          {/* Right column: AI briefing panel */}
          <section className={gridStyles.planAIColumn}>
            {loading || aiBriefing || submittedPlan ? (
              <div className={gridStyles.aiBriefingScrollWrapper}>
                <AIDiveBriefing
                  mode="public"
                  briefing={aiBriefing}
                  loading={loading}
                  compact={false}
                  scrollable={true}
                />
                {(aiBriefing ?? submittedPlan) && (
                  <>
                    {hasDraftPlan && (
                      <div
                        style={{
                          marginTop: "var(--space-4)",
                          padding: "var(--space-4)",
                          background: "var(--color-surface-alt)",
                          border: "1px solid var(--color-border-default)",
                          borderRadius: "var(--radius-lg)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-secondary)",
                            marginBottom: "var(--space-3)",
                            lineHeight: "1.5",
                          }}
                        >
                          Want a more personalized plan? Create a free account
                          and DiveIQ will factor in your actual logbook history,
                          certifications, and gear.
                        </p>
                        <button
                          type="button"
                          onClick={handleCreateAccount}
                          className={buttonStyles.primaryGradient}
                        >
                          Create account
                        </button>
                      </div>
                    )}
                    <p
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                        marginTop: "var(--space-4)",
                        lineHeight: "1.5",
                      }}
                    >
                      DiveIQ provides regional and conditions-based guidance.
                      For site-specific information, consult local dive
                      operators. Site-level conditions data isn&apos;t reliably
                      available in any digital platform — we focus on what we
                      can assess with confidence.
                    </p>
                  </>
                )}
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

        {/* Bottom zone: signup callout */}
        {!isAuthenticated && (
          <section className={gridStyles.planPageBottom}>
            <div className={cardStyles.elevatedForm}>
              <div style={{ padding: "var(--space-6)" }}>
                <h3
                  style={{
                    fontSize: "var(--font-size-lg)",
                    fontWeight: "var(--font-weight-semibold)",
                    marginBottom: "var(--space-2)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Save your plans
                </h3>
                <p
                  style={{
                    fontSize: "var(--font-size-base)",
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--space-4)",
                    lineHeight: "1.6",
                  }}
                >
                  Create an account to save dive plans and build your planning
                  history.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-3)",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    className={buttonStyles.primaryGradient}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    onClick={handleLogIn}
                    className={buttonStyles.secondary}
                    style={{
                      background: "transparent",
                      color: "var(--color-text-primary)",
                      textDecoration: "underline",
                    }}
                  >
                    Log in
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        onGoogleSignIn={handleGoogleSignIn}
      />

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
