'use client';

import { Users, Eye, Pencil, Trash2, UserPlus, ChevronDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { STUDENT_STATUS_LABEL, STUDENT_STATUS_VARIANT } from '@/lib/constants';
import type { Student } from '@/lib/dataverse/students';

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
  onView?:           (id: string) => void;
  onEdit?:           (student: Student) => void;
  onDelete?:         (id: string) => void;
  onAssignParent?:   (student: Student) => void;
  onUpdateStatus?:   (student: Student) => void;
  page?:             number;
  totalPages?:       number;
  total?:            number;
  pageSize?:         number;
  onPageChange?:     (page: number) => void;
}

export function StudentTable({ students, loading, onView, onEdit, onDelete, onAssignParent, onUpdateStatus, page, totalPages, total, pageSize, onPageChange }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600">
        <Users className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No students found</p>
        <p className="text-xs mt-1">Add a student to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              {['Student', 'Roll No.', 'Class', 'Parent / Guardian', 'Status', ''].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
            const sc       = s.studentstatus ?? 1;
            const status   = {
              label:   STUDENT_STATUS_LABEL[sc]   ?? 'Unknown',
              variant: STUDENT_STATUS_VARIANT[sc] ?? ('default' as const),
            };
            const initials = `${s.firstname?.[0] ?? ''}${s.lastname?.[0] ?? ''}`.toUpperCase();
            const ac       = avatarColor(`${s.firstname}${s.lastname}`);
            const parent   = s.parentname || s.guardianname || '';

            return (
              <TableRow key={s.studentid}>

                {/* Student */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {s.profilepicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.profilepicture}
                        alt={`${s.firstname} ${s.lastname}`}
                        className="h-9 w-9 flex-shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ac}`}>
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{s.firstname} {s.lastname}</p>
                      {s.email && <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[160px]">{s.email}</p>}
                    </div>
                  </div>
                </TableCell>

                {/* Roll No. */}
                <TableCell>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">
                    {s.rollnumber || '—'}
                  </span>
                </TableCell>

                {/* Class */}
                <TableCell className="text-slate-600 dark:text-slate-300">{s.classname || '—'}</TableCell>

                {/* Parent / Guardian */}
                <TableCell>
                  {parent ? (
                    <button
                      type="button"
                      onClick={() => onAssignParent?.(s)}
                      className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/parent"
                    >
                      <span className="truncate max-w-[140px]">{parent}</span>
                      <Pencil className="h-3 w-3 opacity-0 group-hover/parent:opacity-60 flex-shrink-0" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAssignParent?.(s)}
                      className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Assign</span>
                    </button>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus?.(s)}
                    className="flex items-center gap-1 group/status"
                    title="Update status"
                  >
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <ChevronDown className="h-3 w-3 text-slate-400 opacity-0 group-hover/status:opacity-100 transition-opacity" />
                  </button>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onView?.(s.studentid)} title="View">
                      <Eye className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(s)} title="Edit">
                      <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete?.(s.studentid)} title="Delete">
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          </TableBody>
        </Table>
      </div>

      {page !== undefined && totalPages !== undefined && total !== undefined && pageSize !== undefined && onPageChange && (
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} label="student" onChange={onPageChange} />
      )}
    </div>
  );
}
