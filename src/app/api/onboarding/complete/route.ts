import { NextRequest, NextResponse } from 'next/server';
import { getSession, serverError } from '@/lib/api-guard';
import { createSchool } from '@/lib/dataverse/school';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';
import type { UpsertSchoolRequest } from '@/lib/dataverse/school';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.userrole !== 1) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body: UpsertSchoolRequest = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'School name is required' }, { status: 400 });
    }

    // Always create a brand-new school record — never reuse an existing one.
    const school = await createSchool(body);

    // Re-issue session JWT scoped to the newly created school.
    const newToken = await createSessionToken({
      userid:   session.userid,
      email:    session.email,
      name:     session.name,
      role:     session.role,
      userrole: session.userrole,
      schoolId: school.schoolid,
    });

    const res = NextResponse.json({ success: true, schoolId: school.schoolid });
    res.cookies.set(SESSION_COOKIE, newToken, COOKIE_OPTS);
    return res;
  } catch (e) {
    return serverError(e);
  }
}
