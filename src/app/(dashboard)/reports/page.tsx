'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Users, GraduationCap, BookOpen, TrendingUp, DollarSign,
  CalendarDays, RefreshCw, AlertCircle, UserCheck,
  Waves, Bus, Trophy, Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  dashboardAPI, attendanceAPI, studentsAPI, classesAPI,
  feePaymentsAPI, poolSessionsAPI, transportAPI, activitiesAPI,
} from '@/lib/api-client';
import { useTheme } from '@/contexts/ThemeContext';
import type { Student } from '@/lib/dataverse/students';
import type { FeePayment } from '@/lib/dataverse/fees';
import type { PoolSession } from '@/lib/dataverse/poolsessions';
import type { Vehicle } from '@/lib/dataverse/transport';
import type { Activity } from '@/lib/dataverse/activities';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalStudents: number; totalTeachers: number; totalClasses: number;
  todayAttendance: number; monthlyRevenue: number; activeUsers: number;
}
interface TrendPoint { date: string; percentage: number; present: number; total: number; }

// ─── Constants ────────────────────────────────────────────────────────────────
const TREND_OPTIONS = [
  { label: '7 days',  value: 7  },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const STATUS_CFG: Record<number, { label: string; lightColor: string; darkColor: string; bar: string }> = {
  1: { label: 'Active',      lightColor: 'text-emerald-600', darkColor: 'dark:text-emerald-400', bar: 'bg-emerald-500' },
  2: { label: 'Graduated',   lightColor: 'text-blue-600',    darkColor: 'dark:text-blue-400',    bar: 'bg-blue-500'    },
  3: { label: 'Transferred', lightColor: 'text-amber-600',   darkColor: 'dark:text-amber-400',   bar: 'bg-amber-500'   },
  4: { label: 'Suspended',   lightColor: 'text-red-500',     darkColor: 'dark:text-red-400',     bar: 'bg-red-400'     },
};

const ACT_CATS: Record<number, string> = {
  1: 'Sports', 2: 'Arts', 3: 'Music', 4: 'Drama',
  5: 'Science', 6: 'Academic', 7: 'Cultural', 8: 'Other',
};

const ACT_COLORS   = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6'];
const CLASS_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6','#f97316'];
const FEE_COLOR    = '#10b981';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return d; }
}

function formatCurrency(n: number) {
  if (n >= 1000) return `GHS ${(n / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(n);
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, iconBg }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${color}`}>
      <Icon className="h-5 w-5 flex-shrink-0 opacity-80" />
      <div>
        <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // ── Chart theme tokens (Recharts only accepts inline strings, not CSS vars) ──
  const CT = {
    grid:      isDark ? 'rgba(100,116,139,0.18)' : '#f1f5f9',
    tick:      isDark ? '#64748b'  : '#94a3b8',
    ttBg:      isDark ? '#1e293b'  : '#ffffff',
    ttBorder:  isDark ? '#334155'  : '#e2e8f0',
    ttText:    isDark ? '#e2e8f0'  : '#0f172a',
    ttLabel:   isDark ? '#94a3b8'  : '#64748b',
    cursor:    isDark ? 'rgba(100,116,139,0.12)' : '#f8fafc',
    areaFill:  isDark ? 0.20 : 0.14,
  };

  const ttStyle = {
    borderRadius: 10,
    border: `1px solid ${CT.ttBorder}`,
    backgroundColor: CT.ttBg,
    color: CT.ttText,
    fontSize: 12,
    boxShadow: isDark
      ? '0 8px 24px rgba(0,0,0,0.5)'
      : '0 4px 16px rgba(0,0,0,0.08)',
  };

  const [stats,        setStats]        = useState<DashboardStats | null>(null);
  const [trends,       setTrends]       = useState<TrendPoint[]>([]);
  const [students,     setStudents]     = useState<Student[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classes,      setClasses]      = useState<any[]>([]);
  const [feePayments,  setFeePayments]  = useState<FeePayment[]>([]);
  const [poolSessions, setPoolSessions] = useState<PoolSession[]>([]);
  const [vehicles,     setVehicles]     = useState<Vehicle[]>([]);
  const [activities,   setActivities]   = useState<Activity[]>([]);
  const [days,         setDays]         = useState(30);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [statsRes, trendsRes, stuRes, clsRes]: any[] = await Promise.all([
        dashboardAPI.getStats(),
        attendanceAPI.getTrends(days),
        studentsAPI.getAll({ pageSize: 2000 }),
        classesAPI.getAll(),
      ]);
      setStats(statsRes.data ?? null);
      setTrends(trendsRes.data ?? []);
      setStudents(stuRes.data ?? []);
      setClasses(clsRes.data ?? []);
    } catch { toast.error('Failed to load report data'); }

    const [fpRes, psRes, vRes, actRes] = await Promise.allSettled([
      feePaymentsAPI.getAll({ pageSize: 5000 }),
      poolSessionsAPI.getAll(),
      transportAPI.getAll(),
      activitiesAPI.getAll(),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (fpRes.status  === 'fulfilled') setFeePayments((fpRes.value  as any).data ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (psRes.status  === 'fulfilled') setPoolSessions((psRes.value as any).data ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (vRes.status   === 'fulfilled') setVehicles((vRes.value      as any).data ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (actRes.status === 'fulfilled') setActivities((actRes.value  as any).data ?? []);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [days]);

  // ── Derived: students ──────────────────────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    students.forEach(s => { const k = s.studentstatus || 1; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts)
      .map(([k, v]) => ({ status: Number(k), count: v, cfg: STATUS_CFG[Number(k)] }))
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [students]);

  const genderBreakdown = useMemo(() => {
    let male = 0, female = 0;
    students.forEach(s => { if (s.gender === 1) male++; else if (s.gender === 2) female++; });
    return { male, female, total: male + female };
  }, [students]);

  const classBreakdown = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    students.forEach(s => {
      const name = s.classname || 'Unassigned';
      if (!map[name]) map[name] = { name, count: 0 };
      map[name].count++;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const avgAttendance = useMemo(() => {
    if (!trends.length) return 0;
    return trends.reduce((s, t) => s + t.percentage, 0) / trends.length;
  }, [trends]);

  // ── Derived: fee payments by month ────────────────────────────────────────
  const feeMonthly = useMemo(() => {
    const map: Record<string, number> = {};
    feePayments.forEach(p => {
      if (!p.paymentdate) return;
      const month = p.paymentdate.slice(0, 7);
      map[month] = (map[month] || 0) + (p.amount || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, total]) => ({
        label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        total,
      }));
  }, [feePayments]);

  const feeTotalAll = useMemo(
    () => feePayments.reduce((s, p) => s + (p.amount || 0), 0),
    [feePayments],
  );

  // ── Derived: pool revenue ──────────────────────────────────────────────────
  const poolRevenue = useMemo(() => {
    let school = 0, pub = 0;
    poolSessions.forEach(s => {
      if (s.mode === 1) school += s.totalrevenue || 0;
      else if (s.mode === 2) pub += s.totalrevenue || 0;
    });
    return { school, pub, total: school + pub, sessions: poolSessions.length };
  }, [poolSessions]);

  // ── Derived: transport fleet ───────────────────────────────────────────────
  const fleetStatus = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    vehicles.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return counts;
  }, [vehicles]);

  // ── Derived: activities by category ───────────────────────────────────────
  const activitiesByCat = useMemo(() => {
    const map: Record<number, number> = {};
    activities.forEach(a => { map[a.category] = (map[a.category] || 0) + 1; });
    return Object.entries(map)
      .map(([k, v]) => ({ name: ACT_CATS[Number(k)] || 'Other', count: v }))
      .sort((a, b) => b.count - a.count);
  }, [activities]);

  const activeActivities = useMemo(
    () => activities.filter(a => a.status === 1).length,
    [activities],
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  const totalStudents = stats?.totalStudents ?? students.length;

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            School-wide analytics and performance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Trend range selector */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {TREND_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setDays(o.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === o.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Students"
          value={totalStudents}
          sub={`${genderBreakdown.male}M · ${genderBreakdown.female}F`}
          icon={Users}
          iconBg="bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400" />
        <KpiCard label="Active Students"
          value={stats?.activeUsers ?? statusBreakdown.find(s => s.status === 1)?.count ?? 0}
          sub="Currently enrolled"
          icon={UserCheck}
          iconBg="bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" />
        <KpiCard label="Teaching Staff"
          value={stats?.totalTeachers ?? 0}
          sub="Active teachers"
          icon={GraduationCap}
          iconBg="bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400" />
        <KpiCard label="Classes"
          value={stats?.totalClasses ?? classes.length}
          sub={`${classBreakdown.length} with students`}
          icon={BookOpen}
          iconBg="bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400" />
        <KpiCard label="Avg Attendance"
          value={`${avgAttendance.toFixed(1)}%`}
          sub={`Over last ${days} days`}
          icon={TrendingUp}
          iconBg="bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400" />
        <KpiCard label="Total Collected"
          value={formatCurrency(feeTotalAll || stats?.monthlyRevenue || 0)}
          sub="All fee collections"
          icon={DollarSign}
          iconBg="bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400" />
      </div>

      {/* ── Secondary stat chips ────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatChip
          label="Pool Revenue (Total)"
          value={formatCurrency(poolRevenue.total)}
          icon={Waves}
          color="bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300"
        />
        <StatChip
          label="Pool Sessions"
          value={`${poolRevenue.sessions} sessions`}
          icon={Waves}
          color="bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300"
        />
        <StatChip
          label="Active Vehicles"
          value={`${fleetStatus[1] ?? 0} of ${vehicles.length}`}
          icon={Bus}
          color="bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300"
        />
        <StatChip
          label="Active Activities"
          value={`${activeActivities} of ${activities.length}`}
          icon={Trophy}
          color="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300"
        />
      </div>

      {/* ── Attendance trend + Student status ───────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Attendance area chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Daily attendance rate over the last {days} days
            </p>
          </CardHeader>
          <CardContent>
            {trends.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={trends.map(d => ({ ...d, label: formatDate(d.date) }))}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={CT.areaFill} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: CT.tick }}
                    axisLine={false} tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: CT.tick }}
                    axisLine={false} tickLine={false}
                    domain={[0, 100]} unit="%"
                  />
                  <Tooltip
                    contentStyle={ttStyle}
                    labelStyle={{ color: CT.ttLabel, fontWeight: 600, marginBottom: 2 }}
                    formatter={(v: unknown) => [`${(v as number).toFixed(1)}%`, 'Attendance']}
                    labelFormatter={l => l}
                  />
                  <Area
                    type="monotone" dataKey="percentage"
                    stroke="#3b82f6" strokeWidth={2}
                    fill="url(#attGrad)" dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="text-sm">No attendance data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student status breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Student Status</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {totalStudents} students total
            </p>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length ? (
              <div className="space-y-4">
                {statusBreakdown.map(({ status, count, cfg }) => {
                  const pct = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-sm font-medium ${cfg.lightColor} ${cfg.darkColor}`}>
                          {cfg.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {count}{' '}
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                            ({pct.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700/60">
                        <div
                          className={`h-full rounded-full transition-all ${cfg.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Gender split */}
                {genderBreakdown.total > 0 && (
                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide">
                      Gender
                    </p>
                    <div className="flex rounded-full overflow-hidden h-3">
                      <div
                        className="bg-blue-500 transition-all"
                        style={{ width: `${(genderBreakdown.male / genderBreakdown.total) * 100}%` }}
                      />
                      <div className="bg-pink-400 flex-1" />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                        {genderBreakdown.male} Male
                      </span>
                      <span className="flex items-center gap-1">
                        {genderBreakdown.female} Female
                        <span className="h-2 w-2 rounded-full bg-pink-400 inline-block" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">
                No student data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Fee Collection by Month ─────────────────────────────────────────── */}
      {feeMonthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection by Month</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Monthly fee payments —{' '}
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {formatCurrency(feeTotalAll)}
              </span>{' '}
              collected across {feePayments.length} payments
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={feeMonthly} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: CT.tick }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CT.tick }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={ttStyle}
                  labelStyle={{ color: CT.ttLabel, fontWeight: 600, marginBottom: 2 }}
                  formatter={(v: unknown) => [formatCurrency(v as number), 'Collected']}
                  cursor={{ fill: CT.cursor }}
                />
                <Bar dataKey="total" fill={FEE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Pool Revenue + Transport Fleet ──────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Pool Revenue */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Swimming Pool Revenue</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {poolRevenue.sessions} sessions ·{' '}
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {formatCurrency(poolRevenue.total)}
              </span>{' '}
              total revenue
            </p>
          </CardHeader>
          <CardContent>
            {poolRevenue.sessions > 0 ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: 'School Sessions',
                      value: poolRevenue.school,
                      textColor: 'text-blue-600 dark:text-blue-400',
                      bg: 'bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20',
                    },
                    {
                      label: 'Public Sessions',
                      value: poolRevenue.pub,
                      textColor: 'text-cyan-600 dark:text-cyan-400',
                      bg: 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20',
                    },
                  ].map(({ label, value, textColor, bg }) => (
                    <div key={label} className={`rounded-xl p-4 text-center ${bg}`}>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {label}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${textColor}`}>
                        {formatCurrency(value)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {poolRevenue.total > 0
                          ? `${((value / poolRevenue.total) * 100).toFixed(0)}% of total`
                          : '—'}
                      </p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide">
                    Revenue Split
                  </p>
                  {poolRevenue.total > 0 && (
                    <>
                      <div className="flex rounded-full overflow-hidden h-4">
                        <div
                          className="bg-blue-500 transition-all"
                          style={{ width: `${(poolRevenue.school / poolRevenue.total) * 100}%` }}
                        />
                        <div className="bg-cyan-400 flex-1" />
                      </div>
                      <div className="flex justify-between mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> School
                        </span>
                        <span className="flex items-center gap-1.5">
                          Public <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block" />
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">
                No pool data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transport Fleet Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transport Fleet</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {vehicles.length} vehicles registered
            </p>
          </CardHeader>
          <CardContent>
            {vehicles.length > 0 ? (
              <div className="space-y-4">
                {[
                  { label: 'Active',      key: 1, lightColor: 'text-emerald-600', darkColor: 'dark:text-emerald-400', bar: 'bg-emerald-500', icon: Bus    },
                  { label: 'Maintenance', key: 2, lightColor: 'text-amber-600',   darkColor: 'dark:text-amber-400',   bar: 'bg-amber-500',   icon: Wrench },
                  { label: 'Retired',     key: 3, lightColor: 'text-slate-500',   darkColor: 'dark:text-slate-400',   bar: 'bg-slate-400',   icon: Bus    },
                ].map(({ label, key, lightColor, darkColor, bar }) => {
                  const count = fleetStatus[key] ?? 0;
                  const pct   = vehicles.length > 0 ? (count / vehicles.length) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-sm font-medium ${lightColor} ${darkColor}`}>
                          {label}
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {count}{' '}
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                            ({pct.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700/60">
                        <div
                          className={`h-full rounded-full transition-all ${bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Fleet utilisation:{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {vehicles.length > 0
                        ? `${(((fleetStatus[1] ?? 0) / vehicles.length) * 100).toFixed(0)}%`
                        : '—'}
                    </span>{' '}
                    active
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">
                No vehicle data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Activities by Category ──────────────────────────────────────────── */}
      {activitiesByCat.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activities by Category</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {activities.length} total activities · {activeActivities} active
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={activitiesByCat} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: CT.tick }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: CT.tick }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={ttStyle}
                  labelStyle={{ color: CT.ttLabel, fontWeight: 600, marginBottom: 2 }}
                  formatter={(v: unknown) => [v as React.ReactNode, 'Activities']}
                  cursor={{ fill: CT.cursor }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {activitiesByCat.map((_, i) => (
                    <Cell key={i} fill={ACT_COLORS[i % ACT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Enrollment by Class ─────────────────────────────────────────────── */}
      {classBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollment by Class</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Number of students per class
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={classBreakdown} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: CT.tick }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: CT.tick }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={ttStyle}
                  labelStyle={{ color: CT.ttLabel, fontWeight: 600, marginBottom: 2 }}
                  formatter={(v: unknown) => [v as React.ReactNode, 'Students']}
                  cursor={{ fill: CT.cursor }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {classBreakdown.map((_, i) => (
                    <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Daily Attendance Log ─────────────────────────────────────────────── */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <CardTitle>Daily Attendance Log</CardTitle>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Most recent 14 days</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                    {['Date', 'Present', 'Total', 'Absent', 'Rate'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {[...trends].reverse().slice(0, 14).map(t => {
                    const absent = t.total - t.present;
                    const pct    = t.percentage;
                    return (
                      <tr
                        key={t.date}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                          {new Date(t.date).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          {t.present}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{t.total}</td>
                        <td className="px-4 py-2.5 text-red-500 dark:text-red-400">{absent}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-1.5 w-24 rounded-full bg-slate-100 dark:bg-slate-700/60 flex-shrink-0">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 90 ? 'bg-emerald-500'
                                  : pct >= 75 ? 'bg-amber-500'
                                  : 'bg-red-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-semibold tabular-nums ${
                                pct >= 90 ? 'text-emerald-600 dark:text-emerald-400'
                                : pct >= 75 ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-500 dark:text-red-400'
                              }`}
                            >
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
