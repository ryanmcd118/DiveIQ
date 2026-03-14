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

const EMPTY_CONDITIONS: AIBriefing["conditions"] = {
  waterTemp: { value: "—", badge: null },
  visibility: { value: "—", badge: null },
  seaState: { value: "—", badge: null },
};

/**
 * Detect pre-Prompt-A schema responses. Uses !parsed.keyConsiderations (falsy)
 * rather than a property existence check — harmless since old-schema responses
 * never include this field.
 */
function isOldSchema(parsed: Record<string, unknown>): boolean {
  return (
    !parsed.keyConsiderations &&
    (Boolean(parsed.conditionsSnapshot) ||
      Boolean(parsed.quickLook) ||
      Boolean(parsed.sections) ||
      Boolean(parsed.whatMattersMost))
  );
}

/**
 * Parse raw AI JSON output into a typed AIBriefing. Throws on malformed or
 * empty JSON input — callers must wrap in try/catch and fall back to
 * getFallbackBriefing().
 */
export function parseAIBriefing(content: string): AIBriefing {
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
  else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
  jsonStr = jsonStr.trim();

  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

  // Old schema (pre-Prompt-A): conditionsSnapshot, quickLook, sections, etc.
  // Return safe empty briefing rather than crashing.
  if (isOldSchema(parsed)) {
    return {
      keyConsiderations: [],
      conditions: EMPTY_CONDITIONS,
      siteConditions: [],
      hazards: [],
      experienceNotes: [],
      gearNotes: [],
    };
  }

  return {
    keyConsiderations: Array.isArray(parsed.keyConsiderations)
      ? parsed.keyConsiderations.slice(0, 3).map(String)
      : [],
    conditions: parsed.conditions
      ? {
          waterTemp: parseConditionCard(
            (parsed.conditions as Record<string, unknown>).waterTemp
          ),
          visibility: parseConditionCard(
            (parsed.conditions as Record<string, unknown>).visibility
          ),
          seaState: parseConditionCard(
            (parsed.conditions as Record<string, unknown>).seaState
          ),
        }
      : EMPTY_CONDITIONS,
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
