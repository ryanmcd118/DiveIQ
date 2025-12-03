import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import type { PlanInput } from '@/app/plan/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RiskLevel = 'Low' | 'Moderate' | 'High';

function calculateRisk(maxDepth: number, bottomTime: number): RiskLevel {
  if (maxDepth > 40 || bottomTime > 50) return 'High';
  if (maxDepth > 30 || bottomTime > 40) return 'Moderate';
  return 'Low';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      region: string;
      siteName: string;
      date: string;
      maxDepth: number;
      bottomTime: number;
      experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    };

    const riskLevel = calculateRisk(body.maxDepth, body.bottomTime);

    const systemPrompt = `
You are "DiveIQ", a conservative, safety-focused AI dive buddy.

Given a recreational scuba dive plan (location, depth, time, and experience level), 
give concise, practical feedback focused on safety, gas planning assumptions, 
common risks for that region, and reminder-style advice. 
Avoid giving medical advice. Assume no-decompression, single-tank recreational dives.
    `.trim();

    const userPrompt = `
Region: ${body.region}
Site: ${body.siteName}
Date: ${body.date}
Max depth: ${body.maxDepth}m
Bottom time: ${body.bottomTime} minutes
Experience level: ${body.experienceLevel}
Estimated risk level: ${riskLevel}

Give a short assessment (2–3 paragraphs max) of whether this is a sensible plan 
for this diver, and what they should pay attention to (conditions, gas, ascent, buddy 
communication, emergency planning). Be clear but non-alarmist.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
    });

    const aiAdvice =
      completion.choices[0]?.message?.content ??
      'Unable to generate advice at this time. Dive conservatively and within your training.';

    // Save to DB
    const planInput: PlanInput = {
      date: body.date,
      region: body.region,
      siteName: body.siteName,
      maxDepth: body.maxDepth,
      bottomTime: body.bottomTime,
      experienceLevel: body.experienceLevel,
      riskLevel,
      aiAdvice,
    };

    const saved = await prisma.divePlan.create({
      data: planInput,
    });

    // For now, the page only needs aiAdvice – but we also return the saved record
    return NextResponse.json(
      {
        aiAdvice,
        plan: saved,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in /api/plan:', err);
    return NextResponse.json(
      { error: 'Failed to generate plan advice.' },
      { status: 500 },
    );
  }
}

// Later we can list plans for dashboards, etc.
export async function GET() {
  const plans = await prisma.divePlan.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({ plans });
}
