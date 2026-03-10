import { FormEvent, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PastPlan } from "@/features/dive-plan/types";
import { depthInputToCm } from "@/lib/units";
import { usePlanSubmission } from "./usePlanSubmission";

export function usePublicPlanState() {
  const submission = usePlanSubmission();
  const {
    prefs,
    draftPlan,
    setDraftPlan,
    setAiBriefing,
    setAiAdvice,
    setDraftRiskLevel,
    setApiError,
    handlePreviewSubmit,
  } = submission;

  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";
  const isSessionLoading = sessionStatus === "loading";

  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signup" | "login">(
    "signup"
  );

  // Local pastPlans setter — not rendered, but fetched after auth for behavioral parity
  const [, setPastPlans] = useState<PastPlan[]>([]);

  const hasDraftPlan = Boolean(draftPlan && submission.aiBriefing);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    return handlePreviewSubmit(e);
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

      setAiAdvice(data.aiAdvice);
      setAiBriefing(data.aiBriefing ?? null);

      setDraftPlan(null);
      setDraftRiskLevel(null);
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

  const handleRequireAuth = useCallback(() => {
    setAuthModalMode("signup");
    setShowAuthModal(true);
  }, []);

  const handleCreateAccount = useCallback(() => {
    setAuthModalMode("signup");
    setShowAuthModal(true);
  }, []);

  const handleLogIn = useCallback(() => {
    setAuthModalMode("login");
    setShowAuthModal(true);
  }, []);

  const handleAuthSuccess = useCallback(async () => {
    setShowAuthModal(false);

    router.refresh();

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Fetch past plans for behavioral parity (not rendered)
    try {
      const res = await fetch("/api/dive-plans");
      if (res.ok) {
        const data = await res.json();
        setPastPlans((data.plans ?? []) as PastPlan[]);
      }
    } catch (err) {
      console.error("Failed to refresh plans after auth:", err);
    }

    try {
      await saveDraftPlan();
    } catch (err) {
      console.error("Auto-save after auth failed:", err);
    }
  }, [router, saveDraftPlan]);

  return {
    ...submission,
    isAuthenticated,
    isSessionLoading,
    saving,
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    hasDraftPlan,
    handleSubmit,
    saveDraftPlan,
    handleRequireAuth,
    handleCreateAccount,
    handleLogIn,
    handleAuthSuccess,
    // pastPlans not returned — only used internally
  };
}
