"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { PlanData } from "@/features/dive-plan/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { getUnitLabel } from "@/lib/units";
import { FormUnitToggle } from "@/components/FormUnitToggle";
import { useCertificationDefinitions } from "../hooks/useCertificationDefinitions";
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
  const { definitions: certDefs, loading: certDefsLoading } =
    useCertificationDefinitions();

  // Controlled state for unit-bearing fields (in UI units)
  // Initialize from submittedPlan if it exists (PlanData.maxDepth is already in UI units)
  const [maxDepth, setMaxDepth] = useState<string>(() => {
    if (!submittedPlan?.maxDepth) return "";
    return String(Math.round(submittedPlan.maxDepth));
  });
  const prevSubmittedPlanRef = useRef<PlanData | null>(submittedPlan);

  // Track submittedPlan changes using ref (no setState in effect)
  // Form fields are initialized via useState and reset via formKey remount
  useEffect(() => {
    if (submittedPlan !== prevSubmittedPlanRef.current) {
      prevSubmittedPlanRef.current = submittedPlan;
    }
  }, [submittedPlan]);

  return (
    <div className={cardStyles.elevatedForm}>
      <form
        key={`${formKey}-${prefs.depth}`}
        onSubmit={onSubmit}
        className={formStyles.form}
      >
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

        {/* Manual experience fields — public mode only */}
        {mode === "public" && (
          <div
            style={{
              borderTop: "1px solid var(--color-border-subtle)",
              paddingTop: "var(--space-4)",
              marginTop: "var(--space-2)",
            }}
          >
            <p
              style={{
                fontSize: "var(--font-size-xs)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "var(--space-3)",
              }}
            >
              Experience (optional)
            </p>
            <div
              className={formStyles.formGrid}
              style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
            >
              <div className={formStyles.field}>
                <label htmlFor="diveCountRange" className={formStyles.label}>
                  Total dives
                </label>
                <select
                  id="diveCountRange"
                  name="diveCountRange"
                  className={formStyles.select}
                >
                  <option value="">Select...</option>
                  <option value="0–24 dives">0–24</option>
                  <option value="25–99 dives">25–99</option>
                  <option value="100–499 dives">100–499</option>
                  <option value="500+ dives">500+</option>
                </select>
              </div>

              <div className={formStyles.field}>
                <label htmlFor="lastDiveRecency" className={formStyles.label}>
                  Last dive
                </label>
                <select
                  id="lastDiveRecency"
                  name="lastDiveRecency"
                  className={formStyles.select}
                >
                  <option value="">Select...</option>
                  <option value="Within 3 months">&lt; 3 months</option>
                  <option value="3–12 months ago">3–12 months</option>
                  <option value="1–2 years ago">1–2 years</option>
                  <option value="2+ years ago">2+ years</option>
                </select>
              </div>

              <div className={formStyles.field}>
                <label htmlFor="highestCert" className={formStyles.label}>
                  Highest cert
                </label>
                <select
                  id="highestCert"
                  name="highestCert"
                  disabled={certDefsLoading}
                  className={formStyles.select}
                >
                  <option value="">
                    {certDefsLoading ? "Loading..." : "Select..."}
                  </option>
                  {certDefs.map((def) => (
                    <option key={`${def.agency}-${def.slug}`} value={def.name}>
                      {def.agency} — {def.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

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

        {mode === "authed" && (
          <p
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
              margin: "0 0 var(--space-2)",
            }}
          >
            Your diver profile will be used to personalize this plan.
          </p>
        )}

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
