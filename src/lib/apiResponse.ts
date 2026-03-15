import { NextResponse } from "next/server";

export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function apiValidationError(
  message: string,
  details?: unknown[]
): NextResponse {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function apiOk(): NextResponse {
  return NextResponse.json({ ok: true });
}

export function apiCreated<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}
