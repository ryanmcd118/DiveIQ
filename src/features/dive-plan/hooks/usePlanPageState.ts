import { FormEvent, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { PastPlan, PlanData, AIBriefing, RiskLevel } from "@/features/dive-plan/types";
import { useUnitSystemOrLocal } from "@/hooks/useUnitSystemOrLocal";
import { uiToMetric } from "@/lib/units";

export function usePlanPageState() {
  const { unitSystem } = useUnitSystemOrLocal();
  
  // Draft state - the current plan being worked on (not yet saved)
  const [draftPlan, setDraftPlan] = useState<PlanData | null>(null);
  const [draftRiskLevel, setDraftRiskLevel] = useState<RiskLevel | null>(null);
  const [aiBriefing, setAiBriefing] = useState<AIBriefing | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  
  // Legacy submittedPlan - kept for form default values
  const [submittedPlan, setSubmittedPlan] = useState<PlanData | null>(null);
  
  // UI states
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Past plans state (for authenticated users)
  const [pastPlans, setPastPlans] = useState<PastPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Used to force the form to remount so defaultValue updates
  const [formKey, setFormKey] = useState<string>("new");

  // Use next-auth session for auth status
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";
  const isSessionLoading = sessionStatus === "loading";

  // Load past plans on mount (only for authenticated users)
  useEffect(() => {
    const fetchPlans = async () => {
      // Don't fetch if session is still loading
      if (isSessionLoading) return;
      
      // Don't fetch if not authenticated
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
          // User is not authenticated - this is not an error
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

  /**
   * Submit plan form - generates AI briefing WITHOUT saving
   * Uses the preview endpoint which doesn't require authentication
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAiAdvice(null);
    setAiBriefing(null);
    setApiError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Convert UI unit values to metric for database storage
    const maxDepthUI = formData.get("maxDepth");
    
    const values: PlanData = {
      region: formData.get("region") as string,
      siteName: formData.get("siteName") as string,
      date: formData.get("date") as string,
      maxDepth: uiToMetric(maxDepthUI, unitSystem, 'depth') ?? 0,
      bottomTime: Number(formData.get("bottomTime")),
      experienceLevel: formData.get(
        "experienceLevel"
      ) as PlanData["experienceLevel"],
    };

    setSubmittedPlan(values);
    setDraftPlan(values);

    try {
      // If editing an existing plan, use the update endpoint
      if (editingPlanId && isAuthenticated) {
        const res = await fetch("/api/dive-plans", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPlanId, ...values }),
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();
        setAiAdvice(data.aiAdvice);
        setAiBriefing(data.aiBriefing ?? null);
        setDraftRiskLevel(data.riskLevel ?? null);

        // Update past plans list
        if (data.plan) {
          const updatedPlan = data.plan as PastPlan;
          setPastPlans((prev) =>
            prev.map((p) => (p.id === editingPlanId ? updatedPlan : p))
          );
        }

        setStatusMessage("Plan updated ✅");
        setTimeout(() => setStatusMessage(null), 3000);

        // Reset editing state
        setEditingPlanId(null);
        setDraftPlan(null);
        setSubmittedPlan(null);
        setAiAdvice(null);
        setAiBriefing(null);
        setFormKey(`updated-${Date.now()}`);
      } else {
        // Use preview endpoint - no auth required, no saving
        const res = await fetch("/api/dive-plans/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();
        setAiAdvice(data.aiAdvice);
        setAiBriefing(data.aiBriefing ?? null);
        setDraftRiskLevel(data.riskLevel ?? null);
      }
    } catch (err) {
      console.error(err);
      setApiError("Failed to get advice from server.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save the current draft plan (explicit save action)
   * Requires authentication
   */
  const saveDraftPlan = useCallback(async (): Promise<void> => {
    if (!draftPlan || !isAuthenticated) {
      throw new Error("Cannot save: no draft plan or not authenticated");
    }

    setSaving(true);
    setApiError(null);

    try {
      const res = await fetch("/api/dive-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPlan),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();

      // Add the saved plan to past plans list
      if (data.plan) {
        const savedPlan = data.plan as PastPlan;
        setPastPlans((prev) => [savedPlan, ...prev]);
      }

      // Update briefing with saved data
      setAiAdvice(data.aiAdvice);
      setAiBriefing(data.aiBriefing ?? null);

      // Clear draft state after successful save
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
  }, [draftPlan, isAuthenticated]);

  /**
   * Check if there's a draft plan that can be saved
   */
  const hasDraftPlan = Boolean(draftPlan && aiBriefing);

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

  const handleSelectPastPlan = (plan: PastPlan) => {
    const { id, aiAdvice: savedAdvice, aiBriefing: savedBriefing, ...rest } = plan;

    const planData: PlanData = {
      region: rest.region,
      siteName: rest.siteName,
      date: rest.date,
      maxDepth: rest.maxDepth,
      bottomTime: rest.bottomTime,
      experienceLevel: rest.experienceLevel,
    };

    setSubmittedPlan(planData);
    setDraftPlan(null); // Not a draft - it's already saved
    setAiAdvice(savedAdvice ?? null);
    setAiBriefing(savedBriefing ?? null);
    setApiError(null);

    setEditingPlanId(id);
    setFormKey(`plan-${id}-${Date.now()}`);
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

  /**
   * Refresh auth state and past plans (called after auth modal success)
   */
  const refreshAfterAuth = useCallback(async () => {
    // Refetch past plans
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
    // Plan state
    submittedPlan,
    draftPlan,
    draftRiskLevel,
    hasDraftPlan,
    aiAdvice,
    aiBriefing,
    apiError,
    loading,
    saving,
    
    // Past plans
    pastPlans,
    plansLoading: plansLoading || isSessionLoading,
    plansError,
    editingPlanId,
    statusMessage,
    formKey,
    
    // Auth
    isAuthenticated,
    isSessionLoading,

    // Actions
    handleSubmit,
    saveDraftPlan,
    handleNewPlan,
    handleSelectPastPlan,
    deletePlan,
    handleDeletePlan,
    handleCancelEdit,
    refreshAfterAuth,
  };
}
