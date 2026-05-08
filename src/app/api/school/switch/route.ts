import { NextRequest, NextResponse } from 'next/server';
import { getSession, serverError } from '@/lib/api-guard';
import { getSchoolById } from '@/lib/dataverse/school';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';

const COOKIE_OPTS = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   60 * 60 * 24,
};

export async function POST(req: NextRequest) {
    try {
        const session = await getSession(req);
        if (!session || session.userrole !== 1) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { schoolId } = await req.json();
        if (!schoolId) {
            return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 });
        }

        const school = await getSchoolById(schoolId);
        if (!school) {
            return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
        }

        const newToken = await createSessionToken({
            userid:   session.userid,
            email:    session.email,
            name:     session.name,
            role:     session.role,
            userrole: session.userrole,
            schoolId: school.schoolid,
        });

        const res = NextResponse.json({ success: true, schoolId: school.schoolid, name: school.name });
        res.cookies.set(SESSION_COOKIE, newToken, COOKIE_OPTS);
        return res;
    } catch (e) {
        return serverError(e);
    }
}
