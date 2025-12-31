"use client";

import { FormEvent, useState, useEffect } from "react";
import { PlanData } from "@/features/dive-plan/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { getUnitLabel, depthInputToCm, cmToUI } from "@/lib/units";
import { FormUnitToggle } from "@/components/FormUnitToggle";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

type PlanFormMode = "public" | "authed";

interface PlanFormProps {
  mode?: PlanFormMode;
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
  mode = "authed",
  formKey,
  submittedPlan,
  editingPlanId,
  loading,
  apiError,
  onSubmit,
  onCancelEdit,
  onDeletePlan,
}: PlanFormProps) {
  // Use guest mode for public pages, auto/authed for authenticated pages
  const unitMode = mode === "public" ? "guest" : "authed";
  const { prefs } = useUnitPreferences({ mode: unitMode });

  // Controlled state for unit-bearing fields (in UI units)
  // Initialize from submittedPlan if it exists (PlanData.maxDepth is already in UI units)
  const [maxDepth, setMaxDepth] = useState<string>(() => {
    if (!submittedPlan?.maxDepth) return "";
    return String(Math.round(submittedPlan.maxDepth));
  });
  const [prevDepthUnit, setPrevDepthUnit] = useState(prefs.depth);
  const [prevSubmittedPlan, setPrevSubmittedPlan] = useState<PlanData | null>(
    submittedPlan
  );
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Convert input values when unit preference changes
  useEffect(() => {
    // Skip conversion on initial mount
    if (isInitialMount) {
      setIsInitialMount(false);
      setPrevDepthUnit(prefs.depth);
      return;
    }

    // Only convert if the depth unit actually changed
    if (prefs.depth === prevDepthUnit) return;

    // Convert maxDepth from old unit to new unit
    setMaxDepth((current) => {
      if (!current || current.trim() === "") return current;

      const numValue = parseFloat(current);
      if (isNaN(numValue)) return current;

      // Convert from old unit to canonical (cm), then to new unit
      const depthCm = depthInputToCm(numValue, prevDepthUnit);
      if (depthCm === null) return current;

      const newValue = cmToUI(depthCm, prefs.depth);
      if (newValue === null) return current;

      // Round to reasonable precision (1 decimal for meters, whole number for feet)
      return prefs.depth === "m" 
        ? String(Math.round(newValue * 10) / 10)
        : String(Math.round(newValue));
    });

    setPrevDepthUnit(prefs.depth);
  }, [prefs.depth, prevDepthUnit, isInitialMount]);

  // Update values when plan loads or changes
  useEffect(() => {
    if (submittedPlan !== prevSubmittedPlan) {
      setPrevSubmittedPlan(submittedPlan);
      if (submittedPlan) {
        setMaxDepth(
          submittedPlan.maxDepth
            ? String(Math.round(submittedPlan.maxDepth))
            : ""
        );
        // Reset prevDepthUnit when a new plan loads
        setPrevDepthUnit(prefs.depth);
      } else {
        setMaxDepth("");
      }
    }
  }, [submittedPlan, prevSubmittedPlan, prefs.depth]);

  return (
    <div className={cardStyles.elevatedForm}>
      <form key={formKey} onSubmit={onSubmit} className={formStyles.form}>
        {/* Units toggle - only show for public mode */}
        {mode === "public" && <FormUnitToggle />}
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
              Max depth ({getUnitLabel("depth", prefs)})
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
              className={buttonStyles.primaryGradient}
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
    </div>
  );
}
