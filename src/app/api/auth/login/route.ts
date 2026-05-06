import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';
import { getUserForAuth, verifyPassword, USER_ROLES } from '@/lib/dataverse/users';

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path:     '/',
  maxAge:   60 * 60 * 24, // 24 h
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

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
      });
      const res = NextResponse.json({ ok: true });
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
        });
        const res = NextResponse.json({ ok: true });
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
