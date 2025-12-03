"use client";

import { FormEvent } from "react";
import { PlanData } from "@/app/plan/types";

interface PlanFormProps {
  formKey: string;
  submittedPlan: PlanData | null;
  editingPlanId: string | null;
  loading: boolean;
  apiError: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onDeletePlan: () => void;
}

export function PlanForm({
  formKey,
  submittedPlan,
  editingPlanId,
  loading,
  apiError,
  onSubmit,
  onCancelEdit,
  onDeletePlan,
}: PlanFormProps) {
  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
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
          <label htmlFor="experienceLevel" className="text-sm text-slate-200">
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
              onClick={onCancelEdit}
              className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-100 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
            >
              Go back
            </button>
          )}
        </div>

        {editingPlanId && (
          <button
            type="button"
            onClick={onDeletePlan}
            className="ml-auto inline-flex items-center justify-center rounded-md border border-red-500/70 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:border-red-400 hover:bg-red-500/20 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
          >
            Delete plan
          </button>
        )}
      </div>

      {apiError && <p className="mt-1 text-sm text-red-400">{apiError}</p>}
    </form>
  );
}
