'use client';

import { Mail, Phone, MapPin, User, Calendar, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Student } from '@/lib/dataverse/students';

const STATUS: Record<number, { label: string; variant: 'success' | 'info' | 'warning' | 'error' }> = {
  1: { label: 'Active',      variant: 'success' },
  2: { label: 'Graduated',   variant: 'info' },
  3: { label: 'Transferred', variant: 'warning' },
  4: { label: 'Suspended',   variant: 'error' },
};

function formatDate(d: Date | string | undefined) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-blue-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function StudentCard({ student }: { student: Student }) {
  const status = STATUS[student.statuscode] ?? { label: 'Unknown', variant: 'default' as const };
  const fullName = `${student.firstname} ${student.lastname}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
          {student.firstname[0]}{student.lastname[0]}
        </div>
        <h2 className="mt-3 text-xl font-bold">{fullName}</h2>
        {student.rollnumber && <p className="text-sm text-blue-200 mt-1">Roll No: {student.rollnumber}</p>}
        <div className="mt-3 flex justify-center">
          <Badge variant={status.variant} className="border-none bg-white/20 text-white">
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 py-3">
        <Row icon={GraduationCap} label="Class"           value={student.classname || '—'} />
        <Row icon={Mail}          label="Email"           value={student.emailaddress1} />
        <Row icon={Phone}         label="Phone"           value={student.telephone1 || '—'} />
        <Row icon={Calendar}      label="Date of Birth"   value={formatDate(student.dateofbirth)} />
        <Row icon={Calendar}      label="Enrolled"        value={formatDate(student.enrollmentdate)} />
        <Row icon={MapPin}        label="City"            value={student.address1_city || '—'} />
        <Row icon={User}          label="Guardian"        value={student.parentname || '—'} />
        <Row icon={Phone}         label="Guardian Phone"  value={student.parentphone || '—'} />
      </div>
    </div>
  );
}
