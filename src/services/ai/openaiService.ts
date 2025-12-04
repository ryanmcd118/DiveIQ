import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type DivePlanAnalysisRequest = {
  region: string;
  siteName: string;
  date: string;
  maxDepth: number;
  bottomTime: number;
  experienceLevel: "Beginner" | "Intermediate" | "Advanced";
  riskLevel: "Low" | "Moderate" | "High";
};

/**
 * Generate AI-powered dive safety advice for a new dive plan
 */
export async function generateDivePlanAdvice(
  plan: DivePlanAnalysisRequest
): Promise<string> {
  const systemPrompt = `
You are "DiveIQ", a conservative, safety-focused AI dive buddy.

Given a recreational scuba dive plan (location, depth, time, and experience level), 
give concise, practical feedback focused on safety, gas planning assumptions, 
common risks for that region, and reminder-style advice. 
Avoid giving medical advice. Assume no-decompression, single-tank recreational dives.
  `.trim();

  const userPrompt = `
Region: ${plan.region}
Site: ${plan.siteName}
Date: ${plan.date}
Max depth: ${plan.maxDepth}m
Bottom time: ${plan.bottomTime} minutes
Experience level: ${plan.experienceLevel}
Estimated risk level: ${plan.riskLevel}

Give a short assessment (2–3 paragraphs max) of whether this is a sensible plan 
for this diver, and what they should pay attention to (conditions, gas, ascent, buddy 
communication, emergency planning). Be clear but non-alarmist.
  `.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
    });

    return (
      completion.choices[0]?.message?.content ??
      "Unable to generate advice at this time. Dive conservatively and within your training."
    );
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI dive advice");
  }
}

/**
 * Generate AI-powered dive safety advice for an updated dive plan
 */
export async function generateUpdatedDivePlanAdvice(
  plan: DivePlanAnalysisRequest
): Promise<string> {
  const systemPrompt = `
You are "DiveIQ", a conservative, safety-focused AI dive buddy.

Given a recreational scuba dive plan (location, depth, time, and experience level), 
give concise, practical feedback focused on safety, gas planning assumptions, 
common risks for that region, and reminder-style advice. 
Avoid giving medical advice. Assume no-decompression, single-tank recreational dives.
  `.trim();

  const userPrompt = `
Region: ${plan.region}
Site: ${plan.siteName}
Date: ${plan.date}
Max depth: ${plan.maxDepth}m
Bottom time: ${plan.bottomTime} minutes
Experience level: ${plan.experienceLevel}
Estimated risk level: ${plan.riskLevel}

The diver has UPDATED this plan. Give a short assessment (1 paragraph max) 
of whether the changes they have suggested make this a more, less, or equally sensible plan for this diver, and what they should pay 
attention to. Be clear but non-alarmist.
  `.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
    });

    return (
      completion.choices[0]?.message?.content ??
      "Unable to generate updated advice at this time. Dive conservatively and within your training."
    );
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate updated AI dive advice");
  }
}
