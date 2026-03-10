import { FormEvent, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { PastPlan } from "@/features/dive-plan/types";
import { depthInputToCm, cmToUI } from "@/lib/units";
import { usePlanSubmission } from "./usePlanSubmission";

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

  const [pastPlans, setPastPlans] = useState<PastPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasDraftPlan = Boolean(draftPlan && submission.aiBriefing);

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
      await handlePreviewSubmit(e);
    }
  };

  const saveDraftPlan = useCallback(async (): Promise<void> => {
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

      if (data.plan) {
        const savedPlan = data.plan as PastPlan;
        setPastPlans((prev) => [savedPlan, ...prev]);
      }

      setAiAdvice(data.aiAdvice);
      setAiBriefing(data.aiBriefing ?? null);

      setDraftPlan(null);
      setDraftRiskLevel(null);

      setStatusMessage("Plan saved ✅");
      setTimeout(() => setStatusMessage(null), 3000);
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

  const deletePlan = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this plan? This action cannot be undone."
    );
    if (!confirmed) return;

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
    } catch (err) {
      console.error(err);
      setApiError("Failed to delete plan.");
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
    handleSubmit,
    saveDraftPlan,
    handleSelectPastPlan,
    handleCancelEdit,
    deletePlan,
    handleDeletePlan,
    handleNewPlan,
    refreshAfterAuth,
  };
}
