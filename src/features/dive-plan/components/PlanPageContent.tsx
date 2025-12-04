"use client";

import { usePlanPageState } from "../hooks/usePlanPageState";
import { PlanSummary } from "./PlanSummary";
import { PlanForm } from "./PlanForm";
import { PastPlansList } from "./PastPlansList";
import layoutStyles from "@/styles/components/Layout.module.css";
import gridStyles from "@/styles/components/PageGrid.module.css";
import listStyles from "@/styles/components/List.module.css";

export function PlanPageContent() {
  const {
    submittedPlan,
    aiAdvice,
    apiError,
    loading,
    pastPlans,
    plansLoading,
    plansError,
    editingPlanId,
    statusMessage,
    formKey,
    handleSubmit,
    handleSelectPastPlan,
    handleDeletePlan,
    handleCancelEdit,
    deletePlan,
  } = usePlanPageState();

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

        {/* Right column: summary, AI advice, past plans */}
        <section className={gridStyles.section}>
          {submittedPlan ? (
            <>
              <PlanSummary plan={submittedPlan} />

              <div className={gridStyles.aiAdviceCard}>
                <h3 className={gridStyles.aiAdviceTitle}>
                  AI Dive Buddy Advice
                </h3>
                {loading && (
                  <p className={listStyles.empty}>Loading advice…</p>
                )}
                {aiAdvice && !loading && (
                  <p className={gridStyles.aiAdviceContent}>
                    {aiAdvice}
                  </p>
                )}
                {!loading && !aiAdvice && !apiError && (
                  <p className="body-small text-disabled">
                    Submit a plan to see AI-backed safety feedback here.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className={gridStyles.placeholderCard}>
              Once you submit a plan, a summary and AI dive buddy advice will
              show up here.
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
