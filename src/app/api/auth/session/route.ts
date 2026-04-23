import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json(null);

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json(null);

  return NextResponse.json({
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}
