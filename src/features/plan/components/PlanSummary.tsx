"use client";

import { PlanData, RiskLevel } from "@/app/plan/types";

/*
Hardcoded risk calculation

TODO: Replace with AI-based risk calculation
*/
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

export function PlanSummary({ plan }: { plan: PlanData }) {
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
