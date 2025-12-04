"use client";

import { FormEvent } from "react";
import { PlanData } from "@/features/dive-plan/types";
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
