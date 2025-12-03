"use client";

import { FormEvent, useState, useEffect } from "react";

type PlanData = {
  region: string;
  siteName: string;
  date: string;
  maxDepth: number;
  bottomTime: number;
  experienceLevel: "Beginner" | "Intermediate" | "Advanced";
};

type RiskLevel = "Low" | "Moderate" | "High";

type PastPlan = PlanData & {
  id: string;
  riskLevel: RiskLevel | string;
  aiAdvice?: string | null;
};

function calculateRisk(plan: PlanData): RiskLevel {
  const { maxDepth, bottomTime } = plan;

  if (maxDepth > 40 || bottomTime > 50) {
    return "High";
  }

  if (maxDepth > 30 || bottomTime > 40) {
    return "Moderate";
  }

  return "Low";
}

function PlanSummary({ plan }: { plan: PlanData }) {
  const riskLevel = calculateRisk(plan);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
      <h2 className="mb-3 text-lg font-semibold">Dive Plan Summary</h2>
      <div className="space-y-1 text-sm">
        <p>
          <strong>Region:</strong> {plan.region}
        </p>
        <p>
          <strong>Site name:</strong> {plan.siteName}
        </p>
        <p>
          <strong>Date:</strong> {plan.date}
        </p>
        <p>
          <strong>Max depth:</strong> {plan.maxDepth} meters
        </p>
        <p>
          <strong>Bottom time:</strong> {plan.bottomTime} minutes
        </p>
        <p>
          <strong>Experience level:</strong> {plan.experienceLevel}
        </p>
        <p>
          <strong>Estimated risk:</strong> {riskLevel}
        </p>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const [submittedPlan, setSubmittedPlan] = useState<PlanData | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [pastPlans, setPastPlans] = useState<PastPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Used to force the form to remount so defaultValue updates
  const [formKey, setFormKey] = useState<string>("new");

  // Load past plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        setPlansError(null);
        const res = await fetch("/api/plan");
        if (!res.ok) {
          throw new Error(`Failed to fetch plans: ${res.status}`);
        }
        const data = await res.json();
        setPastPlans((data.plans ?? []) as PastPlan[]);
      } catch (err) {
        console.error(err);
        setPlansError("Failed to load past plans.");
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAiAdvice(null);
    setApiError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: PlanData = {
      region: formData.get("region") as string,
      siteName: formData.get("siteName") as string,
      date: formData.get("date") as string,
      maxDepth: Number(formData.get("maxDepth")),
      bottomTime: Number(formData.get("bottomTime")),
      experienceLevel: formData.get(
        "experienceLevel"
      ) as PlanData["experienceLevel"],
    };

    setSubmittedPlan(values);

    try {
      const isEditing = !!editingPlanId;

      const res = await fetch("/api/plan", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing ? { id: editingPlanId, ...values } : values
        ),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();
      setAiAdvice(data.aiAdvice);

      if (data.plan) {
        const updatedPlan = data.plan as PastPlan;

        setPastPlans((prev) => {
          // If editing, replace the existing entry
          if (editingPlanId) {
            return prev.map((p) => (p.id === editingPlanId ? updatedPlan : p));
          }
          // If creating, prepend
          return [updatedPlan, ...prev];
        });
      }

      // if editing a plan, show the updated plan + updated advice before resetting
      if (editingPlanId) {
        setSubmittedPlan(values);
        setAiAdvice(data.aiAdvice);
        setStatusMessage("Plan updated ✅");
        setTimeout(() => setStatusMessage(null), 3000);
      }

      // if editing an existing plan, reset the form back to "new"
      if (editingPlanId) {
        setSubmittedPlan(null);
        setAiAdvice(null);
        setEditingPlanId(null);
        setFormKey(`new-${Date.now()}`);
      }
    } catch (err: any) {
      console.error(err);
      setApiError("Failed to get advice from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewPlan = () => {
    setSubmittedPlan(null);
    setAiAdvice(null);
    setApiError(null);
    setEditingPlanId(null); // 👈 add this
    setFormKey(`new-${Date.now()}`);
  };

  const handleSelectPastPlan = (plan: PastPlan) => {
    // Strip DB fields down to PlanData
    const { id, aiAdvice: savedAdvice, ...rest } = plan;

    const planData: PlanData = {
      region: rest.region,
      siteName: rest.siteName,
      date: rest.date,
      maxDepth: rest.maxDepth,
      bottomTime: rest.bottomTime,
      experienceLevel: rest.experienceLevel,
    };

    setSubmittedPlan(planData);
    setAiAdvice(savedAdvice ?? null);
    setApiError(null);

    setEditingPlanId(id);

    // Force the form to remount so defaultValue picks up this plan
    setFormKey(`plan-${id}-${Date.now()}`);
  };

  const deletePlan = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this plan? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setApiError(null);

      const res = await fetch(`/api/plan?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      // Remove from sidebar list
      setPastPlans((prev) => prev.filter((p) => p.id !== id));

      // If the deleted plan was being edited / shown, clear it
      if (editingPlanId === id) {
        setEditingPlanId(null);
        setSubmittedPlan(null);
        setAiAdvice(null);
        setFormKey(`deleted-${Date.now()}`);
      }

      setStatusMessage("Plan deleted ✅");
    } catch (err) {
      console.error(err);
      setApiError("Failed to delete plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!editingPlanId) return;
    await deletePlan(editingPlanId);
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setSubmittedPlan(null);
    setAiAdvice(null);
    setApiError(null);
    setStatusMessage(null);

    // Reset form fields
    setFormKey(`cancel-${Date.now()}`);
  };

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

          <form
            key={formKey}
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg"
          >
            <div className="space-y-1">
              <label htmlFor="region" className="text-sm text-slate-200">
                Region
              </label>
              <input
                type="text"
                id="region"
                name="region"
                required
                placeholder="Roatán, Red Sea, local quarry..."
                defaultValue={submittedPlan?.region ?? ""}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="siteName" className="text-sm text-slate-200">
                Site name
              </label>
              <input
                type="text"
                id="siteName"
                name="siteName"
                required
                placeholder="Mary's Place"
                defaultValue={submittedPlan?.siteName ?? ""}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="date" className="text-sm text-slate-200">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  defaultValue={submittedPlan?.date ?? ""}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="experienceLevel"
                  className="text-sm text-slate-200"
                >
                  Experience level
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  required
                  defaultValue={submittedPlan?.experienceLevel ?? ""}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="maxDepth" className="text-sm text-slate-200">
                  Max depth in meters
                </label>
                <input
                  type="number"
                  id="maxDepth"
                  name="maxDepth"
                  min={0}
                  required
                  defaultValue={
                    submittedPlan?.maxDepth != null
                      ? String(submittedPlan.maxDepth)
                      : ""
                  }
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="bottomTime" className="text-sm text-slate-200">
                  Bottom time in minutes
                </label>
                <input
                  type="number"
                  id="bottomTime"
                  name="bottomTime"
                  min={0}
                  required
                  defaultValue={
                    submittedPlan?.bottomTime != null
                      ? String(submittedPlan.bottomTime)
                      : ""
                  }
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* Left group: primary + secondary */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm hover:bg-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none disabled:opacity-60"
                  disabled={loading}
                >
                  {loading
                    ? "Generating advice…"
                    : editingPlanId
                      ? "Update plan"
                      : "Submit plan"}
                </button>

                {editingPlanId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-100 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
                  >
                    Go back
                  </button>
                )}
              </div>

              {/* Right: destructive action */}
              {editingPlanId && (
                <button
                  type="button"
                  onClick={handleDeletePlan}
                  className="ml-auto inline-flex items-center justify-center rounded-md border border-red-500/70 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:border-red-400 hover:bg-red-500/20 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
                >
                  Delete plan
                </button>
              )}
            </div>

            {apiError && (
              <p className="mt-1 text-sm text-red-400">{apiError}</p>
            )}
          </form>
        </section>

        {/* Right column: summary, AI advice, past plans */}
        <section className="space-y-4">
          {/* Current plan + advice */}
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

          {/* Past plans sidebar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Past plans</h2>
            </div>

            {plansLoading && (
              <p className="text-sm text-slate-400">Loading past plans…</p>
            )}

            {plansError && <p className="text-sm text-red-400">{plansError}</p>}

            {!plansLoading && !plansError && pastPlans.length === 0 && (
              <p className="text-sm text-slate-400">
                No plans yet. Submit a dive plan to start building your history.
              </p>
            )}

            {!plansLoading && pastPlans.length > 0 && (
              <ul className="mt-2 space-y-3 text-sm">
                {pastPlans.map((plan) => (
                  <li
                    key={plan.id}
                    role="button"
                    onClick={() => handleSelectPastPlan(plan)}
                    className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950/40 p-3 transition-colors hover:border-cyan-400 hover:bg-slate-900/80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-medium">
                          {plan.siteName}{" "}
                          <span className="text-slate-400">
                            ({plan.region})
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {plan.date}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // don’t trigger edit
                            void deletePlan(plan.id); // use shared helper
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-300 hover:border-red-500 hover:bg-red-500/10 hover:text-red-400 focus:ring-1 focus:ring-red-500 focus:outline-none"
                          aria-label="Delete plan"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-300">
                      {plan.maxDepth}m · {plan.bottomTime}min ·{" "}
                      <span className="capitalize">{plan.experienceLevel}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Estimated risk:{" "}
                      <span className="text-slate-200">{plan.riskLevel}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
