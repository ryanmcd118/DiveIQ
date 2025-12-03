import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { DiveLogInput } from '@/app/log/types';

export async function GET() {
  const entries = await prisma.diveLog.findMany({
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DiveLogInput;

  // very basic validation; will harden later
  if (!body.date || !body.region || !body.siteName) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const entry = await prisma.diveLog.create({
    data: {
      date: body.date,
      region: body.region,
      siteName: body.siteName,
      maxDepth: body.maxDepth,
      bottomTime: body.bottomTime,
      waterTemp: body.waterTemp ?? null,
      visibility: body.visibility ?? null,
      buddyName: body.buddyName ?? null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
