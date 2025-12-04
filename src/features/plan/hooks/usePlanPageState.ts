import { FormEvent, useEffect, useState } from "react";
import { PastPlan, PlanData } from "@/features/plan/types";

export function usePlanPageState() {
  const [submittedPlan, setSubmittedPlan] = useState<PlanData | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [pastPlans, setPastPlans] = useState<PastPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Used to force the form to remount so defaultValue updates
  const [formKey, setFormKey] = useState<string>("new");

  // Load past plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        setPlansError(null);
        const res = await fetch("/api/plan");
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
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAiAdvice(null);
    setApiError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: PlanData = {
      region: formData.get("region") as string,
      siteName: formData.get("siteName") as string,
      date: formData.get("date") as string,
      maxDepth: Number(formData.get("maxDepth")),
      bottomTime: Number(formData.get("bottomTime")),
      experienceLevel: formData.get(
        "experienceLevel"
      ) as PlanData["experienceLevel"],
    };

    setSubmittedPlan(values);

    try {
      const isEditing = !!editingPlanId;

      const res = await fetch("/api/plan", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing ? { id: editingPlanId, ...values } : values
        ),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();
      setAiAdvice(data.aiAdvice);

      if (data.plan) {
        const updatedPlan = data.plan as PastPlan;

        setPastPlans((prev) => {
          if (editingPlanId) {
            return prev.map((p) => (p.id === editingPlanId ? updatedPlan : p));
          }
          return [updatedPlan, ...prev];
        });
      }

      if (editingPlanId) {
        setSubmittedPlan(values);
        setAiAdvice(data.aiAdvice);
        setStatusMessage("Plan updated ✅");
        setTimeout(() => setStatusMessage(null), 3000);

        // reset form back to "new"
        setSubmittedPlan(null);
        setAiAdvice(null);
        setEditingPlanId(null);
        setFormKey(`new-${Date.now()}`);
      }
    } catch (err) {
      console.error(err);
      setApiError("Failed to get advice from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewPlan = () => {
    setSubmittedPlan(null);
    setAiAdvice(null);
    setApiError(null);
    setEditingPlanId(null);
    setFormKey(`new-${Date.now()}`);
  };

  const handleSelectPastPlan = (plan: PastPlan) => {
    const { id, aiAdvice: savedAdvice, ...rest } = plan;

    const planData: PlanData = {
      region: rest.region,
      siteName: rest.siteName,
      date: rest.date,
      maxDepth: rest.maxDepth,
      bottomTime: rest.bottomTime,
      experienceLevel: rest.experienceLevel,
    };

    setSubmittedPlan(planData);
    setAiAdvice(savedAdvice ?? null);
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

      const res = await fetch(`/api/plan?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      setPastPlans((prev) => prev.filter((p) => p.id !== id));

      if (editingPlanId === id) {
        setEditingPlanId(null);
        setSubmittedPlan(null);
        setAiAdvice(null);
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
    setAiAdvice(null);
    setApiError(null);
    setStatusMessage(null);
    setFormKey(`cancel-${Date.now()}`);
  };

  return {
    submittedPlan,
    aiAdvice,
    apiError,
    loading,
    pastPlans,
    plansLoading,
    plansError,
    editingPlanId,
    statusMessage,
    formKey,

    handleSubmit,
    handleNewPlan,
    handleSelectPastPlan,
    deletePlan,
    handleDeletePlan,
    handleCancelEdit,
  };
}
