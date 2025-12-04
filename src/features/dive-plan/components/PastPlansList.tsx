"use client";

import { PastPlan } from "@/features/dive-plan/types";
import cardStyles from "@/styles/components/Card.module.css";
import listStyles from "@/styles/components/List.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

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
    <div className={cardStyles.cardCompact}>
      <div className={cardStyles.header}>
        <h2 className={cardStyles.title}>Past plans</h2>
      </div>

      {plansLoading && <p className={listStyles.empty}>Loading past plans…</p>}

      {plansError && <p className="text-danger">{plansError}</p>}

      {!plansLoading && !plansError && pastPlans.length === 0 && (
        <p className={listStyles.empty}>
          No plans yet. Submit a dive plan to start building your history.
        </p>
      )}

      {!plansLoading && pastPlans.length > 0 && (
        <ul className={listStyles.listCompact} style={{ marginTop: "var(--space-2)" }}>
          {pastPlans.map((plan) => (
            <li
              key={plan.id}
              role="button"
              onClick={() => onSelectPlan(plan)}
              className={cardStyles.listItemInteractive}
            >
              <div className={listStyles.planHeader}>
                <div>
                  <span className={listStyles.planTitle}>
                    {plan.siteName}{" "}
                    <span className={listStyles.diveRegion}>({plan.region})</span>
                  </span>
                </div>

                <div className={listStyles.actionsCenter}>
                  <span className={listStyles.diveDate}>{plan.date}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onDeletePlan(plan.id);
                    }}
                    className={buttonStyles.iconDelete}
                    aria-label="Delete plan"
                  >
                    ×
                  </button>
                </div>
              </div>

              <p className={listStyles.planStats}>
                {plan.maxDepth}m · {plan.bottomTime}min ·{" "}
                <span style={{ textTransform: "capitalize" }}>
                  {plan.experienceLevel}
                </span>
              </p>
              <p className={listStyles.planRisk}>
                Estimated risk:{" "}
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {plan.riskLevel}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
