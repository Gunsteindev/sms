'use client';

import { useEffect, useState } from 'react';
import { Users, GraduationCap, UserCheck, DollarSign, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { dashboardAPI } from '@/lib/api-client';
import { AISummary } from '@/components/ui/AISummary';
import toast from 'react-hot-toast';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalEmployees: number;
  totalClasses: number;
  todayAttendance: number;
  monthlyRevenue: number;
}

interface TrendPoint { date: string; percentage: number; present: number; total: number; }

const statCards = (s: Stats) => [
  { title: 'Total Students',   value: s.totalStudents,                              icon: Users,          color: 'blue',   delta: '+4%' },
  { title: 'Teachers',         value: s.totalTeachers,                              icon: GraduationCap,  color: 'violet', delta: '+1%' },
  { title: 'Today Attendance', value: `${s.todayAttendance.toFixed(1)}%`,           icon: UserCheck,      color: 'green',  delta: '+2%' },
  { title: 'Monthly Revenue',  value: `$${s.monthlyRevenue.toLocaleString()}`,      icon: DollarSign,     color: 'orange', delta: '+12%' },
  { title: 'Total Classes',    value: s.totalClasses,                               icon: BookOpen,       color: 'sky',    delta: '0%' },
  { title: 'Total Employees',  value: s.totalEmployees,                             icon: Users,          color: 'pink',   delta: '+3%' },
];

const COLOR_MAP: Record<string, { accent: string; light: string; darkLight: string; icon: string; darkIcon: string; border: string; darkBorder: string }> = {
  blue:   { accent: 'bg-blue-500',    light: 'bg-blue-50',    darkLight: 'dark:bg-blue-900/30',    icon: 'text-blue-600',    darkIcon: 'dark:text-blue-400',    border: 'border-blue-100',    darkBorder: 'dark:border-blue-900' },
  violet: { accent: 'bg-violet-500',  light: 'bg-violet-50',  darkLight: 'dark:bg-violet-900/30',  icon: 'text-violet-600',  darkIcon: 'dark:text-violet-400',  border: 'border-violet-100',  darkBorder: 'dark:border-violet-900' },
  green:  { accent: 'bg-emerald-500', light: 'bg-emerald-50', darkLight: 'dark:bg-emerald-900/30', icon: 'text-emerald-600', darkIcon: 'dark:text-emerald-400', border: 'border-emerald-100', darkBorder: 'dark:border-emerald-900' },
  orange: { accent: 'bg-orange-500',  light: 'bg-orange-50',  darkLight: 'dark:bg-orange-900/30',  icon: 'text-orange-600',  darkIcon: 'dark:text-orange-400',  border: 'border-orange-100',  darkBorder: 'dark:border-orange-900' },
  sky:    { accent: 'bg-sky-500',     light: 'bg-sky-50',     darkLight: 'dark:bg-sky-900/30',     icon: 'text-sky-600',     darkIcon: 'dark:text-sky-400',     border: 'border-sky-100',     darkBorder: 'dark:border-sky-900' },
  pink:   { accent: 'bg-pink-500',    light: 'bg-pink-50',    darkLight: 'dark:bg-pink-900/30',    icon: 'text-pink-600',    darkIcon: 'dark:text-pink-400',    border: 'border-pink-100',    darkBorder: 'dark:border-pink-900' },
};

function StatCard({ title, value, icon: Icon, color, delta }: ReturnType<typeof statCards>[0]) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <div className={`relative rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-sm overflow-hidden ${c.border} ${c.darkBorder}`}>
      <div className={`absolute inset-x-0 top-0 h-1 ${c.accent}`} />
      <div className="flex items-start justify-between gap-4 mt-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2.5 text-3xl font-bold text-slate-900 dark:text-slate-50 leading-none tracking-tight">{value}</p>
          <div className="flex items-center gap-1.5 mt-3">
            <TrendingUp className="h-3 w-3 text-emerald-500 flex-shrink-0" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{delta} this month</span>
          </div>
        </div>
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${c.light} ${c.darkLight}`}>
          <Icon className={`h-6 w-6 ${c.icon} ${c.darkIcon}`} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [statsRes, trendsRes]: any[] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getFullData(),
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data?.attendanceTrends ?? []);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="text-sm">Failed to load dashboard</p>
        <button onClick={load} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Welcome back — here&apos;s your school overview.</p>
      </div>

      <AISummary type="dashboard" getData={() => ({ stats, recentAttendanceTrend: trends.slice(-7) })} />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards(stats).map((c) => <StatCard key={c.title} {...c} />)}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Attendance Trend</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Last 30 days</p>
          </div>
          <div className="p-5">
            {trends.length ? (
              <AttendanceChart data={trends} />
            ) : (
              <div className="h-60 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">No trend data yet</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Subject Performance</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Current term</p>
          </div>
          <div className="p-5">
            <PerformanceChart />
          </div>
        </div>
      </div>
    </div>
  );
}
