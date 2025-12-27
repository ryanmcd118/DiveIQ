"use client";

import { FormEvent, useState, useEffect } from "react";
import { PlanData } from "@/features/dive-plan/types";
import { useUnitSystemOrLocal } from "@/hooks/useUnitSystemOrLocal";
import { metricToUI, getUnitLabel } from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

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
  const { unitSystem } = useUnitSystemOrLocal();
  
  // Helper to convert metric to UI units for display
  const metricToUIString = (metricValue: number | null | undefined) => {
    if (metricValue == null) return "";
    const ui = metricToUI(metricValue, unitSystem, 'depth');
    return ui != null ? String(Math.round(ui)) : "";
  };
  
  // Controlled state for unit-bearing fields (in UI units)
  // Initialize from submittedPlan if it exists
  const [maxDepth, setMaxDepth] = useState<string>(() => {
    if (!submittedPlan?.maxDepth) return "";
    const ui = metricToUI(submittedPlan.maxDepth, unitSystem, 'depth');
    return ui != null ? String(Math.round(ui)) : "";
  });
  const [prevUnitSystem, setPrevUnitSystem] = useState<typeof unitSystem>(unitSystem);
  const [prevSubmittedPlan, setPrevSubmittedPlan] = useState<PlanData | null>(submittedPlan);

  // Convert metric values to UI units when plan loads or changes
  useEffect(() => {
    if (submittedPlan !== prevSubmittedPlan) {
      setPrevSubmittedPlan(submittedPlan);
      if (submittedPlan) {
        setMaxDepth(metricToUIString(submittedPlan.maxDepth));
      } else {
        setMaxDepth("");
      }
    }
  }, [submittedPlan, prevSubmittedPlan, unitSystem]);

  // Handle unit system change - convert current values
  useEffect(() => {
    if (prevUnitSystem !== unitSystem) {
      if (maxDepth) {
        const numValue = parseFloat(maxDepth);
        if (!isNaN(numValue)) {
          const metric = prevUnitSystem === 'metric' ? numValue : numValue / 3.28084;
          const newUI = unitSystem === 'metric' ? metric : metric * 3.28084;
          setMaxDepth(String(Math.round(newUI)));
        }
      }
      setPrevUnitSystem(unitSystem);
    }
  }, [unitSystem, prevUnitSystem, maxDepth]);

  return (
    <form key={formKey} onSubmit={onSubmit} className={cardStyles.cardForm}>
      <div className={formStyles.field}>
        <label htmlFor="region" className={formStyles.label}>
          Region
        </label>
        <input
          type="text"
          id="region"
          name="region"
          required
          placeholder="Roatán, Red Sea, local quarry..."
          defaultValue={submittedPlan?.region ?? ""}
          className={formStyles.input}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="siteName" className={formStyles.label}>
          Site name
        </label>
        <input
          type="text"
          id="siteName"
          name="siteName"
          required
          placeholder="Mary's Place"
          defaultValue={submittedPlan?.siteName ?? ""}
          className={formStyles.input}
        />
      </div>

      <div className={formStyles.formGrid}>
        <div className={formStyles.field}>
          <label htmlFor="date" className={formStyles.label}>
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            defaultValue={submittedPlan?.date ?? ""}
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.field}>
          <label htmlFor="experienceLevel" className={formStyles.label}>
            Experience level
          </label>
          <select
            id="experienceLevel"
            name="experienceLevel"
            required
            defaultValue={submittedPlan?.experienceLevel ?? ""}
            className={formStyles.select}
          >
            <option value="">Select...</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className={formStyles.formGrid}>
        <div className={formStyles.field}>
          <label htmlFor="maxDepth" className={formStyles.label}>
            Max depth ({getUnitLabel('depth', unitSystem)})
          </label>
          <input
            type="number"
            id="maxDepth"
            name="maxDepth"
            min={0}
            required
            value={maxDepth}
            onChange={(e) => setMaxDepth(e.target.value)}
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.field}>
          <label htmlFor="bottomTime" className={formStyles.label}>
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
            className={formStyles.input}
          />
        </div>
      </div>

      <div className={formStyles.buttonGroupWithDelete}>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button
            type="submit"
            className={buttonStyles.primary}
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
              className={buttonStyles.secondary}
            >
              Go back
            </button>
          )}
        </div>

        {editingPlanId && (
          <button
            type="button"
            onClick={onDeletePlan}
            className={buttonStyles.danger}
            style={{ marginLeft: "auto" }}
          >
            Delete plan
          </button>
        )}
      </div>

      {apiError && <p className={formStyles.error}>{apiError}</p>}
    </form>
  );
}
