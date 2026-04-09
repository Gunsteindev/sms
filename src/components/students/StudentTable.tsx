'use client';

import { Users, Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Student } from '@/lib/dataverse/students';

const STATUS: Record<number, { label: string; variant: 'success' | 'info' | 'warning' | 'error' }> = {
  1: { label: 'Active',      variant: 'success' },
  2: { label: 'Graduated',   variant: 'info' },
  3: { label: 'Transferred', variant: 'warning' },
  4: { label: 'Suspended',   variant: 'error' },
};

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
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <Users className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No students found</p>
        <p className="text-xs mt-1">Add a student to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            {['Student', 'Roll No.', 'Class', 'Email', 'Phone', 'Status', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {students.map((s) => {
            const status = STATUS[s.statuscode] ?? { label: 'Unknown', variant: 'default' as const };
            return (
              <tr key={s.studentid} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 flex-shrink-0">
                      {s.firstname[0]}{s.lastname[0]}
                    </div>
                    <span className="font-medium text-gray-900">{s.firstname} {s.lastname}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.rollnumber || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{s.classname  || '—'}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{s.emailaddress1}</td>
                <td className="px-4 py-3 text-gray-500">{s.telephone1 || '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onView?.(s.studentid)} title="View">
                      <Eye className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(s)} title="Edit">
                      <Pencil className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete?.(s.studentid)} title="Delete">
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
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
