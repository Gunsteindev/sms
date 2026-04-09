'use client';

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { AttendanceSheet } from '@/components/attendance/AttendanceSheet';
import { useAttendance } from '@/hooks/useAttendance';
import { attendanceAPI } from '@/lib/api-client';
import type { CreateAttendanceRequest } from '@/lib/dataverse/attendance';

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [className, setClassName]       = useState('');
  const [trends, setTrends]             = useState<{ date: string; percentage: number }[]>([]);

  const { records, summary, loading, refetch } = useAttendance(selectedDate, className || undefined);

  useEffect(() => {
    attendanceAPI.getTrends(60)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => setTrends(res.data ?? []))
      .catch(() => {});
  }, []);

  const handleSave = async (updated: CreateAttendanceRequest[]) => {
    try {
      await attendanceAPI.markBulk(updated);
      toast.success(`Saved ${updated.length} attendance records`);
      refetch();
    } catch {
      toast.error('Failed to save attendance');
    }
  };

  const summaryCards = [
    { label: 'Present',  value: summary?.present ?? 0,  icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Absent',   value: summary?.absent  ?? 0,  icon: XCircle,      color: 'text-red-600 bg-red-50' },
    { label: 'Late',     value: summary?.late    ?? 0,  icon: Clock,         color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Excused',  value: summary?.excused ?? 0,  icon: AlertCircle,  color: 'text-blue-600 bg-blue-50' },
    { label: 'Total',    value: summary?.totalStudents ?? 0, icon: Users,   color: 'text-gray-600 bg-gray-100' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Input
            placeholder="Filter by class…"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rate highlight */}
      {summary && summary.totalStudents > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-200">Attendance Rate</p>
            <p className="text-3xl font-bold mt-0.5">{summary.percentage.toFixed(1)}%</p>
          </div>
          <Calendar className="h-12 w-12 text-blue-300 opacity-60" />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Calendar */}
        <AttendanceCalendar
          stats={trends}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Sheet */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <AttendanceSheet records={records} date={selectedDate} onSave={handleSave} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
