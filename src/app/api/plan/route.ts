import { NextRequest, NextResponse } from 'next/server';

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
  const plan = (await req.json()) as PlanData;

  const riskLevel = calculateRisk(plan);

  const aiAdvice = `This is a placeholder recommendation for a ${riskLevel} risk dive at ${plan.maxDepth}m for ${plan.bottomTime} minutes.`;

  return NextResponse.json({
    riskLevel,
    aiAdvice,
  });
}
