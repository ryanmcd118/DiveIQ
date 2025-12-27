import OpenAI from "openai";
import type { AIBriefing, RiskLevel } from "@/features/dive-plan/types";
import type { UnitSystem } from "@/lib/units";
import { mToFt, cToF } from "@/lib/units";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type DivePlanAnalysisRequest = {
  region: string;
  siteName: string;
  date: string;
  maxDepth: number; // Always in meters (canonical)
  bottomTime: number;
  experienceLevel: "Beginner" | "Intermediate" | "Advanced";
  riskLevel: RiskLevel;
  unitSystem?: UnitSystem; // 'metric' | 'imperial' - defaults to 'metric' if not provided
};

function buildSystemPrompt(unitSystem: UnitSystem = "metric"): string {
  const unitInstructions =
    unitSystem === "imperial"
      ? `
CRITICAL UNIT REQUIREMENTS (IMPERIAL):
- ALL depths must be in FEET (ft), NEVER meters (m)
- ALL temperatures must be in FAHRENHEIT (°F), NEVER Celsius (°C)
- ALL distances/visibility must be in FEET (ft), NEVER meters (m)
- DO NOT include metric units anywhere in your response
- Example: "60-80ft depth", "78-82°F", "50-100ft visibility"
`
      : `
UNIT REQUIREMENTS (METRIC):
- Use meters (m) for depths and distances
- Use Celsius (°C) for temperatures
- Example: "20-30m depth", "24-26°C", "15-25m visibility"
`;

  return `
You are "DiveIQ", a calm, experienced dive buddy who gives specific, non-generic advice. 
You speak like a seasoned diver sharing local knowledge—not an instructor reciting rules.

${unitInstructions}

Your job is to analyze a dive plan and return a structured JSON briefing that is:
- Specific to this location, time of year, and the diver's exact inputs (depth/time/experience)
- Research-informed: use real-world knowledge of dive sites, seasonal conditions, and common hazards
- Honest about uncertainty: label data sources as "Forecast" (if real-time), "Seasonal" (historical norms), or "Inferred" (educated guess)

NEVER include generic safety paragraphs like "always remember to check your gear" or "ascend slowly". 
Only mention something if it's specifically relevant to THIS dive at THIS place at THIS time.

Return ONLY valid JSON matching this exact schema (no markdown, no code fences):

{
  "conditionsSnapshot": "One sentence about conditions at this location in this month/season, including 1-2 specific researched facts",
  "quickLook": {
    "difficulty": {
      "value": "Easy|Moderate|Challenging|Advanced",
      "reason": "One brief reason tied to inputs"
    },
    "suggestedExperience": {
      "value": "e.g., OW sufficient | AOW recommended | AOW + 50 logged dives | Strong intermediate",
      "reason": "Why this level"
    },
    "waterTemp": {
      "value": "e.g., 24-26°C | 78°F",
      "sourceTag": "Forecast|Seasonal|Inferred"
    },
    "visibility": {
      "value": "e.g., 15-25m | Variable 5-15m",
      "sourceTag": "Forecast|Seasonal|Inferred"
    },
    "seaStateWind": {
      "value": "e.g., Calm | Moderate swell | 10-15kt trade winds",
      "sourceTag": "Forecast|Seasonal|Inferred"
    },
    "confidence": {
      "level": "High|Medium|Low",
      "reason": "Brief explanation of data quality"
    }
  },
  "whatMattersMost": "One sentence about what specifically matters on THIS dive given the inputs",
  "highlights": [
    "Highlight 1: specific to this dive",
    "Highlight 2: specific to this dive",
    "Highlight 3: specific to this dive"
  ],
  "sections": [
    {
      "title": "Conditions for this place & time of year",
      "sourceTags": ["Seasonal"],
      "bullets": ["Specific condition fact", "Another specific fact"]
    },
    {
      "title": "Site hazards & what surprises people here",
      "bullets": ["Specific hazard or surprise for this site"]
    },
    {
      "title": "Profile notes",
      "bullets": ["NDL consideration for this depth/time", "Navigation or ascent note if relevant"]
    },
    {
      "title": "Suggested gear",
      "bullets": ["Gear suggestion contextual to conditions"]
    },
    {
      "title": "Experience fit",
      "bullets": ["Assessment of plan vs experience level"]
    }
  ]
}

Rules:
- conditionsSnapshot MUST mention the location and month/season
- highlights array: max 3, each must be specific and actionable
- sections: use the exact titles provided unless you have strong reason to vary
- Avoid ranges like "10-30m visibility" unless truly variable; be specific when possible
- If you don't know something, use "Inferred" sourceTag and be conservative
- Never hallucinate specific numbers; use ranges with sourceTag if uncertain
`.trim();
}

const BRIEFING_SYSTEM_PROMPT = buildSystemPrompt("metric");

function buildUpdatedSystemPrompt(unitSystem: UnitSystem = "metric"): string {
  const basePrompt = buildSystemPrompt(unitSystem);
  return `
You are "DiveIQ", a calm, experienced dive buddy reviewing an UPDATED dive plan.
The diver has changed their plan—focus on how the changes affect the dive.

Return the same JSON structure as a new briefing, but:
- Emphasize what changed and whether it's more/less/equally sensible
- Keep the same structured format
- Be concise since this is a plan update

${basePrompt.split("Rules:")[1] ? `Rules:${basePrompt.split("Rules:")[1]}` : ""}
`.trim();
}

function buildUserPrompt(
  plan: DivePlanAnalysisRequest,
  isUpdate = false
): string {
  const monthName = new Date(plan.date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const unitSystem = plan.unitSystem || "metric";

  // Format max depth based on unit system
  // Note: plan.maxDepth is always in meters (canonical), but we display it in the requested units
  const maxDepthDisplay =
    unitSystem === "imperial"
      ? `${Math.round(mToFt(plan.maxDepth))}ft (${plan.maxDepth}m)`
      : `${plan.maxDepth}m`;

  return `
Dive Plan${isUpdate ? " (UPDATED)" : ""}:
- Location/Region: ${plan.region}
- Site Name: ${plan.siteName || "Not specified"}
- Date: ${plan.date} (${monthName})
- Max Depth: ${maxDepthDisplay}
- Planned Bottom Time: ${plan.bottomTime} minutes
- Diver Experience: ${plan.experienceLevel}
- Calculated Risk Level: ${plan.riskLevel}
- Unit System: ${unitSystem === "imperial" ? "Imperial (feet, °F)" : "Metric (meters, °C)"}

${isUpdate ? "This is an updated plan. Focus on the implications of the changes." : "Provide a complete dive briefing for this plan."}

IMPORTANT: All numeric values in your response (depths, temperatures, distances, visibility) MUST use ${unitSystem === "imperial" ? "Imperial units (feet, °F)" : "Metric units (meters, °C)"}. Do NOT mix unit systems.
`.trim();
}

function parseAIBriefing(content: string): AIBriefing {
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
      },
      visibility: {
        value: parsed.quickLook?.visibility?.value || "Data unavailable",
        sourceTag: parsed.quickLook?.visibility?.sourceTag || "Inferred",
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

function getFallbackBriefing(plan: DivePlanAnalysisRequest): AIBriefing {
  const monthName = new Date(plan.date).toLocaleDateString("en-US", {
    month: "long",
  });
  const unitSystem = plan.unitSystem || "metric";

  // Format depth based on unit system
  const maxDepthDisplay =
    unitSystem === "imperial"
      ? `${Math.round(mToFt(plan.maxDepth))}ft`
      : `${plan.maxDepth}m`;

  return {
    conditionsSnapshot: `Diving at ${plan.siteName || plan.region} in ${monthName}. Unable to retrieve detailed conditions data.`,
    quickLook: {
      difficulty: {
        value:
          plan.maxDepth > 30
            ? "Challenging"
            : plan.maxDepth > 18
              ? "Moderate"
              : "Easy",
        reason: `${maxDepthDisplay} depth, ${plan.bottomTime} min bottom time`,
      },
      suggestedExperience: {
        value:
          plan.maxDepth > 30
            ? "Advanced Open Water"
            : plan.maxDepth > 18
              ? "Advanced Open Water recommended"
              : "Open Water sufficient",
      },
      waterTemp: {
        value: "Check local sources",
        sourceTag: "Inferred",
      },
      visibility: {
        value: "Variable",
        sourceTag: "Inferred",
      },
      seaStateWind: {
        value: "Check local forecast",
        sourceTag: "Inferred",
      },
      confidence: {
        level: "Low",
        reason: "Unable to retrieve AI analysis",
      },
    },
    whatMattersMost: `At ${maxDepthDisplay} for ${plan.bottomTime} minutes, monitor your NDL and air consumption carefully.`,
    highlights: [
      `Plan depth: ${maxDepthDisplay}—verify this is within your comfort zone`,
      `Check local conditions before the dive`,
      `Brief your buddy on the dive plan`,
    ],
    sections: [
      {
        title: "Profile notes",
        bullets: [
          `At ${maxDepthDisplay}, you'll have limited NDL time—plan your ascent accordingly`,
          "Establish turn pressure before descent",
        ],
      },
    ],
  };
}

/**
 * Generate AI-powered structured dive briefing for a new dive plan
 */
export async function generateDivePlanBriefing(
  plan: DivePlanAnalysisRequest
): Promise<AIBriefing> {
  const unitSystem = plan.unitSystem || "metric";
  const systemPrompt = buildSystemPrompt(unitSystem);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserPrompt(plan) },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.warn("Empty response from OpenAI, using fallback");
      return getFallbackBriefing(plan);
    }

    return parseAIBriefing(content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return getFallbackBriefing(plan);
  }
}

/**
 * Generate AI-powered structured dive briefing for an updated dive plan
 */
export async function generateUpdatedDivePlanBriefing(
  plan: DivePlanAnalysisRequest
): Promise<AIBriefing> {
  const unitSystem = plan.unitSystem || "metric";
  const systemPrompt = buildUpdatedSystemPrompt(unitSystem);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserPrompt(plan, true) },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.warn("Empty response from OpenAI, using fallback");
      return getFallbackBriefing(plan);
    }

    return parseAIBriefing(content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return getFallbackBriefing(plan);
  }
}

// Legacy functions for backward compatibility
export async function generateDivePlanAdvice(
  plan: DivePlanAnalysisRequest
): Promise<string> {
  const briefing = await generateDivePlanBriefing(plan);
  return briefing.whatMattersMost;
}

export async function generateUpdatedDivePlanAdvice(
  plan: DivePlanAnalysisRequest
): Promise<string> {
  const briefing = await generateUpdatedDivePlanBriefing(plan);
  return briefing.whatMattersMost;
}
