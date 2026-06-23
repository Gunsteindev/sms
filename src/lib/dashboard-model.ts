// Pure dashboard derivation shared by the Server Component (initial render)
// and the client Refresh path, so both produce identical results from the same
// raw data. Only `import type` from the Dataverse modules — no runtime server
// code is pulled into the client bundle.
import { isAfter, isBefore } from 'date-fns';
import type { AcademicYear } from './dataverse/academicyears';
import type { Term } from './dataverse/terms';
import type { PoolSession } from './dataverse/poolsessions';

export interface Stats {
    totalStudents:  number;
    totalTeachers:  number;
    totalEmployees: number;
    totalClasses:   number;
    todayAttendance: number;
    monthlyRevenue:  number;
}

export interface TrendPoint { date: string; percentage: number; present: number; total: number; }

export interface Secondary {
    departments:  number;
    gradeLevels:  number;
    scholarships: number;
    terms:        number;
    vehicles:     number;
    activities:   number;
    announcements: number;
    poolSessions: number;
}

export interface DashboardModel {
    stats:       Stats | null;
    trends:      TrendPoint[];
    secondary:   Secondary;
    currentYear: AcademicYear | null;
    currentTerm: Term | null;
    openSession: PoolSession | null;
    poolRevenue: number;
}

/** Raw inputs, already unwrapped from their transport ({ data }) or returned directly by Dataverse. */
export interface DashboardRaw {
    full:         { stats: Stats; attendanceTrends: TrendPoint[] } | null;
    years:        AcademicYear[];
    terms:        Term[];
    departments:  unknown[];
    gradeLevels:  unknown[];
    scholarships: unknown[];
    sessions:     PoolSession[];
    vehicles:     unknown[];
    activities:   { status: number }[];
    announcements: unknown[];
}

export function buildDashboardModel(raw: DashboardRaw): DashboardModel {
    const today = new Date();

    const currentYear = raw.years.find(y => y.iscurrent) ?? raw.years[0] ?? null;

    const currentTerm = raw.terms.find(t =>
        t.startdate && t.enddate &&
        !isBefore(today, new Date(t.startdate)) &&
        !isAfter(today, new Date(t.enddate)),
    ) ?? null;

    const openSession = raw.sessions.find(s => s.status === 1) ?? null;
    const poolRevenue = raw.sessions.reduce((a, s) => a + (s.totalrevenue ?? 0), 0);

    return {
        stats:  raw.full?.stats ?? null,
        trends: raw.full?.attendanceTrends ?? [],
        secondary: {
            departments:   raw.departments.length,
            gradeLevels:   raw.gradeLevels.length,
            scholarships:  raw.scholarships.length,
            terms:         raw.terms.length,
            vehicles:      raw.vehicles.length,
            activities:    raw.activities.filter(a => a.status === 1).length,
            announcements: raw.announcements.length,
            poolSessions:  raw.sessions.length,
        },
        currentYear,
        currentTerm,
        openSession,
        poolRevenue,
    };
}
