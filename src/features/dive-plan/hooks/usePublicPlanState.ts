import { FormEvent, useState, useCallback, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  PastPlan,
  AIBriefing,
  RiskLevel,
  PlanData,
} from "@/features/dive-plan/types";
import { depthInputToCm } from "@/lib/units";
import { useUnitSystem } from "@/contexts/UnitSystemContext";
import { usePlanSubmission } from "./usePlanSubmission";

async function waitForSession(
  maxAttempts = 5,
  intervalMs = 300
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch("/api/auth/session");
      const session = (await res.json()) as { user?: { id?: string } };
      if (session?.user?.id) return true;
    } catch {
      // Response may be HTML during router.refresh() — treat as not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

export function usePublicPlanState() {
  const { setUnitSystem: setContextUnitSystem } = useUnitSystem();
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Local pastPlans setter — not rendered, but fetched after auth for behavioral parity
  const [, setPastPlans] = useState<PastPlan[]>([]);

  // Recover teaser data from homepage PlannerStub redirect
  const teaserRecoveredRef = useRef(false);
  useEffect(() => {
    if (teaserRecoveredRef.current) return;
    teaserRecoveredRef.current = true;

    try {
      const raw = sessionStorage.getItem("diveiq:plannerTeaser");
      if (!raw) return;
      sessionStorage.removeItem("diveiq:plannerTeaser");

      const { region, siteName, unitSystem } = JSON.parse(raw) as {
        region?: string;
        siteName?: string;
        unitSystem?: string;
      };

      submission.setSubmittedPlan({ region, siteName } as PlanData);
      submission.setFormKey("teaser-" + Date.now());

      // Clear submittedPlan after the form remounts and captures defaultValues,
      // so the right panel stays in placeholder mode until an actual submission.
      setTimeout(() => submission.setSubmittedPlan(null), 0);

      if (unitSystem === "metric" || unitSystem === "imperial") {
        setContextUnitSystem(unitSystem);
      }
    } catch {
      // sessionStorage or JSON.parse may fail — ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cache the latest preview briefing so guest save avoids a second OpenAI call
  const cachedBriefingRef = useRef<{
    aiBriefing: AIBriefing;
    riskLevel: RiskLevel;
  } | null>(null);

  const { aiBriefing, draftRiskLevel } = submission;

  useEffect(() => {
    if (aiBriefing && draftRiskLevel) {
      cachedBriefingRef.current = { aiBriefing, riskLevel: draftRiskLevel };
    }
  }, [aiBriefing, draftRiskLevel]);

  const hasDraftPlan = Boolean(draftPlan && submission.aiBriefing);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    return handlePreviewSubmit(e);
  };

  const saveDraftPlan = useCallback(async (): Promise<void> => {
    if (!draftPlan) {
      throw new Error("Cannot save: no draft plan");
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
          cachedBriefing: cachedBriefingRef.current?.aiBriefing,
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

      setStatusMessage(
        "Plan saved. Create a personalized plan next time by signing up — DiveIQ will factor in your logbook history, certifications, and gear."
      );
    } catch (err) {
      console.error(err);
      setApiError("Failed to save plan.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [
    draftPlan,
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

  // Persist the current draft to sessionStorage then navigate to Google OAuth.
  // The authed plan page recovers this after the redirect completes.
  const handleGoogleSignIn = useCallback(() => {
    try {
      sessionStorage.setItem(
        "diveiq:pendingDraft",
        JSON.stringify({
          draftPlan: draftPlan ?? null,
          cachedBriefing: cachedBriefingRef.current?.aiBriefing ?? null,
          prefs,
        })
      );
    } catch {
      // sessionStorage may be unavailable — proceed without persisting
    }
    void signIn("google", { callbackUrl: "/plan" });
  }, [draftPlan, prefs]);

  const handleAuthSuccess = useCallback(async () => {
    setShowAuthModal(false);

    const sessionReady = await waitForSession();

    if (!sessionReady) {
      setApiError(
        "Your account was created but we couldn't save your plan automatically. Please click Save Dive Plan to try again."
      );
      return;
    }

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
      try {
        sessionStorage.setItem("diveiq:pendingToast", "Plan saved");
      } catch {
        // ignore
      }
      router.push("/plan");
    } catch (err) {
      console.error("Auto-save after auth failed:", err);
      setApiError(
        "Your account was created but we couldn't save your plan automatically. Please click Save Dive Plan to try again."
      );
    }
  }, [router, saveDraftPlan, setApiError]);

  return {
    ...submission,
    isAuthenticated,
    isSessionLoading,
    saving,
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    hasDraftPlan,
    statusMessage,
    handleSubmit,
    saveDraftPlan,
    handleRequireAuth,
    handleCreateAccount,
    handleLogIn,
    handleAuthSuccess,
    handleGoogleSignIn,
    // pastPlans not returned — only used internally
  };
}
