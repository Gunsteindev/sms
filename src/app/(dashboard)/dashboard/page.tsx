'use client';

import { useEffect, useState } from 'react';
import { Users, GraduationCap, UserCheck, DollarSign, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { dashboardAPI } from '@/lib/api-client';
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

const ICON_BG: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-600',
  violet: 'bg-violet-100 text-violet-600',
  green:  'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  sky:    'bg-sky-100 text-sky-600',
  pink:   'bg-pink-100 text-pink-600',
};

function StatCard({ title, value, icon: Icon, color, delta }: ReturnType<typeof statCards>[0]) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">{delta} this month</span>
            </div>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${ICON_BG[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
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
      <div className="flex h-80 flex-col items-center justify-center gap-3 text-gray-400">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="text-sm">Failed to load dashboard</p>
        <button onClick={load} className="text-xs text-blue-600 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back — here&apos;s your school overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards(stats).map((c) => <StatCard key={c.title} {...c} />)}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trends.length ? (
              <AttendanceChart data={trends} />
            ) : (
              <div className="h-60 flex items-center justify-center text-sm text-gray-400">No trend data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
