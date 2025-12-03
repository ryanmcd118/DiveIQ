import { NextRequest, NextResponse } from 'next/server';

type DiveLogInput = {
  date: string;
  region: string;
  siteName: string;
  maxDepth: number;
  bottomTime: number;
  waterTemp?: number | null;
  visibility?: number | null;
  buddyName?: string | null;
  notes?: string | null;
};

type DiveLogEntry = DiveLogInput & {
  id: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DiveLogInput;

  // DB PLACEHOLDER
  // for now just generating ID on server and echoing back
  const entry: DiveLogEntry = {
    id: crypto.randomUUID(),
    ...body,
  };

  return NextResponse.json({ entry });
}
