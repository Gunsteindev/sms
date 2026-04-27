'use client';

import { Mail, Phone, MapPin, User, Calendar, GraduationCap, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Student } from '@/lib/dataverse/students';

const STUDENT_STATUS: Record<number, { label: string; variant: 'success' | 'info' | 'warning' | 'error' }> = {
  1: { label: 'Active',      variant: 'success' },
  2: { label: 'Graduated',   variant: 'info' },
  3: { label: 'Transferred', variant: 'warning' },
  4: { label: 'Suspended',   variant: 'error' },
};

const ENROLLMENT_STATUS: Record<number, string> = {
  1: 'Enrolled',
  2: 'Completed',
  3: 'Dropped',
  4: 'On Hold',
};

const GENDER: Record<number, string> = { 1: 'Male', 2: 'Female' };

function formatDate(d: Date | string | undefined) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-900/30 flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

export function StudentCard({ student }: { student: Student }) {
  const status     = STUDENT_STATUS[student.studentstatus    || 1] ?? { label: 'Unknown', variant: 'default' as const };
  const enrStatus  = ENROLLMENT_STATUS[student.enrollmentstatus || 1];
  const parentName = student.parentname || student.guardianname;
  const fullName   = `${student.firstname} ${student.lastname}`.trim();
  const initials   = `${student.firstname?.[0] ?? ''}${student.lastname?.[0] ?? ''}`.toUpperCase();

  // Avatar gradient per student (stable hash)
  const gradients = [
    'from-blue-500 to-blue-700',
    'from-violet-500 to-violet-700',
    'from-emerald-500 to-emerald-700',
    'from-rose-500 to-rose-700',
    'from-amber-500 to-orange-600',
  ];
  let h = 0;
  for (let i = 0; i < fullName.length; i++) h = (h * 31 + fullName.charCodeAt(i)) & 0xff;
  const gradient = gradients[h % gradients.length];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`bg-gradient-to-br ${gradient} px-6 py-8 text-white text-center`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
          {initials}
        </div>
        <h2 className="mt-3 text-xl font-bold">{fullName}</h2>
        {student.rollnumber && (
          <p className="text-sm text-white/70 mt-1">Roll No. {student.rollnumber}</p>
        )}
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          <Badge variant={status.variant} className="border-none bg-white/20 text-white">
            {status.label}
          </Badge>
          {enrStatus && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/90">
              {enrStatus}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-5 py-3">
        <Row icon={GraduationCap} label="Class"         value={student.classname || '—'} />
        <Row icon={User}          label="Gender"        value={GENDER[student.gender] ?? '—'} />
        <Row icon={Calendar}      label="Date of Birth" value={formatDate(student.dateofbirth)} />
        <Row icon={Calendar}      label="Enrolled"      value={formatDate(student.enrollmentdate)} />
        {parentName && (
          <Row icon={Users}       label="Parent / Guardian" value={parentName} />
        )}
        {student.email && (
          <Row icon={Mail}        label="Email"         value={student.email} />
        )}
        {student.phone && (
          <Row icon={Phone}       label="Phone"         value={student.phone} />
        )}
        {student.address && (
          <Row icon={MapPin}      label="Address"       value={student.address} />
        )}
      </div>
    </div>
  );
}
