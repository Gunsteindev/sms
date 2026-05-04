'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Users, GraduationCap, UserCheck, DollarSign, BookOpen,
    AlertCircle, Building2, Layers, Award, Calendar,
    CalendarRange, CalendarDays, ClipboardList, UserCircle,
    Briefcase, BarChart3, RefreshCw,
} from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { AISummary } from '@/components/ui/AISummary';
import { Button } from '@/components/ui/Button';
import {
    dashboardAPI, academicYearsAPI, termsAPI,
    departmentsAPI, gradeLevelsAPI, scholarshipsAPI,
} from '@/lib/api-client';
import type { AcademicYear } from '@/lib/dataverse/academicyears';
import type { Term } from '@/lib/dataverse/terms';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
    totalStudents:  number;
    totalTeachers:  number;
    totalEmployees: number;
    totalClasses:   number;
    todayAttendance: number;
    monthlyRevenue:  number;
}
interface TrendPoint { date: string; percentage: number; present: number; total: number; }

interface Secondary {
    departments:  number;
    gradeLevels:  number;
    scholarships: number;
    terms:        number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtGHS(n: number) {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(n);
}

// ── Primary stat card ─────────────────────────────────────────────────────────
interface PrimaryCard {
    title: string;
    value: string | number;
    sub?:  string;
    icon:  React.ElementType;
    accent: string;
    iconBg: string;
    iconFg: string;
}

function PrimaryStatCard({ title, value, sub, icon: Icon, accent, iconBg, iconFg }: PrimaryCard) {
    return (
        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />
            <div className="flex items-start justify-between gap-3 mt-1">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50 leading-none tracking-tight">{value}</p>
                    {sub && <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
                </div>
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconFg}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

// ── Secondary stat card ───────────────────────────────────────────────────────
function SecondaryStatCard({ label, value, icon: Icon, bg, fg }: {
    label: string; value: number; icon: React.ElementType; bg: string; fg: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${bg} ${fg}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

// ── Quick link card ───────────────────────────────────────────────────────────
const QUICK_LINKS = [
    { href: '/students',               icon: Users,         label: 'Students',     bg: 'bg-blue-50 dark:bg-blue-900/30',    fg: 'text-blue-600 dark:text-blue-400' },
    { href: '/teachers',               icon: UserCircle,    label: 'Teachers',     bg: 'bg-violet-50 dark:bg-violet-900/30', fg: 'text-violet-600 dark:text-violet-400' },
    { href: '/employees',              icon: Briefcase,     label: 'Employees',    bg: 'bg-pink-50 dark:bg-pink-900/30',    fg: 'text-pink-600 dark:text-pink-400' },
    { href: '/attendance',             icon: Calendar,      label: 'Attendance',   bg: 'bg-emerald-50 dark:bg-emerald-900/30', fg: 'text-emerald-600 dark:text-emerald-400' },
    { href: '/classes',                icon: BookOpen,      label: 'Classes',      bg: 'bg-sky-50 dark:bg-sky-900/30',      fg: 'text-sky-600 dark:text-sky-400' },
    { href: '/enrollments',            icon: ClipboardList, label: 'Enrollments',  bg: 'bg-amber-50 dark:bg-amber-900/30',  fg: 'text-amber-600 dark:text-amber-400' },
    { href: '/departments',            icon: Building2,     label: 'Departments',  bg: 'bg-orange-50 dark:bg-orange-900/30', fg: 'text-orange-600 dark:text-orange-400' },
    { href: '/fees',                   icon: DollarSign,    label: 'Fees',         bg: 'bg-teal-50 dark:bg-teal-900/30',    fg: 'text-teal-600 dark:text-teal-400' },
    { href: '/finance/scholarships',   icon: Award,         label: 'Scholarships', bg: 'bg-yellow-50 dark:bg-yellow-900/30', fg: 'text-yellow-600 dark:text-yellow-400' },
    { href: '/reports',                icon: BarChart3,     label: 'Reports',      bg: 'bg-slate-100 dark:bg-slate-800',    fg: 'text-slate-600 dark:text-slate-400' },
    { href: '/setup/grade-levels',     icon: Layers,        label: 'Grade Levels', bg: 'bg-purple-50 dark:bg-purple-900/30', fg: 'text-purple-600 dark:text-purple-400' },
    { href: '/setup/academic-years',   icon: CalendarRange, label: 'Acad. Years',  bg: 'bg-indigo-50 dark:bg-indigo-900/30', fg: 'text-indigo-600 dark:text-indigo-400' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const [stats,     setStats]     = useState<Stats | null>(null);
    const [secondary, setSecondary] = useState<Secondary | null>(null);
    const [trends,    setTrends]    = useState<TrendPoint[]>([]);
    const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
    const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(false);

    const load = async () => {
        setLoading(true); setError(false);
        try {
            // Use allSettled — a failing secondary call must never crash the dashboard
            const [fullRes, ayRes, termRes, deptRes, glRes, schRes] =
                await Promise.allSettled([
                    dashboardAPI.getFullData(),
                    academicYearsAPI.getAll(),
                    termsAPI.getAll(),
                    departmentsAPI.getAll(),
                    gradeLevelsAPI.getAll(),
                    scholarshipsAPI.getAll(),
                ]);

            // The core stats are required — if they fail, show the error state
            if (fullRes.status === 'rejected') {
                setError(true);
                toast.error('Failed to load dashboard data');
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ok = (r: PromiseSettledResult<unknown>): any =>
                r.status === 'fulfilled' ? r.value : null;

            const full = ok(fullRes);
            setStats(full?.data?.stats ?? null);
            setTrends(full?.data?.attendanceTrends ?? []);

            const years: AcademicYear[] = ok(ayRes)?.data ?? [];
            const cy = years.find(y => y.iscurrent) ?? years[0] ?? null;
            setCurrentYear(cy);

            const today = new Date();
            const terms: Term[] = ok(termRes)?.data ?? [];
            const ct = terms.find(t =>
                t.startdate && t.enddate &&
                !isBefore(today, new Date(t.startdate)) &&
                !isAfter(today, new Date(t.enddate))
            ) ?? null;
            setCurrentTerm(ct);

            setSecondary({
                departments:  (ok(deptRes)?.data ?? []).length,
                gradeLevels:  (ok(glRes)?.data   ?? []).length,
                scholarships: (ok(schRes)?.data  ?? []).length,
                terms:        terms.length,
            });
        } catch {
            setError(true);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) {
        return (
            <div className="flex h-80 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-500" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex h-80 flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
                <AlertCircle className="h-10 w-10 opacity-40" />
                <p className="text-sm">Failed to load dashboard</p>
                <button onClick={load} className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    <RefreshCw className="h-3 w-3" /> Retry
                </button>
            </div>
        );
    }

    const primaryCards: PrimaryCard[] = [
        {
            title: 'Total Students',
            value: stats.totalStudents,
            sub:   `${stats.totalStudents} enrolled`,
            icon:  Users,
            accent: 'bg-blue-500',
            iconBg: 'bg-blue-50 dark:bg-blue-900/30',
            iconFg: 'text-blue-600 dark:text-blue-400',
        },
        {
            title: 'Teachers',
            value: stats.totalTeachers,
            sub:   `${stats.totalEmployees} total staff`,
            icon:  GraduationCap,
            accent: 'bg-violet-500',
            iconBg: 'bg-violet-50 dark:bg-violet-900/30',
            iconFg: 'text-violet-600 dark:text-violet-400',
        },
        {
            title: "Today's Attendance",
            value: stats.todayAttendance > 0 ? `${stats.todayAttendance.toFixed(1)}%` : '—',
            sub:   stats.todayAttendance > 0 ? 'of students present' : 'No records today',
            icon:  UserCheck,
            accent: 'bg-emerald-500',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
            iconFg: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            title: 'Total Collected',
            value: stats.monthlyRevenue > 0 ? fmtGHS(stats.monthlyRevenue) : 'GHS 0',
            sub:   'All-time fee collections',
            icon:  DollarSign,
            accent: 'bg-orange-500',
            iconBg: 'bg-orange-50 dark:bg-orange-900/30',
            iconFg: 'text-orange-600 dark:text-orange-400',
        },
    ];

    return (
        <div className="space-y-5">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {format(new Date(), 'EEEE, d MMMM yyyy')}
                    </p>
                </div>

                {/* Academic context pills + refresh */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    {currentYear && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                            <CalendarRange className="h-3 w-3" />
                            {currentYear.name}
                        </span>
                    )}
                    {currentTerm ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            <CalendarDays className="h-3 w-3" />
                            {currentTerm.name} · Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <CalendarDays className="h-3 w-3" />
                            No active term
                        </span>
                    )}
                </div>
            </div>

            {/* ── AI Summary ─────────────────────────────────────────────── */}
            <AISummary type="dashboard" getData={() => ({ stats, recentAttendanceTrend: trends.slice(-7) })} />

            {/* ── Primary stats ──────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {primaryCards.map(c => <PrimaryStatCard key={c.title} {...c} />)}
            </div>

            {/* ── Secondary stats ────────────────────────────────────────── */}
            {secondary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <SecondaryStatCard label="Classes"     value={stats.totalClasses}      icon={BookOpen}   bg="bg-sky-50 dark:bg-sky-900/30"       fg="text-sky-600 dark:text-sky-400" />
                    <SecondaryStatCard label="Departments" value={secondary.departments}   icon={Building2}  bg="bg-orange-50 dark:bg-orange-900/30" fg="text-orange-600 dark:text-orange-400" />
                    <SecondaryStatCard label="Grade Levels"value={secondary.gradeLevels}   icon={Layers}     bg="bg-purple-50 dark:bg-purple-900/30" fg="text-purple-600 dark:text-purple-400" />
                    <SecondaryStatCard label="Scholarships"value={secondary.scholarships}  icon={Award}      bg="bg-amber-50 dark:bg-amber-900/30"   fg="text-amber-600 dark:text-amber-400" />
                </div>
            )}

            {/* ── Charts + Quick Links ────────────────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-2">

                {/* Attendance trend chart */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Attendance Trend</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Last 30 days</p>
                    </div>
                    <div className="p-5">
                        {trends.length ? (
                            <AttendanceChart data={trends} />
                        ) : (
                            <div className="h-60 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                                <UserCheck className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No attendance data yet</p>
                                <Link href="/attendance" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                    Record attendance →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick links */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Quick Access</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Jump to any module</p>
                    </div>
                    <div className="p-4 grid grid-cols-4 gap-2">
                        {QUICK_LINKS.map(({ href, icon: Icon, label, bg, fg }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex flex-col items-center gap-1.5 rounded-lg p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${bg} ${fg} group-hover:scale-105 transition-transform`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight">
                                    {label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
