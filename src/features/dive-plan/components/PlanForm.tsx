"use client";

import {
  ChangeEvent,
  FocusEvent,
  FormEvent,
  useState,
  useEffect,
  useRef,
} from "react";
import { PlanData, ProfileContext } from "@/features/dive-plan/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { getUnitLabel, mToFt, ftToM } from "@/lib/units";
import {
  resolveHighestCert,
  interpolateNdl,
} from "@/features/dive-plan/services/riskCalculator";
import { FormUnitToggle } from "@/components/FormUnitToggle";
import cardStyles from "@/styles/components/Card.module.css";
import formStyles from "@/styles/components/Form.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import planFormStyles from "./PlanForm.module.css";

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
  profileContext?: ProfileContext | null;
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
  profileContext,
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
  const [todayStr, setTodayStr] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [depthError, setDepthError] = useState<string | null>(null);
  const [bottomTimeError, setBottomTimeError] = useState<string | null>(null);
  const [bottomTimeWarning, setBottomTimeWarning] = useState<string | null>(
    null
  );
  const prevSubmittedPlanRef = useRef<PlanData | null>(submittedPlan);
  const [authedDiveCount, setAuthedDiveCount] = useState("");
  const [authedLastDive, setAuthedLastDive] = useState("");
  const profilePrefilledRef = useRef(false);

  // Track submittedPlan changes using ref (no setState in effect)
  // Form fields are initialized via useState and reset via formKey remount
  useEffect(() => {
    if (submittedPlan !== prevSubmittedPlanRef.current) {
      prevSubmittedPlanRef.current = submittedPlan;
    }
  }, [submittedPlan]);

  useEffect(() => {
    if (profileContext && !profilePrefilledRef.current) {
      profilePrefilledRef.current = true;
      setAuthedDiveCount(
        profileContext.totalDives > 0 ? String(profileContext.totalDives) : ""
      );
      setAuthedLastDive(profileContext.lastDiveDate ?? "");
    }
  }, [profileContext]);

  // Compute today's date client-side only to avoid SSR hydration mismatch
  useEffect(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setTodayStr(`${yyyy}-${mm}-${dd}`);
  }, []);

  const validateDate = (
    e: ChangeEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>
  ) => {
    if (todayStr && e.target.value && e.target.value < todayStr) {
      setDateError("Please select today or a future date.");
    } else {
      setDateError(null);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    let hasBlockingError = false;

    if (todayStr) {
      const dateInput = e.currentTarget.elements.namedItem(
        "date"
      ) as HTMLInputElement | null;
      if (dateInput?.value && dateInput.value < todayStr) {
        e.preventDefault();
        setDateError("Please select today or a future date.");
        return;
      }
    }
    setDateError(null);

    // Clear previous validation
    setDepthError(null);
    setBottomTimeError(null);
    setBottomTimeWarning(null);

    const depthInput = parseFloat(maxDepth);
    const bottomTimeInput = parseFloat(
      (e.currentTarget.elements.namedItem("bottomTime") as HTMLInputElement)
        ?.value ?? "0"
    );

    // Convert UI depth to feet for comparison
    const depthFt = prefs.depth === "ft" ? depthInput : mToFt(depthInput);

    // --- Resolve cert ---
    let certNames: string[] = [];
    if (mode === "authed" && profileContext?.certifications?.length) {
      certNames = profileContext.certifications.map((c) => c.name);
    } else if (mode === "public") {
      const highestCertSelect = e.currentTarget.elements.namedItem(
        "highestCert"
      ) as HTMLSelectElement | null;
      const highestCert = highestCertSelect?.value;
      if (highestCert) certNames = [highestCert];
    }
    const resolved = resolveHighestCert(certNames);

    // --- Unit-aware display helpers ---
    const isMetric = prefs.depth === "m";
    const unitLabel = isMetric ? "m" : "ft";
    const displayDepthVal = isMetric
      ? Math.round(ftToM(depthFt))
      : Math.round(depthFt);
    const displayCertLimit = isMetric
      ? Math.round(ftToM(resolved.depthLimitFt))
      : resolved.depthLimitFt;
    const displayRecLimit = isMetric ? "40m" : "130ft";

    // --- Blocking: depth exceeds cert limit ---
    if (certNames.length > 0 && depthFt > resolved.depthLimitFt) {
      e.preventDefault();
      setDepthError(
        `Your planned depth of ${displayDepthVal}${unitLabel} exceeds your ${resolved.name} certification limit of ${displayCertLimit}${unitLabel}.`
      );
      hasBlockingError = true;
    }

    // --- Blocking: depth exceeds 130ft with recreational cert ---
    if (depthFt > 130 && resolved.depthLimitFt <= 130) {
      e.preventDefault();
      setDepthError(
        `Depths beyond ${displayRecLimit} are outside recreational diving limits and require technical certification.`
      );
      hasBlockingError = true;
    }

    // --- Blocking: bottom time < 10 min ---
    if (bottomTimeInput < 10) {
      e.preventDefault();
      setBottomTimeError("Bottom time must be at least 10 minutes.");
      hasBlockingError = true;
    }

    if (hasBlockingError) return;

    // --- Non-blocking: NDL proximity warning ---
    if (depthFt > 0 && bottomTimeInput > 0) {
      const ndl = interpolateNdl(depthFt);
      if (bottomTimeInput / ndl >= 0.8) {
        setBottomTimeWarning(
          `Your planned bottom time of ${bottomTimeInput}min approaches the no-decompression limit of ${Math.round(ndl)}min at this depth. Dive conservatively.`
        );
      }
    }

    onSubmit(e);
  };

  return (
    <div className={cardStyles.elevatedForm}>
      <form
        key={`${formKey}-${prefs.depth}`}
        onSubmit={handleSubmit}
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

        <div className={formStyles.field}>
          <label htmlFor="date" className={formStyles.label}>
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            min={todayStr ?? undefined}
            defaultValue={submittedPlan?.date ?? ""}
            className={formStyles.input}
            onChange={validateDate}
            onBlur={validateDate}
          />
          {dateError && <p className={formStyles.error}>{dateError}</p>}
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
                  Base certification
                </label>
                <select
                  id="highestCert"
                  name="highestCert"
                  defaultValue=""
                  className={formStyles.select}
                >
                  <option value="" disabled>
                    Select...
                  </option>
                  <option value="Open Water Diver">Open Water Diver</option>
                  <option value="Advanced Open Water Diver">
                    Advanced Open Water Diver
                  </option>
                  <option value="Deep Diver">Deep Diver</option>
                  <option value="Divemaster">Divemaster</option>
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
            {depthError && <p className={formStyles.error}>{depthError}</p>}
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
            {bottomTimeError && (
              <p className={formStyles.error}>{bottomTimeError}</p>
            )}
            {bottomTimeWarning && (
              <p className={planFormStyles.warning}>{bottomTimeWarning}</p>
            )}
          </div>
        </div>

        {mode === "authed" && (
          <div
            style={{
              borderTop: "1px solid var(--color-border-default)",
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
              Your experience
            </p>
            <p
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-3)",
              }}
            >
              Your dive profile data is pre-filled below. You can edit these
              fields for this plan if your logged history doesn&apos;t reflect
              your actual experience.
            </p>
            <div
              className={formStyles.formGrid}
              style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
            >
              <div className={formStyles.field}>
                <label htmlFor="diveCountRange" className={formStyles.label}>
                  Total dives
                </label>
                <input
                  type="number"
                  id="diveCountRange"
                  name="diveCountRange"
                  min={0}
                  value={authedDiveCount}
                  onChange={(e) => setAuthedDiveCount(e.target.value)}
                  placeholder="e.g. 150"
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.field}>
                <label htmlFor="lastDiveRecency" className={formStyles.label}>
                  Last dive
                </label>
                <input
                  type="date"
                  id="lastDiveRecency"
                  name="lastDiveRecency"
                  value={authedLastDive}
                  onChange={(e) => setAuthedLastDive(e.target.value)}
                  className={formStyles.input}
                />
              </div>
            </div>

            <div style={{ marginTop: "var(--space-4)" }}>
              <label className={formStyles.label}>Your certifications</label>
              {profileContext?.certifications &&
              profileContext.certifications.length > 0 ? (
                <div className={planFormStyles.certList}>
                  {profileContext.certifications.map((cert) => (
                    <span key={cert.name} className={planFormStyles.certChip}>
                      {cert.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No certifications on profile
                </p>
              )}
              <a
                href="/certifications"
                className={planFormStyles.certEditLink}
                style={{ display: "inline-block", marginTop: "var(--space-2)" }}
              >
                Edit certifications →
              </a>
            </div>
          </div>
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
