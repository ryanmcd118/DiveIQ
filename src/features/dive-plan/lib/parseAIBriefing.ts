import type { AIBriefing, ConditionBadge } from "@/features/dive-plan/types";

function parseBadge(raw: unknown): ConditionBadge {
  if (raw === "seasonal" || raw === "forecast" || raw === "inferred")
    return raw;
  return null;
}

function parseConditionCard(raw: unknown): {
  value: string;
  badge: ConditionBadge;
} {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    return {
      value: typeof r.value === "string" ? r.value : "Unknown",
      badge: parseBadge(r.badge),
    };
  }
  return { value: "Unknown", badge: null };
}

export function parseAIBriefing(content: string): AIBriefing {
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
  else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
  jsonStr = jsonStr.trim();

  const parsed = JSON.parse(jsonStr);

  return {
    bottomLine: typeof parsed.bottomLine === "string" ? parsed.bottomLine : "",
    keyConsiderations: Array.isArray(parsed.keyConsiderations)
      ? parsed.keyConsiderations.slice(0, 3).map(String)
      : [],
    conditions: {
      waterTemp: parseConditionCard(parsed.conditions?.waterTemp),
      visibility: parseConditionCard(parsed.conditions?.visibility),
      seaState: parseConditionCard(parsed.conditions?.seaState),
    },
    siteConditions: Array.isArray(parsed.siteConditions)
      ? parsed.siteConditions.map(String)
      : [],
    hazards: Array.isArray(parsed.hazards) ? parsed.hazards.map(String) : [],
    experienceNotes: Array.isArray(parsed.experienceNotes)
      ? parsed.experienceNotes.map(String)
      : [],
    gearNotes: Array.isArray(parsed.gearNotes)
      ? parsed.gearNotes.map(String)
      : [],
  };
}
