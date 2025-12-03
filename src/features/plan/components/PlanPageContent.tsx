"use client";

import { usePlanPageState } from "../hooks/usePlanPageState";
import { PlanSummary } from "./PlanSummary";
import { PlanForm } from "./PlanForm";
import { PastPlansList } from "./PastPlansList";

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
    <main className="flex min-h-screen justify-center bg-slate-950 p-6 text-slate-100 md:p-10">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Left column: form */}
        <section className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dive Plan</h1>
            <p className="mt-2 max-w-md text-sm text-slate-400">
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
        <section className="space-y-4">
          {submittedPlan ? (
            <>
              <PlanSummary plan={submittedPlan} />

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
                <h3 className="mb-2 text-lg font-semibold">
                  AI Dive Buddy Advice
                </h3>
                {loading && (
                  <p className="text-sm text-slate-400">Loading advice…</p>
                )}
                {aiAdvice && !loading && (
                  <p className="text-sm whitespace-pre-line text-slate-200">
                    {aiAdvice}
                  </p>
                )}
                {!loading && !aiAdvice && !apiError && (
                  <p className="text-sm text-slate-500">
                    Submit a plan to see AI-backed safety feedback here.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400 shadow-lg">
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
        <div className="pointer-events-none fixed bottom-4 left-4 z-50">
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-slate-900/95 px-3 py-2 text-sm text-emerald-100 shadow-lg">
            <span className="text-lg">✅</span>
            <span>{statusMessage}</span>
          </div>
        </div>
      )}
    </main>
  );
}
