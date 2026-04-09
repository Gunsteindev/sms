'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Attendance, CreateAttendanceRequest } from '@/lib/dataverse/attendance';

const STATUSES = [
  { value: 0, label: 'Present', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 1, label: 'Absent',  icon: XCircle,      color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 2, label: 'Late',    icon: Clock,         color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 3, label: 'Excused', icon: AlertCircle,  color: 'text-blue-600 bg-blue-50 border-blue-200' },
];

interface Props {
  records: Attendance[];
  date: string;
  onSave: (records: CreateAttendanceRequest[]) => Promise<void>;
}

export function AttendanceSheet({ records, date, onSave }: Props) {
  const [statusMap, setStatusMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(records.map((r) => [r.studentid, r.status]))
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updated: CreateAttendanceRequest[] = records.map((r) => ({
      studentid: r.studentid,
      date,
      status: statusMap[r.studentid] ?? r.status,
      classname: r.classname,
    }));
    await onSave(updated);
    setSaving(false);
  };

  if (!records.length) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No attendance records for this date / class.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex gap-4 rounded-lg bg-gray-50 p-3 text-xs font-medium">
        {STATUSES.map((s) => {
          const count = Object.values(statusMap).filter((v) => v === s.value).length;
          const Icon = s.icon;
          return (
            <div key={s.value} className="flex items-center gap-1.5">
              <Icon className={`h-3.5 w-3.5 ${s.color.split(' ')[0]}`} />
              <span className="text-gray-600">{s.label}: <strong>{count}</strong></span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
              {STATUSES.map((s) => (
                <th key={s.value} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r) => {
              const current = statusMap[r.studentid] ?? r.status;
              return (
                <tr key={r.attendanceid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 flex-shrink-0">
                        {(r.studentname ?? 'S').charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{r.studentname ?? r.studentid}</span>
                    </div>
                  </td>
                  {STATUSES.map((s) => (
                    <td key={s.value} className="px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setStatusMap((prev) => ({ ...prev, [r.studentid]: s.value }))}
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                          current === s.value ? s.color : 'border-gray-200 text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <s.icon className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? 'Saving…' : 'Save Attendance'}
        </Button>
      </div>
    </div>
  );
}
