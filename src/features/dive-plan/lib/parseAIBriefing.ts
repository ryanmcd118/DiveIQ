import type { AIBriefing } from "@/features/dive-plan/types";
import { parseTemperatureString, parseDistanceString } from "@/lib/units";

export function parseAIBriefing(content: string): AIBriefing {
  // Try to extract JSON from the response
  let jsonStr = content.trim();

  // Remove markdown code fences if present
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  const parsed = JSON.parse(jsonStr);

  // Validate required fields and provide defaults
  const briefing: AIBriefing = {
    conditionsSnapshot:
      parsed.conditionsSnapshot ||
      "Conditions data unavailable for this location.",
    quickLook: {
      difficulty: {
        value: parsed.quickLook?.difficulty?.value || "Moderate",
        reason:
          parsed.quickLook?.difficulty?.reason || "Standard recreational dive",
      },
      suggestedExperience: {
        value:
          parsed.quickLook?.suggestedExperience?.value ||
          "Open Water certified",
        reason: parsed.quickLook?.suggestedExperience?.reason,
      },
      waterTemp: {
        value: parsed.quickLook?.waterTemp?.value || "Data unavailable",
        sourceTag: parsed.quickLook?.waterTemp?.sourceTag || "Inferred",
        // Parse numeric values from the string (convert to canonical Celsius)
        numericValue: parsed.quickLook?.waterTemp?.value
          ? parseTemperatureString(parsed.quickLook.waterTemp.value) ||
            undefined
          : undefined,
      },
      visibility: {
        value: parsed.quickLook?.visibility?.value || "Data unavailable",
        sourceTag: parsed.quickLook?.visibility?.sourceTag || "Inferred",
        // Parse numeric values from the string (convert to canonical meters)
        numericValue: parsed.quickLook?.visibility?.value
          ? parseDistanceString(parsed.quickLook.visibility.value) || undefined
          : undefined,
      },
      seaStateWind: {
        value:
          parsed.quickLook?.seaStateWind?.value || "Check local conditions",
        sourceTag: parsed.quickLook?.seaStateWind?.sourceTag || "Inferred",
      },
      confidence: {
        level: parsed.quickLook?.confidence?.level || "Low",
        reason:
          parsed.quickLook?.confidence?.reason || "Limited data available",
      },
    },
    whatMattersMost:
      parsed.whatMattersMost ||
      "Plan conservatively and stay within your training limits.",
    highlights: Array.isArray(parsed.highlights)
      ? parsed.highlights.slice(0, 3)
      : [],
    sections: Array.isArray(parsed.sections)
      ? parsed.sections.map((s: Record<string, unknown>) => ({
          title: String(s.title || "Notes"),
          sourceTags: Array.isArray(s.sourceTags) ? s.sourceTags : undefined,
          bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : undefined,
          paragraphs: Array.isArray(s.paragraphs)
            ? s.paragraphs.map(String)
            : undefined,
        }))
      : [],
  };

  return briefing;
}
