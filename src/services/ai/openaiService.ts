import OpenAI from "openai";
import type { RiskLevel } from "@/features/dive-plan/types";
import { parseAIBriefing } from "@/features/dive-plan/lib/parseAIBriefing";
import type { UnitSystem } from "@/lib/units";
import { mToFt } from "@/lib/units";
import type { AIBriefing } from "@/features/dive-plan/types";
import { resolveHighestCert } from "@/features/dive-plan/services/riskCalculator";

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
  profile?: {
    totalDives: number;
    lastDiveDate: string | null;
    experienceLevel: string | null;
    yearsDiving: number | null;
    homeDiveRegion: string | null;
    primaryDiveTypes: string[];
    certifications: { agency: string; name: string; levelRank: number }[];
    gear: {
      type: string;
      manufacturer: string | null;
      model: string | null;
      nickname: string | null;
    }[];
  };
  manualExperience?: {
    diveCountRange: string | null;
    lastDiveRecency: string | null;
    highestCert: string | null;
    experienceLevel: string;
  };
};

function parseTempToFahrenheit(value: string): number | null {
  const numbers = value.match(/(?<!\d)-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return null;

  const isCelsius = /°?\s*C\b/i.test(value);
  const parsed = numbers.map(Number);
  const avg = parsed.reduce((a, b) => a + b, 0) / parsed.length;

  return isCelsius ? (avg * 9) / 5 + 32 : avg;
}

function computeGearNotes(
  tempF: number | null,
  gearList: string[],
  region: string,
  siteName: string
): string[] {
  if (tempF === null) return [];

  const notes: string[] = [];

  // String 1 — Recommended gear list
  const items: string[] = [];

  if (tempF >= 80) items.push("rash guard or dive skin");
  else if (tempF >= 73) items.push("3mm shorty or full wetsuit");
  else if (tempF >= 68) items.push("3mm full wetsuit");
  else if (tempF >= 60) items.push("5mm wetsuit");
  else if (tempF >= 50) items.push("7mm wetsuit");
  else items.push("drysuit");

  if (tempF < 60) items.push("hood", "gloves");
  if (tempF < 65) items.push("booties");

  const combined = `${region} ${siteName}`.toLowerCase();
  if (/cave|cavern|night|wreck/.test(combined)) items.push("dive light");
  if (/open water|ocean|sea|offshore|boat/.test(combined)) items.push("SMB");

  notes.push(`Recommended gear for this dive: ${items.join(", ")}.`);

  // String 2 — Gear comparison
  if (gearList.length > 0) {
    const gearLower = gearList.map((g) => g.toLowerCase()).join(" ");
    const exposurePatterns =
      /wetsuit|shorty|drysuit|rashguard|rash guard|skin suit/;
    const hasExposureGear = exposurePatterns.test(gearLower);

    if (hasExposureGear) {
      // Check for mismatches
      const hasDrysuit = /drysuit/.test(gearLower);
      const has7mm = /7\s*mm/.test(gearLower);
      const has5mm = /5\s*mm/.test(gearLower);
      const has3mm = /3\s*mm/.test(gearLower);
      const hasShorty = /shorty/.test(gearLower);
      const hasRashguard = /rashguard|rash guard|skin suit/.test(gearLower);

      let adequate = false;
      let loggedDesc = "";

      if (hasDrysuit) {
        adequate = true;
        loggedDesc = "drysuit";
      } else if (has7mm) {
        adequate = tempF >= 50;
        loggedDesc = "7mm wetsuit";
      } else if (has5mm) {
        adequate = tempF >= 60;
        loggedDesc = "5mm wetsuit";
      } else if (has3mm && !hasShorty) {
        adequate = tempF >= 68;
        loggedDesc = "3mm wetsuit";
      } else if (hasShorty || has3mm) {
        adequate = tempF >= 73;
        loggedDesc = hasShorty ? "3mm shorty" : "3mm wetsuit";
      } else if (hasRashguard) {
        adequate = tempF >= 80;
        loggedDesc = "rash guard";
      }

      if (adequate) {
        notes.push(
          "Your logged exposure protection is suitable for the expected water temperature."
        );
      } else if (loggedDesc) {
        const tempDisplay = `${Math.round(tempF)}°F`;
        notes.push(
          `Your ${loggedDesc} is not appropriate for ${tempDisplay} water. A ${items[0]} is required.`
        );
      }
    } else {
      notes.push(
        `No exposure protection logged — ensure you have appropriate thermal protection for ${Math.round(tempF)}°F water.`
      );
    }
  }

  // String 3 — Cold water regulator warning
  if (tempF < 50) {
    notes.push(
      "Standard regulators risk free-flowing below 50°F due to the venturi effect. An environmentally sealed cold-water regulator is required for this dive."
    );
  }

  return notes;
}

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

  return `${unitInstructions}

You are DiveIQ's AI dive planning assistant. You generate structured, safety-focused dive briefings in JSON format.

You must return ONLY valid JSON matching this exact schema — no markdown, no preamble:

{
  "keyConsiderations": ["string", "string"],
  "conditions": {
    "waterTemp": { "value": "string", "badge": "seasonal|forecast|inferred|null" },
    "visibility": { "value": "string", "badge": "seasonal|forecast|inferred|null" },
    "seaState": { "value": "string", "badge": "seasonal|forecast|inferred|null" }
  },
  "siteConditions": ["string"],
  "hazards": ["string"],
  "experienceNotes": ["string"],
  "gearNotes": ["string"]
}

DIVER EXPERIENCE CLASSIFICATION:

HIGHEST CERT RULE: When a diver has multiple certifications listed, always identify and use the HIGHEST certification for depth limit and experience tier calculations. Specialty certifications (Nitrox, Enriched Air, Night Diver, Peak Performance Buoyancy, Wreck, Drift, Search and Recovery, etc.) do not affect depth limits and must be ignored for depth limit purposes. Only these certs affect depth limits: Open Water (60ft/18m), Advanced Open Water (100ft/30m), Deep Specialty (130ft/40m), Rescue Diver / Divemaster (130ft/40m recreational limit), Technical certs (beyond 130ft). If a diver holds both Open Water AND Advanced Open Water, their limit is 100ft/30m — not 60ft/18m. When a "Highest certification" field is provided in the diver profile, use that field directly — do not re-derive the highest cert from the full list.

Example: A diver with certs [Open Water Diver, Advanced Open Water Diver, Enriched Air Nitrox] has a depth limit of 100ft/30m. A planned dive to 90ft is within limits and must NOT be flagged as an exceedance.

Before generating any output, classify the diver into one of four experience tiers using their certification level and dive count together. Use this classification consistently across all sections — especially keyConsiderations and experienceNotes.

Tiers:

NOVICE — Open Water cert (or lower/unknown) AND fewer than 25 dives. Still building foundational skills. Should be diving shallow, calm, guided conditions. Flag any depth or condition that exceeds this comfort envelope.

INTERMEDIATE — Either: (a) Open Water cert with 25-99 dives, OR (b) Advanced Open Water cert with fewer than 50 dives. Has core skills, building real-world experience. Comfortable in typical recreational conditions but not reliable in challenging ones.

EXPERIENCED — Either: (a) Advanced Open Water cert with 50+ dives, OR (b) Deep Specialty, Rescue Diver, or Divemaster cert with any dive count. Comfortable in varied conditions, solid buoyancy and air management.

ADVANCED — Deep Specialty or higher cert with 100+ dives, OR any technical diving certification. Can handle complex, challenging dives with appropriate planning.

When dive count is provided as a range (e.g. "25-99 dives", "100-499 dives"), use the lower bound of the range for classification — treat it as the minimum confirmed experience.

When cert level is unknown, classify based on dive count alone:
- Fewer than 25 dives → Novice
- 25-99 dives → Intermediate
- 100+ dives → Experienced

When dive count is unknown but cert is known, classify based on cert alone:
- OW or lower → Novice
- AOW → Intermediate
- Deep Specialty or higher → Experienced

When both are unknown → treat as Novice and focus output on site/conditions rather than profile.

IMPORTANT: Never use the word "beginner" in your output. Use the tier name (Novice, Intermediate, Experienced, Advanced) or a natural equivalent ("with your experience level", "as a newer diver", etc). Never call a diver with 25-99 dives a beginner — that is Intermediate.

CRITICAL RULES — violating these makes the briefing useless:

keyConsiderations: 2-3 bullet strings maximum. EVERY bullet MUST reference at least one specific data point from: the diver's certification level, their logged dive count, their last dive date, a named piece of their gear, the exact planned depth, the exact bottom time, or a specific named condition at this location. Generic advice is forbidden. "Ensure you have a reliable dive computer" is forbidden. "Monitor your air supply" is forbidden.
Good example: "Your shortie wetsuit is rated for ~70°F water — at 28-32°F this site runs in November, you'll be dangerously underprepared without a 7mm or drysuit."
Good example: "With 15 logged dives and an 8-month gap since your last dive, the strong currents reported near the glacier face are a significant risk — consider a shallower warm-up dive first."

conditions (waterTemp, visibility, seaState): value is a concise human-readable string. badge: "seasonal" if based on typical patterns for this location/time of year, "forecast" if based on known forecast data, "inferred" if estimated from depth/location without direct data, null if genuinely unknown.

siteConditions: 2-4 strings describing conditions specific to this location at this time of year. Must be location-specific. "Water temperatures can be cold" is not acceptable — "Water temperatures in Antarctica in November typically range 28-32°F near the surface" is acceptable.

hazards: 1-3 strings describing hazards specific to this site, depth, or region. Do not list generic scuba hazards. Only hazards specifically elevated at this location, depth, or time of year. Nitrogen narcosis: only mention if depth exceeds 100ft/30m. Decompression risk: only mention if planned bottom time approaches NDL for the planned depth.

experienceNotes: 2-3 strings directly addressing the match or mismatch between this diver's profile and this dive. Always acknowledge the diver's experience level naturally in the first experienceNotes bullet, using conversational language rather than internal tier labels. Do not use the words "tier", "classification", or "category". Instead use natural phrasing like "As an intermediate diver with an AOW cert and 25-99 logged dives..." or "With an Open Water cert and 15 logged dives, you're still in the earlier stages of building dive experience..." or "As an experienced diver with 100+ logged dives and a Deep Specialty cert...". The tone should feel like advice from a knowledgeable dive instructor, not a system classification readout. Then address the match or mismatch between the diver's experience level and this specific dive's conditions. Always reference the diver's actual cert level, logged dive count, and time since last dive. Cert depth limits: Open Water = 60ft/18m max, Advanced Open Water = 100ft/30m max, Deep Specialty = 130ft/40m max. Flag a cert exceedance ONLY if the planned depth is strictly greater than the cert limit. Do not flag if depth equals or is less than the limit. Examples: 90ft with AOW (limit 100ft) = within limits, no flag. 101ft with AOW = exceeds limit, flag it. If last dive was 6-12 months ago, recommend a refresher. If 12+ months ago, strongly advise a refresher dive before this one.

gearNotes: 1-3 strings. Review the diver's actual gear list against this dive's conditions. Only flag gear that is inadequate OR notably well-suited. If wetsuit is inadequate for water temp, state the specific water temp and minimum recommended wetsuit thickness. If gear is appropriate overall, say so in one sentence. If no gear is logged, note that the diver should verify gear suitability for the conditions.

Never explain which certifications you are or are not factoring into your depth limit calculation. Do not mention specialty certs (Night Diver, Nitrox, Wreck, Peak Performance Buoyancy, etc.) in your output at all unless they are directly relevant to the specific dive conditions. The cert ranking logic is internal — only state the resulting depth limit and whether the planned dive is within it.

If the planned depth is within the diver's certification limits, do not suggest they dive shallower or imply the dive is beyond their training. Acknowledge it is within limits, then focus on the actual risk factors specific to this dive (conditions, experience gap, gear). Reserve depth-related warnings strictly for dives that genuinely exceed cert limits.

The narrative summary paragraph and riskLevel are calculated SEPARATELY — do not include them in your JSON response.

HANDLING MISSING PROFILE DATA:
If diver profile data is partially or fully absent (e.g. a guest user who did not enter experience info), adjust your output as follows:
- keyConsiderations: focus on what is notable about this specific dive's depth, conditions, or location. Do not invent profile data. Do not say "as an experienced diver" or assume any cert level.
- experienceNotes: if no cert level is provided, note that cert level and experience are unknown and flag any depth or condition thresholds the diver should be aware of regardless of experience (e.g. if depth exceeds 60ft/18m, note this exceeds Open Water limits and cert verification is advised).
- gearNotes: if no gear is logged, say "No gear on record — verify your equipment is appropriate for [waterTemp] water at [depth]."
Never hallucinate profile data. If a field is unknown, either omit the reference or explicitly state it is unknown.`.trim();
}

function buildUpdatedSystemPrompt(unitSystem: UnitSystem = "metric"): string {
  const basePrompt = buildSystemPrompt(unitSystem);
  return `You are DiveIQ's AI dive planning assistant reviewing an UPDATED dive plan. The diver has changed their plan — focus on how the changes affect the dive. Return the same JSON structure as a new briefing, but emphasize what changed and whether it's more/less/equally sensible. Be concise since this is a plan update.

${basePrompt}`.trim();
}

function humanReadableDuration(
  fromDateStr: string | null,
  toDateStr: string
): string {
  if (!fromDateStr) return "unknown";
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  const diffMs = to.getTime() - from.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "in the future";
  if (diffDays < 14) return `${diffDays} days ago`;
  if (diffDays < 60) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
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

  let profileSection = "";

  if (plan.profile) {
    const p = plan.profile;
    const lines: string[] = [];
    lines.push(`- Total logged dives: ${p.totalDives}`);
    if (p.lastDiveDate) {
      lines.push(
        `- Last dive: ${p.lastDiveDate} (approximately ${humanReadableDuration(p.lastDiveDate, plan.date)})`
      );
    }
    if (p.experienceLevel)
      lines.push(`- Experience level: ${p.experienceLevel}`);
    if (p.yearsDiving != null) lines.push(`- Years diving: ${p.yearsDiving}`);
    if (p.homeDiveRegion) lines.push(`- Home dive region: ${p.homeDiveRegion}`);
    if (p.primaryDiveTypes.length > 0) {
      lines.push(`- Primary dive types: ${p.primaryDiveTypes.join(", ")}`);
    }

    if (p.certifications.length > 0) {
      const resolved = resolveHighestCert(p.certifications.map((c) => c.name));
      const depthLimitDisplay =
        resolved.depthLimitFt === 999
          ? "no recreational limit"
          : `${resolved.depthLimitFt}ft`;
      lines.push(`- Highest certification: ${resolved.name}`);
      lines.push(`- Certification depth limit: ${depthLimitDisplay}`);
      lines.push(
        `- All certifications: ${p.certifications.map((c) => c.name).join(", ")}`
      );
    }

    if (p.gear.length > 0) {
      lines.push(`\nGear inventory:`);
      for (const g of p.gear) {
        if (g.nickname) {
          lines.push(`  - ${g.type}: ${g.nickname}`);
        } else if (g.manufacturer || g.model) {
          lines.push(
            `  - ${g.type}: ${[g.manufacturer, g.model].filter(Boolean).join(" ")}`
          );
        } else {
          lines.push(`  - ${g.type}`);
        }
      }
    }

    profileSection = `\n---\nDiver Profile:\n${lines.join("\n")}`;
  } else if (plan.manualExperience) {
    const m = plan.manualExperience;
    const lines: string[] = [];
    lines.push(`- Experience level: ${m.experienceLevel}`);
    if (m.diveCountRange)
      lines.push(`- Approximate total dives: ${m.diveCountRange}`);
    if (m.lastDiveRecency) lines.push(`- Last dive: ${m.lastDiveRecency}`);
    if (m.highestCert) {
      const resolved = resolveHighestCert([m.highestCert]);
      const depthLimitDisplay =
        resolved.depthLimitFt === 999
          ? "no recreational limit"
          : `${resolved.depthLimitFt}ft`;
      lines.push(`- Highest certification: ${m.highestCert}`);
      lines.push(`- Certification depth limit: ${depthLimitDisplay}`);
    } else {
      lines.push(`- Highest certification: Not provided`);
    }
    profileSection = `\n---\nDiver Experience (self-reported):\n${lines.join("\n")}`;
  }

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

${profileSection ? profileSection.trimStart() : ""}
`.trim();
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
    keyConsiderations: [
      `Plan depth: ${maxDepthDisplay} — confirm your certification covers this depth`,
      `Check local conditions before the dive`,
    ],
    conditions: {
      waterTemp: { value: "Check local sources", badge: null },
      visibility: { value: "Variable", badge: null },
      seaState: { value: "Check local forecast", badge: null },
    },
    siteConditions: [
      `Diving at ${plan.siteName || plan.region} in ${monthName}`,
    ],
    hazards: [],
    experienceNotes: [
      `At ${maxDepthDisplay}, monitor your NDL and air consumption carefully`,
    ],
    gearNotes: [],
  };
}

function buildGearList(plan: DivePlanAnalysisRequest): string[] {
  return (plan.profile?.gear ?? []).map((g) =>
    g.nickname
      ? `${g.type}: ${g.nickname}`
      : g.manufacturer || g.model
        ? `${g.type}: ${[g.manufacturer, g.model].filter(Boolean).join(" ")}`
        : g.type
  );
}

function applyDeterministicGearNotes(
  briefing: AIBriefing,
  plan: DivePlanAnalysisRequest
): void {
  const tempF = parseTempToFahrenheit(briefing.conditions.waterTemp.value);
  const gearList = buildGearList(plan);
  const computed = computeGearNotes(
    tempF,
    gearList,
    plan.region,
    plan.siteName
  );
  if (computed.length > 0) {
    briefing.gearNotes = computed;
  }
}

function bufferAndApplyGearNotes(
  stream: AsyncIterable<{ choices: { delta: { content?: string | null } }[] }>,
  plan: DivePlanAnalysisRequest
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let accumulated = "";
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) accumulated += text;
        }
        const briefing = parseAIBriefing(accumulated);
        applyDeterministicGearNotes(briefing, plan);
        controller.enqueue(encoder.encode(JSON.stringify(briefing)));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
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
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.warn("Empty response from OpenAI, using fallback");
      return getFallbackBriefing(plan);
    }

    const briefing = parseAIBriefing(content);
    applyDeterministicGearNotes(briefing, plan);
    return briefing;
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
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.warn("Empty response from OpenAI, using fallback");
      return getFallbackBriefing(plan);
    }

    const briefing = parseAIBriefing(content);
    applyDeterministicGearNotes(briefing, plan);
    return briefing;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return getFallbackBriefing(plan);
  }
}

/**
 * Stream AI-powered structured dive briefing for a new dive plan.
 * Buffers the full AI response, applies deterministic gear notes, then emits as a single chunk.
 */
export async function generateDivePlanBriefingStream(
  plan: DivePlanAnalysisRequest
): Promise<ReadableStream<Uint8Array>> {
  const unitSystem = plan.unitSystem || "metric";
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: buildSystemPrompt(unitSystem) },
      { role: "user", content: buildUserPrompt(plan) },
    ],
    temperature: 0.6,
    max_tokens: 1000,
    response_format: { type: "json_object" },
    stream: true,
  });

  return bufferAndApplyGearNotes(stream, plan);
}

/**
 * Stream AI-powered structured dive briefing for an updated dive plan.
 * Buffers the full AI response, applies deterministic gear notes, then emits as a single chunk.
 */
export async function generateUpdatedDivePlanBriefingStream(
  plan: DivePlanAnalysisRequest
): Promise<ReadableStream<Uint8Array>> {
  const unitSystem = plan.unitSystem || "metric";
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: buildUpdatedSystemPrompt(unitSystem) },
      { role: "user", content: buildUserPrompt(plan, true) },
    ],
    temperature: 0.6,
    max_tokens: 1000,
    response_format: { type: "json_object" },
    stream: true,
  });

  return bufferAndApplyGearNotes(stream, plan);
}

// Legacy functions for backward compatibility
export async function generateDivePlanAdvice(
  plan: DivePlanAnalysisRequest
): Promise<string> {
  const briefing = await generateDivePlanBriefing(plan);
  return briefing.keyConsiderations[0] ?? "";
}

export async function generateUpdatedDivePlanAdvice(
  plan: DivePlanAnalysisRequest
): Promise<string> {
  const briefing = await generateUpdatedDivePlanBriefing(plan);
  return briefing.keyConsiderations[0] ?? "";
}
