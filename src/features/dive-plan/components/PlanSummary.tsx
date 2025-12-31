"use client";

import { PlanData, RiskLevel } from "@/features/dive-plan/types";
import cardStyles from "@/styles/components/Card.module.css";

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
    <div className={cardStyles.cardCompact}>
      <h2 className={cardStyles.titleWithMargin}>Dive Plan Summary</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-1)",
          fontSize: "var(--font-size-sm)",
        }}
      >
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
