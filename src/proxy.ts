import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

// Role constants
const ADMIN       = 1;
const TEACHER     = 2;
const FINANCE     = 3;
const INVENTORY   = 4;
const TRANSPORT   = 5;
const POOL        = 6;
const PARENT      = 7;
const KITCHEN     = 8;

const PUBLIC_PATHS = [
    '/auth/login',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/session',
    '/api/auth/',
    '/api/health',
];

const ONBOARDING_PATHS = ['/onboarding', '/api/onboarding'];

// Routes restricted to specific roles. Paths are prefix-matched.
// Roles NOT listed here means Admin-only.
const ROLE_ACCESS: { path: string; roles: number[] }[] = [
    // Everyone authenticated can see the dashboard and their profile/settings
    { path: '/dashboard',          roles: [ADMIN, TEACHER, FINANCE, INVENTORY, TRANSPORT, POOL, KITCHEN, PARENT] },
    { path: '/api/dashboard',      roles: [ADMIN, TEACHER, FINANCE, INVENTORY, TRANSPORT, POOL, KITCHEN, PARENT] },
    { path: '/profile',            roles: [ADMIN, TEACHER, FINANCE, INVENTORY, TRANSPORT, POOL, KITCHEN, PARENT] },
    { path: '/settings',           roles: [ADMIN, TEACHER, FINANCE, INVENTORY, TRANSPORT, POOL, KITCHEN, PARENT] },

    // Student data — admin, teachers, finance (for billing), inventory
    { path: '/students',           roles: [ADMIN, TEACHER, FINANCE, INVENTORY] },
    { path: '/api/students',       roles: [ADMIN, TEACHER, FINANCE, INVENTORY] },
    { path: '/api/parents',        roles: [ADMIN, TEACHER, FINANCE] },
    { path: '/api/student-parents',roles: [ADMIN, TEACHER, FINANCE] },
    { path: '/parents',            roles: [ADMIN, TEACHER, FINANCE] },

    // Academic
    { path: '/classes',            roles: [ADMIN, TEACHER] },
    { path: '/api/classes',        roles: [ADMIN, TEACHER, FINANCE] },
    { path: '/subjects',           roles: [ADMIN, TEACHER] },
    { path: '/api/subjects',       roles: [ADMIN, TEACHER] },
    { path: '/timetable',          roles: [ADMIN, TEACHER] },
    { path: '/api/timetable',      roles: [ADMIN, TEACHER] },
    { path: '/enrollments',        roles: [ADMIN, TEACHER, FINANCE] },
    { path: '/api/enrollments',    roles: [ADMIN, TEACHER, FINANCE] },
    { path: '/attendance',         roles: [ADMIN, TEACHER] },
    { path: '/api/attendance',     roles: [ADMIN, TEACHER] },
    { path: '/exams',              roles: [ADMIN, TEACHER] },
    { path: '/api/exams',          roles: [ADMIN, TEACHER] },
    { path: '/gradebook',          roles: [ADMIN, TEACHER] },
    { path: '/api/grades',         roles: [ADMIN, TEACHER] },
    { path: '/api/grade-levels',   roles: [ADMIN, TEACHER, FINANCE] },
    { path: '/api/academic-years', roles: [ADMIN, TEACHER, FINANCE] },
    { path: '/api/terms',          roles: [ADMIN, TEACHER, FINANCE] },

    // Finance
    { path: '/fees',               roles: [ADMIN, FINANCE] },
    { path: '/api/fees',           roles: [ADMIN, FINANCE] },
    { path: '/finance',            roles: [ADMIN, FINANCE] },
    { path: '/api/finance',        roles: [ADMIN, FINANCE] },
    { path: '/api/fee-types',      roles: [ADMIN, FINANCE] },

    // Library / Inventory
    { path: '/library',            roles: [ADMIN, INVENTORY] },
    { path: '/api/library',        roles: [ADMIN, INVENTORY, TEACHER] },
    { path: '/inventory',          roles: [ADMIN, INVENTORY] },
    { path: '/api/inventory',      roles: [ADMIN, INVENTORY] },
    { path: '/procurement',        roles: [ADMIN, FINANCE] },
    { path: '/api/procurement',    roles: [ADMIN, FINANCE] },
    { path: '/staff-leave',        roles: [ADMIN] },
    { path: '/api/staff-leave',    roles: [ADMIN] },

    // Admin + HR
    { path: '/departments',        roles: [ADMIN] },
    { path: '/api/departments',    roles: [ADMIN, TEACHER, FINANCE, INVENTORY] },
    { path: '/employees',          roles: [ADMIN] },
    { path: '/api/employees',      roles: [ADMIN] },
    { path: '/teachers',           roles: [ADMIN] },
    { path: '/api/teachers',       roles: [ADMIN, TEACHER] },

    // Welfare
    { path: '/health',             roles: [ADMIN, TEACHER] },
    { path: '/api/medical',        roles: [ADMIN, TEACHER] },
    { path: '/disciplinary',       roles: [ADMIN, TEACHER] },
    { path: '/api/disciplinary',   roles: [ADMIN, TEACHER] },

    // Reports
    { path: '/reports',            roles: [ADMIN, TEACHER, FINANCE] },
    { path: '/api/reports',        roles: [ADMIN, TEACHER, FINANCE] },

    // Setup — admin only (no entry needed; unlisted paths default to admin-only)

    // Announcements
    { path: '/announcements',      roles: [ADMIN, TEACHER, FINANCE] },
    { path: '/api/announcements',  roles: [ADMIN, TEACHER, FINANCE, INVENTORY, TRANSPORT, POOL, PARENT] },

    // Parent feedback — admin reviews & responds (parents submit via /api/portal/feedback)
    { path: '/feedback',           roles: [ADMIN] },
    { path: '/api/feedback',       roles: [ADMIN] },

    // Transport
    { path: '/transport',          roles: [ADMIN, TRANSPORT] },
    { path: '/api/transport',      roles: [ADMIN, TRANSPORT] },

    // Swimming Pool
    { path: '/pool',               roles: [ADMIN, POOL, KITCHEN] },
    { path: '/api/pool',           roles: [ADMIN, POOL, KITCHEN] },

    // Kitchen / Cafeteria
    { path: '/kitchen',            roles: [ADMIN, KITCHEN] },
    { path: '/api/kitchen',        roles: [ADMIN, KITCHEN] },

    // Extracurricular Activities
    { path: '/activities',         roles: [ADMIN, TEACHER] },
    { path: '/api/activities',     roles: [ADMIN, TEACHER] },

    // Parent Portal (standalone parent-facing experience)
    { path: '/parent',             roles: [ADMIN, PARENT] },
    { path: '/portal',             roles: [ADMIN, PARENT] },
    { path: '/api/portal',         roles: [ADMIN, PARENT] },

    // School profile (read) — needed by every role for branding (logo/name)
    { path: '/api/school',         roles: [ADMIN, TEACHER, FINANCE, INVENTORY, TRANSPORT, POOL, KITCHEN, PARENT] },
];

function isPublic(pathname: string) {
    return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p));
}

function getAllowedRoles(pathname: string): number[] | null {
    const match = ROLE_ACCESS.find(r => pathname === r.path || pathname.startsWith(r.path + '/') || pathname.startsWith(r.path + '?'));
    return match ? match.roles : null; // null = admin-only
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isPublic(pathname)) return NextResponse.next();

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const user  = token ? await verifySessionToken(token) : null;

    // Unauthenticated
    if (!user) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Onboarding gate — admin without a school must complete setup first
    const isOnboardingPath = ONBOARDING_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (user.userrole === ADMIN && !user.schoolId && !isOnboardingPath && !pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    // Allow admins to visit /onboarding at any time (to switch school or add a new one)

    // The old in-dashboard /portal moved to the standalone /parent experience
    if (pathname === '/portal' || pathname.startsWith('/portal/')) {
        return NextResponse.redirect(new URL('/parent', request.url));
    }

    // Role check
    const allowedRoles = getAllowedRoles(pathname);
    if (allowedRoles !== null && !allowedRoles.includes(user.userrole)) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        // Parents have their own home; everyone else falls back to the dashboard
        return NextResponse.redirect(new URL(user.userrole === PARENT ? '/parent' : '/dashboard', request.url));
    }

    // Inject school context header for route handlers.
    // Always strip any client-supplied value first so the tenant can only ever come
    // from the verified JWT — never from a forged request header.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete('x-school-id');
    if (user?.schoolId) requestHeaders.set('x-school-id', user.schoolId);
    return NextResponse.next({ request: { headers: requestHeaders } });
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
        '/health/:path*',
        '/disciplinary/:path*',
        '/parents/:path*',
        '/inventory/:path*',
        '/procurement/:path*',
        '/staff-leave/:path*',
        '/announcements/:path*',
        '/feedback',
        '/feedback/:path*',
        '/transport/:path*',
        '/activities/:path*',
        '/portal/:path*',
        '/parent',
        '/parent/:path*',
        '/pool/:path*',
        '/kitchen',
        '/kitchen/:path*',
        '/onboarding/:path*',
        '/api/onboarding/:path*',
    ],
};
