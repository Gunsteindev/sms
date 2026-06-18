import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';
import { getUserForAuth, verifyPassword, USER_ROLES } from '@/lib/dataverse/users';
import { checkRateLimit, resetRateLimit, pruneRateLimits } from '@/lib/rate-limit';

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path:     '/',
  maxAge:   60 * 60 * 24, // 24 h
};

const WINDOW_MS = 15 * 60 * 1000;       // 15 minutes
const MAX_PER_EMAIL = 10;               // attempts per ip+email
const MAX_PER_IP    = 50;               // attempts per ip (slows credential spraying)

function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0].trim())
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function tooManyRequests(retryAfterSec: number) {
  return NextResponse.json(
    { error: 'Too many login attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Brute-force protection ───────────────────────────────────────────────
    pruneRateLimits();
    const ip = clientIp(req);
    const ipLimit = checkRateLimit(`login:ip:${ip}`, { max: MAX_PER_IP, windowMs: WINDOW_MS });
    if (ipLimit.limited) return tooManyRequests(ipLimit.retryAfterSec);
    const emailKey = `login:${ip}:${normalizedEmail}`;
    const emailLimit = checkRateLimit(emailKey, { max: MAX_PER_EMAIL, windowMs: WINDOW_MS });
    if (emailLimit.limited) return tooManyRequests(emailLimit.retryAfterSec);

    // ── 1. Bootstrap admin (env vars) — always checked first ────────────────
    if (
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD &&
      normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase() &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = await createSessionToken({
        userid:   'bootstrap',
        email:    process.env.ADMIN_EMAIL,
        name:     'Administrator',
        role:     'Admin',
        userrole: 1,
        schoolId: undefined,
      });
      resetRateLimit(emailKey);
      const res = NextResponse.json({ ok: true, userrole: 1 });
      res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS);
      return res;
    }

    // ── 2. Dataverse users table ─────────────────────────────────────────────
    try {
      const dbUser = await getUserForAuth(normalizedEmail);
      if (dbUser && dbUser.passwordhash) {
        const valid = await verifyPassword(password, dbUser.passwordhash);
        if (!valid) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
        const token = await createSessionToken({
          userid:   dbUser.userid,
          email:    dbUser.email,
          name:     dbUser.name,
          role:     USER_ROLES[dbUser.userrole] ?? 'Admin',
          userrole: dbUser.userrole,
          schoolId: dbUser.schoolid ?? undefined,
        });
        resetRateLimit(emailKey);
        const res = NextResponse.json({ ok: true, userrole: dbUser.userrole });
        res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS);
        return res;
      }
    } catch {
      // Dataverse unavailable
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
