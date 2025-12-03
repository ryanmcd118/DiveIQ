import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PlanData = {
  region: string;
  siteName: string;
  date: string;
  maxDepth: number;
  bottomTime: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
};

type RiskLevel = 'Low' | 'Moderate' | 'High';

function calculateRisk(plan: PlanData): RiskLevel {
  const { maxDepth, bottomTime } = plan;

  if (maxDepth > 40 || bottomTime > 50) {
    return 'High';
  }

  if (maxDepth > 30 || bottomTime > 40) {
    return 'Moderate';
  }

  return 'Low';
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  const plan = (await req.json()) as PlanData;

  const riskLevel = calculateRisk(plan);

  // Build a concise description of the plan
  const planDescription = `
Region: ${plan.region}
Site: ${plan.siteName}
Date: ${plan.date}
Max depth: ${plan.maxDepth}m
Bottom time: ${plan.bottomTime} minutes
Experience level: ${plan.experienceLevel}
Calculated risk: ${riskLevel}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are DiveIQ, a cautious, friendly scuba instructor. You help recreational divers plan safe no-decompression dives. You explain your reasoning clearly, keep things conservative, and never encourage risky behavior or going beyond training. Keep answers under 3 short paragraphs.',
      },
      {
        role: 'user',
        content:
          'Here is a dive plan. Evaluate whether it is reasonable for the stated experience level, call out any potential safety concerns, and suggest improvements if needed:\n\n' +
          planDescription,
      },
    ],
  });

  const aiAdvice =
    completion.choices[0]?.message?.content ??
    'Unable to generate advice at this time. Please try again.';

  return NextResponse.json({
    riskLevel,
    aiAdvice,
  });
}
