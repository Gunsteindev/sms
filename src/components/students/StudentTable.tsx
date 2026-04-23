'use client';

import { Users, Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Student } from '@/lib/dataverse/students';

const STATUS: Record<number, { label: string; variant: 'success' | 'info' | 'warning' | 'error' | 'default' }> = {
  1: { label: 'Active',      variant: 'success' },
  2: { label: 'Graduated',   variant: 'info' },
  3: { label: 'Transferred', variant: 'warning' },
  4: { label: 'Suspended',   variant: 'error' },
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

interface Props {
  students: Student[];
  loading: boolean;
  onView?:   (id: string) => void;
  onEdit?:   (student: Student) => void;
  onDelete?: (id: string) => void;
}

export function StudentTable({ students, loading, onView, onEdit, onDelete }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600" />
        </div>
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center justify-center py-24">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
          <Users className="h-7 w-7 text-slate-400 dark:text-slate-500 opacity-50" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No students found</p>
        <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">Add a student to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            {['Student', 'Roll No.', 'Class', 'Email', 'Phone', 'Status', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {students.map((s) => {
            const status = STATUS[s.studentstatus] ?? { label: 'Unknown', variant: 'default' as const };
            const initials = `${s.firstname?.[0] ?? ''}${s.lastname?.[0] ?? ''}`.toUpperCase();
            const ac = avatarColor(`${s.firstname}${s.lastname}`);
            return (
              <tr key={s.studentid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${ac}`}>
                      {initials}
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{s.firstname} {s.lastname}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">
                    {s.rollnumber || '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{s.classname || '—'}</td>
                <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">{s.email || '—'}</td>
                <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{s.phone || '—'}</td>
                <td className="px-4 py-3.5">
                  <Badge variant={(STATUS[s.studentstatus] ?? STATUS[1]).variant}>{(STATUS[s.studentstatus] ?? { label: 'Unknown' }).label}</Badge>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => onView?.(s.studentid)} title="View"
                      className="h-8 w-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(s)} title="Edit"
                      className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete?.(s.studentid)} title="Delete"
                      className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
