import { FormEvent, useState } from "react";
import {
  PlanData,
  AIBriefing,
  RiskLevel,
  ProfileContext,
} from "@/features/dive-plan/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { depthInputToCm } from "@/lib/units";

export function usePlanSubmission() {
  const { prefs } = useUnitPreferences();

  const [draftPlan, setDraftPlan] = useState<PlanData | null>(null);
  const [submittedPlan, setSubmittedPlan] = useState<PlanData | null>(null);
  const [aiBriefing, setAiBriefing] = useState<AIBriefing | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [draftRiskLevel, setDraftRiskLevel] = useState<RiskLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState<string>("new");

  const handlePreviewSubmit = async (
    e: FormEvent<HTMLFormElement>,
    profile?: ProfileContext
  ) => {
    e.preventDefault();

    setAiAdvice(null);
    setAiBriefing(null);
    setApiError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const maxDepthUI = formData.get("maxDepth");
    const maxDepthUIString = typeof maxDepthUI === "string" ? maxDepthUI : null;
    const maxDepthCm = depthInputToCm(maxDepthUIString, prefs.depth) ?? 0;

    const regionValue = formData.get("region");
    const siteNameValue = formData.get("siteName");
    const dateValue = formData.get("date");
    const bottomTimeValue = formData.get("bottomTime");
    const experienceLevelValue = formData.get("experienceLevel");

    const diveCountRangeValue = formData.get("diveCountRange");
    const lastDiveRecencyValue = formData.get("lastDiveRecency");
    const highestCertValue = formData.get("highestCert");

    const values: PlanData = {
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
        : "Beginner") as PlanData["experienceLevel"],
    };

    const manualExperience =
      diveCountRangeValue || lastDiveRecencyValue || highestCertValue
        ? {
            diveCountRange:
              typeof diveCountRangeValue === "string" && diveCountRangeValue
                ? diveCountRangeValue
                : null,
            lastDiveRecency:
              typeof lastDiveRecencyValue === "string" && lastDiveRecencyValue
                ? lastDiveRecencyValue
                : null,
            highestCert:
              typeof highestCertValue === "string" && highestCertValue
                ? highestCertValue
                : null,
            experienceLevel: values.experienceLevel,
          }
        : undefined;

    setSubmittedPlan(values);
    setDraftPlan(values);

    try {
      const res = await fetch("/api/dive-plans/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          maxDepthCm,
          unitPreferences: prefs,
          profile,
          manualExperience,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();
      setAiAdvice(data.aiAdvice);
      setAiBriefing(data.aiBriefing ?? null);
      setDraftRiskLevel(data.riskLevel ?? null);
    } catch (err) {
      console.error(err);
      setApiError("Failed to get advice from server.");
    } finally {
      setLoading(false);
    }
  };

  return {
    prefs,
    draftPlan,
    setDraftPlan,
    submittedPlan,
    setSubmittedPlan,
    aiBriefing,
    setAiBriefing,
    aiAdvice,
    setAiAdvice,
    draftRiskLevel,
    setDraftRiskLevel,
    loading,
    setLoading,
    apiError,
    setApiError,
    formKey,
    setFormKey,
    handlePreviewSubmit,
  };
}
