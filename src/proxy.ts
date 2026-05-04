import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

const PUBLIC_PATHS = [
    '/auth/login',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/session',
    '/api/auth/',       // NextAuth catch-all
    '/api/health',
];

function isPublic(pathname: string) {
    return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isPublic(pathname)) return NextResponse.next();

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const user  = token ? await verifySessionToken(token) : null;

    // Unauthenticated API request → 401
    if (pathname.startsWith('/api/')) {
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.next();
    }

    // Unauthenticated page request → redirect to login
    if (!user) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
        '/(dashboard)/:path*',
        '/gradebook/:path*',
        '/students/:path*',
        '/teachers/:path*',
        '/classes/:path*',
        '/departments/:path*',
        '/employees/:path*',
        '/attendance/:path*',
        '/enrollments/:path*',
        '/exams/:path*',
        '/fees/:path*',
        '/finance/:path*',
        '/library/:path*',
        '/subjects/:path*',
        '/timetable/:path*',
        '/reports/:path*',
        '/setup/:path*',
        '/dashboard/:path*',
        '/profile/:path*',
        '/settings/:path*',
    ],
};
