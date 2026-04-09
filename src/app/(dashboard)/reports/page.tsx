'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, GraduationCap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { dashboardAPI, attendanceAPI } from '@/lib/api-client';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendance: number;
  monthlyRevenue: number;
}

interface TrendPoint { date: string; percentage: number; present: number; total: number; }

export default function ReportsPage() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [trends, setTrends]   = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [statsRes, trendsRes]: any[] = await Promise.all([
        dashboardAPI.getStats(),
        attendanceAPI.getTrends(30),
      ]);
      setStats(statsRes.data ?? null);
      setTrends(trendsRes.data ?? []);
    } catch { toast.error('Failed to load report data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Enrolment',         value: stats?.totalStudents ?? 0, icon: Users,          color: 'bg-blue-100 text-blue-600',   note: 'Active students' },
    { label: 'Teaching Staff',    value: stats?.totalTeachers ?? 0, icon: GraduationCap,  color: 'bg-violet-100 text-violet-600', note: 'Current teachers' },
    { label: 'Today Attendance',  value: `${(stats?.todayAttendance ?? 0).toFixed(1)}%`, icon: TrendingUp, color: 'bg-green-100 text-green-600', note: 'Overall rate' },
    { label: 'Monthly Revenue',   value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, icon: BarChart3, color: 'bg-orange-100 text-orange-600', note: 'This month' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">School-wide analytics and performance overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(({ label, value, icon: Icon, color, note }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{note}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend (30 days)</CardTitle>
            <p className="text-xs text-gray-400 mt-1">Daily attendance percentage across all classes</p>
          </CardHeader>
          <CardContent>
            {trends.length ? (
              <AttendanceChart data={trends} />
            ) : (
              <div className="h-60 flex flex-col items-center justify-center gap-2 text-gray-400">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="text-sm">No attendance data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <p className="text-xs text-gray-400 mt-1">Average, highest, and lowest scores by subject</p>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>
      </div>

      {/* Attendance breakdown table */}
      {trends.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Daily Attendance Log</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Date', 'Present', 'Total', 'Rate'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trends.slice(-14).reverse().map((t) => (
                    <tr key={t.date} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-700">{new Date(t.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                      <td className="px-4 py-2.5 text-gray-700">{t.present}</td>
                      <td className="px-4 py-2.5 text-gray-500">{t.total}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${t.percentage >= 90 ? 'bg-green-500' : t.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-400'}`}
                              style={{ width: `${t.percentage}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${t.percentage >= 90 ? 'text-green-600' : t.percentage >= 75 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {t.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
