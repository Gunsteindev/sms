// next-auth@5.0.0-beta.30 route handler disabled — auth is handled by
// /api/auth/login, /api/auth/session, and /api/auth/logout instead.
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ error: 'Not used' }, { status: 404 });
}
export function POST() {
  return NextResponse.json({ error: 'Not used' }, { status: 404 });
}
