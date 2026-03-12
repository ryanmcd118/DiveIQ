import { FormEvent, useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { PastPlan, PlanData, AIBriefing } from "@/features/dive-plan/types";
import { depthInputToCm, cmToUI } from "@/lib/units";
import { usePlanSubmission } from "./usePlanSubmission";
import { useDivePlanProfileContext } from "./useDivePlanProfileContext";

export function useAuthedPlanState() {
  const submission = usePlanSubmission();
  const {
    prefs,
    draftPlan,
    setDraftPlan,
    setSubmittedPlan,
    setAiBriefing,
    setAiAdvice,
    setDraftRiskLevel,
    setLoading,
    setApiError,
    setFormKey,
    handlePreviewSubmit,
  } = submission;

  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";
  const isSessionLoading = sessionStatus === "loading";

  const { profileContext, profileLoading, profileError } =
    useDivePlanProfileContext();

  const [pastPlans, setPastPlans] = useState<PastPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasDraftPlan = Boolean(draftPlan && submission.aiBriefing);

  // Recover a pending draft saved to sessionStorage before a Google OAuth redirect.
  // Runs once after the session settles to "authenticated".
  const pendingDraftRecoveredRef = useRef(false);
  useEffect(() => {
    if (isSessionLoading || pendingDraftRecoveredRef.current) return;
    pendingDraftRecoveredRef.current = true;

    if (!isAuthenticated) return;

    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem("diveiq:pendingDraft");
    } catch {
      return;
    }
    if (!stored) return;

    try {
      sessionStorage.removeItem("diveiq:pendingDraft");
    } catch {
      // ignore
    }

    type PendingDraft = {
      draftPlan: PlanData | null;
      cachedBriefing: AIBriefing | null;
      prefs: { depth: "m" | "ft" };
    };
    let parsed: PendingDraft | null = null;
    try {
      parsed = JSON.parse(stored) as PendingDraft;
    } catch {
      return;
    }

    if (!parsed?.draftPlan) return;

    const {
      draftPlan: pendingDraft,
      cachedBriefing,
      prefs: storedPrefs,
    } = parsed as Required<PendingDraft> & { draftPlan: PlanData };
    const maxDepthCm =
      depthInputToCm(pendingDraft.maxDepth, storedPrefs.depth) ?? 0;

    setSaving(true);
    setApiError(null);

    void fetch("/api/dive-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...pendingDraft,
        maxDepthCm,
        unitPreferences: storedPrefs,
        cachedBriefing: cachedBriefing ?? undefined,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<{
          plan?: PastPlan;
          aiAdvice?: string;
          aiBriefing?: AIBriefing;
        }>;
      })
      .then((data) => {
        if (data.plan) {
          setPastPlans((prev) => [data.plan as PastPlan, ...prev]);
        }
        setStatusMessage("Plan saved ✅");
        setTimeout(() => setStatusMessage(null), 3000);
      })
      .catch((err: unknown) => {
        console.error(
          "Failed to recover pending draft after Google OAuth:",
          err
        );
        setApiError(
          "We couldn't automatically save your plan. Please try submitting it again."
        );
      })
      .finally(() => setSaving(false));
  }, [isAuthenticated, isSessionLoading, setApiError]);

  // Load past plans on mount (only for authenticated users)
  useEffect(() => {
    const fetchPlans = async () => {
      if (isSessionLoading) return;

      if (!isAuthenticated) {
        setPlansLoading(false);
        setPastPlans([]);
        return;
      }

      try {
        setPlansLoading(true);
        setPlansError(null);
        const res = await fetch("/api/dive-plans");
        if (res.status === 401) {
          setPastPlans([]);
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch plans: ${res.status}`);
        }
        const data = await res.json();
        setPastPlans((data.plans ?? []) as PastPlan[]);
      } catch (err) {
        console.error(err);
        setPlansError("Failed to load past plans.");
      } finally {
        setPlansLoading(false);
      }
    };

    void fetchPlans();
  }, [isAuthenticated, isSessionLoading]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    if (editingPlanId && isAuthenticated) {
      e.preventDefault();

      setAiAdvice(null);
      setAiBriefing(null);
      setApiError(null);
      setLoading(true);

      const formData = new FormData(e.currentTarget);

      const maxDepthUI = formData.get("maxDepth");
      const maxDepthUIString =
        typeof maxDepthUI === "string" ? maxDepthUI : null;
      const maxDepthCm = depthInputToCm(maxDepthUIString, prefs.depth) ?? 0;

      const regionValue = formData.get("region");
      const siteNameValue = formData.get("siteName");
      const dateValue = formData.get("date");
      const bottomTimeValue = formData.get("bottomTime");
      const experienceLevelValue = formData.get("experienceLevel");

      const values = {
        region: typeof regionValue === "string" ? regionValue : "",
        siteName: typeof siteNameValue === "string" ? siteNameValue : "",
        date: typeof dateValue === "string" ? dateValue : "",
        maxDepth: parseFloat(maxDepthUIString ?? "0") || 0,
        bottomTime:
          typeof bottomTimeValue === "string"
            ? Number(bottomTimeValue)
            : Number(bottomTimeValue ?? 0),
        experienceLevel: (typeof experienceLevelValue === "string"
          ? experienceLevelValue
          : "Beginner") as import("@/features/dive-plan/types").PlanData["experienceLevel"],
      };

      setSubmittedPlan(values);
      setDraftPlan(values);

      try {
        const res = await fetch("/api/dive-plans", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingPlanId,
            ...values,
            maxDepthCm,
            unitPreferences: prefs,
            profile: profileContext ?? undefined,
          }),
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();
        setAiAdvice(data.aiAdvice);
        setAiBriefing(data.aiBriefing ?? null);
        setDraftRiskLevel(data.riskLevel ?? null);

        if (data.plan) {
          const updatedPlan = data.plan as PastPlan;
          setPastPlans((prev) =>
            prev.map((p) => (p.id === editingPlanId ? updatedPlan : p))
          );
        }

        setStatusMessage("Plan updated ✅");
        setTimeout(() => setStatusMessage(null), 3000);

        setEditingPlanId(null);
        setDraftPlan(null);
        setSubmittedPlan(null);
        setAiAdvice(null);
        setAiBriefing(null);
        setFormKey(`updated-${Date.now()}`);
      } catch (err) {
        console.error(err);
        setApiError("Failed to get advice from server.");
      } finally {
        setLoading(false);
      }
    } else {
      await handlePreviewSubmit(e, profileContext ?? undefined);
    }
  };

  const saveDraftPlan = useCallback(async (): Promise<PastPlan | null> => {
    if (!draftPlan || !isAuthenticated) {
      throw new Error("Cannot save: no draft plan or not authenticated");
    }

    setSaving(true);
    setApiError(null);

    try {
      const draftMaxDepthCm =
        depthInputToCm(draftPlan.maxDepth, prefs.depth) ?? 0;

      const res = await fetch("/api/dive-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draftPlan,
          maxDepthCm: draftMaxDepthCm,
          unitPreferences: prefs,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();

      let savedPlan: PastPlan | null = null;
      if (data.plan) {
        savedPlan = data.plan as PastPlan;
        setPastPlans((prev) => [savedPlan as PastPlan, ...prev]);
      }

      setAiAdvice(data.aiAdvice);
      setAiBriefing(data.aiBriefing ?? null);

      setDraftPlan(null);
      setDraftRiskLevel(null);

      setStatusMessage("Plan saved ✅");
      setTimeout(() => setStatusMessage(null), 3000);

      return savedPlan;
    } catch (err) {
      console.error(err);
      setApiError("Failed to save plan.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [
    draftPlan,
    isAuthenticated,
    prefs,
    setApiError,
    setAiBriefing,
    setAiAdvice,
    setDraftPlan,
    setDraftRiskLevel,
  ]);

  const handleSelectPastPlan = (plan: PastPlan) => {
    const {
      id,
      aiAdvice: savedAdvice,
      aiBriefing: savedBriefing,
      ...rest
    } = plan;

    const maxDepthUI = cmToUI(rest.maxDepthCm, prefs.depth) ?? 0;

    const planData = {
      region: rest.region,
      siteName: rest.siteName,
      date: rest.date,
      maxDepth: maxDepthUI,
      bottomTime: rest.bottomTime,
      experienceLevel: rest.experienceLevel,
    };

    setSubmittedPlan(planData);
    setDraftPlan(null);
    setAiAdvice(savedAdvice ?? null);
    setAiBriefing(savedBriefing ?? null);
    setApiError(null);

    setEditingPlanId(id);
    setFormKey(`plan-${id}-${Date.now()}`);
  };

  // Pre-fill the form from a past plan so the user can resubmit as a NEW plan.
  // Does not set editingPlanId, so handleSubmit falls through to handlePreviewSubmit (POST).
  const handleEditFromView = useCallback(
    (plan: PastPlan) => {
      const maxDepthUI = cmToUI(plan.maxDepthCm, prefs.depth) ?? 0;
      const planData: PlanData = {
        region: plan.region,
        siteName: plan.siteName,
        date: plan.date,
        maxDepth: maxDepthUI,
        bottomTime: plan.bottomTime,
        experienceLevel: plan.experienceLevel,
      };
      setSubmittedPlan(planData);
      setDraftPlan(null);
      setAiBriefing(null);
      setAiAdvice(null);
      setDraftRiskLevel(null);
      setApiError(null);
      setEditingPlanId(null);
      setFormKey(`edit-view-${plan.id}-${Date.now()}`);
    },
    [
      prefs.depth,
      setSubmittedPlan,
      setDraftPlan,
      setAiBriefing,
      setAiAdvice,
      setDraftRiskLevel,
      setApiError,
      setFormKey,
    ]
  );

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setSubmittedPlan(null);
    setDraftPlan(null);
    setDraftRiskLevel(null);
    setAiAdvice(null);
    setAiBriefing(null);
    setApiError(null);
    setStatusMessage(null);
    setFormKey(`cancel-${Date.now()}`);
  };

  const deletePlan = async (id: string): Promise<boolean> => {
    const confirmed = window.confirm(
      "Delete this plan? This action cannot be undone."
    );
    if (!confirmed) return false;

    try {
      setLoading(true);
      setApiError(null);

      const res = await fetch(`/api/dive-plans?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      setPastPlans((prev) => prev.filter((p) => p.id !== id));

      if (editingPlanId === id) {
        setEditingPlanId(null);
        setSubmittedPlan(null);
        setDraftPlan(null);
        setAiAdvice(null);
        setAiBriefing(null);
        setFormKey(`deleted-${Date.now()}`);
      }

      setStatusMessage("Plan deleted ✅");
      return true;
    } catch (err) {
      console.error(err);
      setApiError("Failed to delete plan.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!editingPlanId) return;
    await deletePlan(editingPlanId);
  };

  const handleNewPlan = () => {
    setSubmittedPlan(null);
    setDraftPlan(null);
    setDraftRiskLevel(null);
    setAiAdvice(null);
    setAiBriefing(null);
    setApiError(null);
    setEditingPlanId(null);
    setFormKey(`new-${Date.now()}`);
  };

  // Clears only the briefing so the page transitions back to the form view
  // without clearing the submitted plan data (pre-fills form on return).
  const clearBriefing = useCallback(() => {
    setAiBriefing(null);
    setApiError(null);
  }, [setAiBriefing, setApiError]);

  const refreshAfterAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/dive-plans");
      if (res.ok) {
        const data = await res.json();
        setPastPlans((data.plans ?? []) as PastPlan[]);
      }
    } catch (err) {
      console.error("Failed to refresh plans after auth:", err);
    }
  }, []);

  return {
    ...submission,
    isAuthenticated,
    isSessionLoading,
    saving,
    pastPlans,
    plansLoading: plansLoading || isSessionLoading,
    plansError,
    editingPlanId,
    statusMessage,
    hasDraftPlan,
    profileContext,
    profileLoading,
    profileError,
    handleSubmit,
    saveDraftPlan,
    handleSelectPastPlan,
    handleCancelEdit,
    handleEditFromView,
    clearBriefing,
    deletePlan,
    handleDeletePlan,
    handleNewPlan,
    refreshAfterAuth,
  };
}
