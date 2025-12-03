"use client";

import { PastPlan } from "@/app/plan/types";

interface PastPlansListProps {
  pastPlans: PastPlan[];
  plansLoading: boolean;
  plansError: string | null;
  onSelectPlan: (plan: PastPlan) => void;
  onDeletePlan: (id: string) => void;
}

export function PastPlansList({
  pastPlans,
  plansLoading,
  plansError,
  onSelectPlan,
  onDeletePlan,
}: PastPlansListProps) {
  return (
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
              onClick={() => onSelectPlan(plan)}
              className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950/40 p-3 transition-colors hover:border-cyan-400 hover:bg-slate-900/80"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium">
                    {plan.siteName}{" "}
                    <span className="text-slate-400">({plan.region})</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{plan.date}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onDeletePlan(plan.id);
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
  );
}
