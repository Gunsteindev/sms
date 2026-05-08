'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, AlertCircle, Plus, Trash2, Star,
  Search, UserPlus, CalendarDays, ShieldCheck, Users,
  HeartPulse, AlertTriangle, Check, X, Loader2, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';
import { StudentCard } from '@/components/students/StudentCard';
import { StudentForm } from '@/components/students/StudentForm';
import { studentsAPI, attendanceAPI, parentsAPI, studentParentsAPI, disciplinaryAPI, medicalAPI } from '@/lib/api-client';
import type { Student } from '@/lib/dataverse/students';
import type { Parent } from '@/lib/dataverse/parents';
import type { StudentParent } from '@/lib/dataverse/studentparents';
import { PARENT_RELATIONSHIPS } from '@/lib/dataverse/parents';

/* ── Schemas ──────────────────────────────────────────────────────────────── */

const parentSchema = z.object({
  firstname:    z.string().min(1, 'Required'),
  lastname:     z.string().min(1, 'Required'),
  email:        z.string().email('Invalid email').optional().or(z.literal('')),
  phone:        z.string().optional(),
  relationship: z.number().default(3),
  occupation:   z.string().optional(),
  address:      z.string().optional(),
});
type ParentFormData = z.infer<typeof parentSchema>;

/* ── Constants ────────────────────────────────────────────────────────────── */

const STUDENT_STATUSES = [
  { value: 1, label: 'Active',      variant: 'success' as const },
  { value: 2, label: 'Graduated',   variant: 'info'    as const },
  { value: 3, label: 'Transferred', variant: 'warning' as const },
  { value: 4, label: 'Suspended',   variant: 'error'   as const },
];

const ENROLLMENT_STATUSES = [
  { value: 1, label: 'Enrolled',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 2, label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 3, label: 'Dropped',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 4, label: 'On Hold',   color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
];

const INCIDENT_TYPES = [
  { value: 1, label: 'Warning',    color: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700' },
  { value: 2, label: 'Detention',  color: 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700' },
  { value: 3, label: 'Suspension', color: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'                 },
  { value: 4, label: 'Expulsion',  color: 'border-rose-400 bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700'           },
];

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];


function formatDate(d: string | undefined) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

function incidentBadgeClass(type: number) {
  return INCIDENT_TYPES.find(t => t.value === type)?.color ??
    'border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
}

/* ── Small helpers ────────────────────────────────────────────────────────── */

function F({ id, label, error, children }: { id?: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {id ? <Label htmlFor={id}>{label}</Label> : <Label>{label}</Label>}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

/* ── Parent Form ──────────────────────────────────────────────────────────── */

function ParentForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<ParentFormData>;
  onSubmit: (d: ParentFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<ParentFormData>({
    resolver: zodResolver(parentSchema) as never,
    defaultValues: { relationship: 3, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Relationship */}
      <F label="Relationship">
        <Controller name="relationship" control={control} render={({ field }) => (
          <SelectRoot
            value={String(field.value ?? 3)}
            onValueChange={v => field.onChange(Number(v))}
          >
            <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
              <SelectValue>
                {PARENT_RELATIONSHIPS[field.value] ?? 'Guardian'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PARENT_RELATIONSHIPS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        )} />
      </F>

      <SectionDivider label="Personal Details" />

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <F id="firstname" label="First Name *" error={errors.firstname?.message}>
          <Input id="firstname" {...register('firstname')} placeholder="e.g. Jane" />
        </F>
        <F id="lastname" label="Last Name *" error={errors.lastname?.message}>
          <Input id="lastname" {...register('lastname')} placeholder="e.g. Doe" />
        </F>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <F id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" {...register('email')} placeholder="parent@email.com" />
        </F>
        <F id="phone" label="Phone">
          <Input id="phone" type="tel" {...register('phone')} placeholder="+233 20 000 0000" />
        </F>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <F id="occupation" label="Occupation">
          <Input id="occupation" {...register('occupation')} placeholder="e.g. Nurse, Trader…" />
        </F>
        <F id="address" label="Address">
          <Input id="address" {...register('address')} placeholder="Residential address" />
        </F>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          {isSubmitting ? 'Saving…' : 'Save Parent'}
        </Button>
      </div>
    </form>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

interface AttendanceSummary { total: number; present: number; absent: number; late: number; percentage: number; }

const EMPTY_DISC = { date: new Date().toISOString().slice(0, 10), incidenttype: 1, description: '', action: '', parentnotified: false, resolved: false };

export default function StudentDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [student,          setStudent]          = useState<Student | null>(null);
  const [attendance,       setAttendance]       = useState<AttendanceSummary | null>(null);
  const [linkedParents,    setLinkedParents]    = useState<StudentParent[]>([]);
  const [disciplinaryRecs, setDisciplinaryRecs] = useState<AnyRecord[]>([]);
  const [medicalRecord,    setMedicalRecord]    = useState<AnyRecord | null>(null);
  const [loading,          setLoading]          = useState(true);

  // Disciplinary modal
  const [discOpen,      setDiscOpen]      = useState(false);
  const [discSaving,    setDiscSaving]    = useState(false);
  const [editingDisc,   setEditingDisc]   = useState<AnyRecord | null>(null);
  const [discForm,      setDiscForm]      = useState<AnyRecord>(EMPTY_DISC);

  // Medical modal
  const [medOpen,   setMedOpen]   = useState(false);
  const [medSaving, setMedSaving] = useState(false);
  const [medForm,   setMedForm]   = useState<AnyRecord>({});

  // Other modals
  const [editOpen,       setEditOpen]       = useState(false);
  const [addParentOpen,  setAddParentOpen]  = useState(false);
  const [linkOpen,       setLinkOpen]       = useState(false);
  const [editingParent,  setEditingParent]  = useState<Parent | null>(null);
  const [unlinkTarget,   setUnlinkTarget]   = useState<string | null>(null);
  const [statusOpen,     setStatusOpen]     = useState(false);
  const [deleteDiscId,   setDeleteDiscId]   = useState<string | null>(null);

  // Parent search
  const [parentSearch,  setParentSearch]  = useState('');
  const [parentResults, setParentResults] = useState<Parent[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Status
  const [draftStudentStatus,    setDraftStudentStatus]    = useState(1);
  const [draftEnrollmentStatus, setDraftEnrollmentStatus] = useState(1);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const end   = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [stuRes, attRes, parRes, discRes, medRes]: any[] = await Promise.allSettled([
        studentsAPI.getById(id),
        attendanceAPI.getStudentReport(id, start, end),
        studentParentsAPI.getByStudent(id),
        disciplinaryAPI.getAll({ studentid: id }),
        medicalAPI.getByStudent(id),
      ]);
      if (stuRes.status === 'rejected') throw stuRes.reason;
      const stu: Student = stuRes.value?.data ?? null;
      setStudent(stu);
      setAttendance(attRes.status === 'fulfilled' ? (attRes.value?.data?.summary ?? null) : null);
      setLinkedParents(parRes.status === 'fulfilled' ? (parRes.value?.data ?? []) : []);
      setDisciplinaryRecs(discRes.status === 'fulfilled' ? (discRes.value?.data ?? []) : []);
      const med = medRes.status === 'fulfilled' ? (medRes.value?.data ?? null) : null;
      setMedicalRecord(med);
      setMedForm(med ? {
        bloodtype: med.bloodtype, allergies: med.allergies,
        chronicconditions: med.chronicconditions, currentmedications: med.currentmedications,
        vaccinationrecords: med.vaccinationrecords, lastcheckupdate: med.lastcheckupdate,
        emergencycontact: med.emergencycontact, emergencyphone: med.emergencyphone,
      } : {});
      if (stu) { setDraftStudentStatus(stu.studentstatus || 1); setDraftEnrollmentStatus(stu.enrollmentstatus || 1); }
    } catch {
      toast.error('Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStudentEdit = async (data: any) => {
    try { await studentsAPI.update(id, data); toast.success('Student updated'); setEditOpen(false); load(); }
    catch { toast.error('Failed to update student'); }
  };

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try { await studentsAPI.update(id, { studentstatus: draftStudentStatus, enrollmentstatus: draftEnrollmentStatus }); toast.success('Status updated'); setStatusOpen(false); load(); }
    catch { toast.error('Failed to update status'); }
    finally { setSavingStatus(false); }
  };

  const handleAddParent = async (data: ParentFormData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await parentsAPI.create(data);
      const newParentId = res.data?.sms_parentid ?? res.data?.parentid;
      if (newParentId) await studentParentsAPI.link({ studentid: id, parentid: newParentId, isprimary: linkedParents.length === 0 });
      toast.success('Parent added and linked'); setAddParentOpen(false); load();
    } catch { toast.error('Failed to add parent'); }
  };

  const handleEditParent = async (data: ParentFormData) => {
    if (!editingParent) return;
    try { await parentsAPI.update(editingParent.parentid, data); toast.success('Parent updated'); setEditingParent(null); load(); }
    catch { toast.error('Failed to update parent'); }
  };

  const searchParents = async (q: string) => {
    if (!q.trim()) { setParentResults([]); return; }
    setSearchLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await parentsAPI.getAll(q);
      setParentResults(res.data ?? []);
    } catch { setParentResults([]); }
    finally { setSearchLoading(false); }
  };

  const handleLinkExisting = async (parentid: string) => {
    try { await studentParentsAPI.link({ studentid: id, parentid, isprimary: linkedParents.length === 0 }); toast.success('Parent linked'); setLinkOpen(false); setParentSearch(''); setParentResults([]); load(); }
    catch { toast.error('Failed to link parent'); }
  };

  const togglePrimary = async (link: StudentParent) => {
    try { await studentParentsAPI.update(link.studentparentid, { isprimary: !link.isprimary }); toast.success(link.isprimary ? 'Removed primary' : 'Set as primary'); load(); }
    catch { toast.error('Failed to update'); }
  };

  const handleUnlink = async (linkId: string) => {
    try { await studentParentsAPI.unlink(linkId); toast.success('Parent unlinked'); load(); }
    catch { toast.error('Failed to unlink'); }
  };

  const openAddDisc = () => { setEditingDisc(null); setDiscForm(EMPTY_DISC); setDiscOpen(true); };
  const openEditDisc = (rec: AnyRecord) => {
    setEditingDisc(rec);
    setDiscForm({ date: rec.date ?? new Date().toISOString().slice(0, 10), incidenttype: rec.incidenttype ?? 1, description: rec.description ?? '', action: rec.action ?? '', parentnotified: rec.parentnotified ?? false, resolved: rec.resolved ?? false });
    setDiscOpen(true);
  };

  const handleDiscSave = async () => {
    if (!discForm.description.trim()) { toast.error('Description is required'); return; }
    setDiscSaving(true);
    try {
      if (editingDisc) {
        await disciplinaryAPI.update(editingDisc.disciplinaryid, discForm);
        toast.success('Record updated');
      } else {
        await disciplinaryAPI.create({ ...discForm, studentid: id });
        toast.success('Record added');
      }
      setDiscOpen(false); load();
    } catch { toast.error('Failed to save record'); }
    finally { setDiscSaving(false); }
  };

  const handleDiscResolve = async (rec: AnyRecord) => {
    try { await disciplinaryAPI.update(rec.disciplinaryid, { resolved: !rec.resolved }); toast.success(rec.resolved ? 'Marked unresolved' : 'Marked resolved'); load(); }
    catch { toast.error('Failed to update'); }
  };

  const handleMedSave = async () => {
    setMedSaving(true);
    try {
      if (medicalRecord?.medicalid) { await medicalAPI.update(medicalRecord.medicalid, medForm); }
      else { await medicalAPI.create({ ...medForm, studentid: id }); }
      toast.success('Medical record saved'); setMedOpen(false); load();
    } catch { toast.error('Failed to save'); }
    finally { setMedSaving(false); }
  };

  /* ── Guards ───────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600" />
      </div>
    );
  }
  if (!student) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 text-slate-400">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="text-sm">Student not found</p>
        <button onClick={() => router.push('/students')} className="text-xs text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const attRate          = attendance?.percentage ?? 0;
  const studentStatusCfg = STUDENT_STATUSES.find(s => s.value === (student.studentstatus    || 1)) ?? STUDENT_STATUSES[0];
  const enrollmentCfg    = ENROLLMENT_STATUSES.find(s => s.value === (student.enrollmentstatus || 1)) ?? ENROLLMENT_STATUSES[0];

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/students')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Students
        </button>
        <Button onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4 mr-1.5" /> Edit Student
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">

        {/* ── Profile sidebar ── */}
        <StudentCard student={student} />

        {/* ── Right column ── */}
        <div className="space-y-5">

          {/* Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  <CardTitle>Status</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setDraftStudentStatus(student.studentstatus || 1); setDraftEnrollmentStatus(student.enrollmentstatus || 1); setStatusOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Update
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Student Status</p>
                  <Badge variant={studentStatusCfg.variant}>{studentStatusCfg.label}</Badge>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Enrollment Status</p>
                  {enrollmentCfg ? (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${enrollmentCfg.color}`}>{enrollmentCfg.label}</span>
                  ) : <span className="text-sm text-slate-400">—</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <CardTitle>Attendance — last 90 days</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!attendance || attendance.total === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                  <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No attendance records found</p>
                  <p className="text-xs mt-1">Records will appear once attendance is marked</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Present', value: attendance.present, color: 'text-green-600 dark:text-green-400'  },
                      { label: 'Absent',  value: attendance.absent,  color: 'text-red-500 dark:text-red-400'     },
                      { label: 'Late',    value: attendance.late,    color: 'text-amber-600 dark:text-amber-400' },
                      { label: 'Total',   value: attendance.total,   color: 'text-slate-700 dark:text-slate-300' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Attendance rate</span>
                      <span className={`font-semibold ${attRate >= 90 ? 'text-green-600' : attRate >= 75 ? 'text-amber-600' : 'text-red-500'}`}>{attRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                      <div className={`h-full rounded-full transition-all ${attRate >= 90 ? 'bg-green-500' : attRate >= 75 ? 'bg-amber-500' : 'bg-red-400'}`}
                        style={{ width: `${attRate}%` }} />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Parents / Guardians ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <CardTitle>Parents / Guardians</CardTitle>
                  {linkedParents.length > 0 && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {linkedParents.length}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setLinkOpen(true); setParentSearch(''); setParentResults([]); }}>
                    <Search className="h-3.5 w-3.5 mr-1.5" /> Link Existing
                  </Button>
                  <Button size="sm" onClick={() => setAddParentOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add New
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!linkedParents.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                  <UserPlus className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No parents linked yet</p>
                  <p className="text-xs mt-1">Add or link a parent / guardian above</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {linkedParents.map(link => (
                    <div key={link.studentparentid} className="group flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold shadow-sm">
                        {link.parentname?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href="/parents" className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {link.parentname || '—'}
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </Link>
                          <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                            {PARENT_RELATIONSHIPS[link.relationship] ?? 'Guardian'}
                          </span>
                          {link.isprimary && <Badge variant="success" className="text-[10px] px-1.5 py-0">Primary</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 mt-0.5">
                          {link.parentphone && <p className="text-xs text-slate-500">{link.parentphone}</p>}
                          {link.parentemail && <p className="text-xs text-slate-500">{link.parentemail}</p>}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button variant="ghost" size="icon" title={link.isprimary ? 'Remove primary' : 'Set as primary'}
                          onClick={() => togglePrimary(link)}
                          className={`h-7 w-7 ${link.isprimary ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}>
                          <Star className="h-3.5 w-3.5" fill={link.isprimary ? 'currentColor' : 'none'} />
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => setEditingParent({ parentid: link.parentid, firstname: link.parentname?.split(' ')[0] ?? '', lastname: link.parentname?.split(' ').slice(1).join(' ') ?? '', fullname: link.parentname ?? '', email: link.parentemail ?? '', phone: link.parentphone ?? '', relationship: link.relationship, address: '', occupation: '', createdon: '', modifiedon: '' })}
                          className="h-7 w-7 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => setUnlinkTarget(link.studentparentid)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Disciplinary Records ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-400" />
                  <CardTitle>Disciplinary Records</CardTitle>
                  {disciplinaryRecs.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                      {disciplinaryRecs.length}
                    </span>
                  )}
                </div>
                <Button size="sm" onClick={openAddDisc}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Record
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {disciplinaryRecs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                  <AlertTriangle className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No disciplinary records</p>
                  <p className="text-xs mt-1">Records will appear once added</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {disciplinaryRecs.map((rec: AnyRecord) => (
                    <div key={rec.disciplinaryid} className="group py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${incidentBadgeClass(rec.incidenttype)}`}>
                              {INCIDENT_TYPES.find(t => t.value === rec.incidenttype)?.label ?? rec.incidenttypename}
                            </span>
                            <span className="text-xs text-slate-400">{rec.date ? formatDate(rec.date) : '—'}</span>
                            {rec.resolved && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                <Check className="h-3 w-3" /> Resolved
                              </span>
                            )}
                            {rec.parentnotified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                                Parent notified
                              </span>
                            )}
                          </div>
                          {/* Description */}
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{rec.description}</p>
                          {rec.action && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <span className="font-medium">Action:</span> {rec.action}
                            </p>
                          )}
                        </div>
                        {/* Row actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => handleDiscResolve(rec)} title={rec.resolved ? 'Mark unresolved' : 'Mark resolved'}
                            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                              rec.resolved
                                ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}>
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openEditDisc(rec)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteDiscId(rec.disciplinaryid)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Medical Record ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-slate-400" />
                  <CardTitle>Medical Record</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => setMedOpen(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> {medicalRecord ? 'Edit' : 'Add'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!medicalRecord ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                  <HeartPulse className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No medical record yet</p>
                  <p className="text-xs mt-1">Click Add to create one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Vitals row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-1">Blood Type</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">{medicalRecord.bloodtype || '—'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Last Checkup</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{medicalRecord.lastcheckupdate ? formatDate(medicalRecord.lastcheckupdate) : '—'}</p>
                    </div>
                  </div>
                  {/* Conditions */}
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      ['Allergies',           medicalRecord.allergies],
                      ['Chronic Conditions',  medicalRecord.chronicconditions],
                      ['Current Medications', medicalRecord.currentmedications],
                      ['Vaccination Records', medicalRecord.vaccinationrecords],
                    ].map(([label, value]) => value ? (
                      <div key={label} className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</dt>
                        <dd className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{value}</dd>
                      </div>
                    ) : null)}
                  </dl>
                  {/* Emergency contact */}
                  {(medicalRecord.emergencycontact || medicalRecord.emergencyphone) && (
                    <div className="rounded-lg border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-400 mb-2">Emergency Contact</p>
                      <div className="flex items-center gap-4 text-sm">
                        {medicalRecord.emergencycontact && <span className="font-medium text-slate-800 dark:text-slate-200">{medicalRecord.emergencycontact}</span>}
                        {medicalRecord.emergencyphone && <span className="text-slate-600 dark:text-slate-400">{medicalRecord.emergencyphone}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional details */}
          <Card>
            <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {[
                  ['Roll Number',    student.rollnumber   || '—'],
                  ['Special Needs',  student.specialneeds ? 'Yes' : 'No'],
                  ['Guardian Name',  student.guardianname || '—'],
                  ['Guardian Phone', student.guardianphone || '—'],
                  ['Address',        student.address      || '—'],
                  ['Created',        formatDate(student.createdon)],
                  ['Last Updated',   formatDate(student.modifiedon)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-slate-400 dark:text-slate-500">{label}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Edit student ── */}
      <Dialog open={editOpen} onOpenChange={o => { if (!o) setEditOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <StudentForm
            defaultValues={{
              firstname: student.firstname, lastname: student.lastname,
              dateofbirth: student.dateofbirth?.slice(0, 10),
              gender: (({ 1: 'Male', 2: 'Female' } as Record<number, string>)[student.gender]) ?? 'Male',
              email: student.email || undefined, phone: student.phone || undefined, address: student.address || undefined,
              enrollmentdate: student.enrollmentdate?.slice(0, 10), rollnumber: student.rollnumber || undefined,
              classid: student.classid || undefined, parentid: student.parentid || undefined,
              parentname: student.parentname || student.guardianname || undefined,
              studentstatus: (({ 1: 'Active', 2: 'Graduated', 3: 'Transferred', 4: 'Suspended' } as Record<number, string>)[student.studentstatus]) ?? 'Active',
              enrollmentstatus: (({ 1: 'Enrolled', 2: 'Completed', 3: 'Dropped', 4: 'On Hold' } as Record<number, string>)[student.enrollmentstatus]) ?? 'Enrolled',
            }}
            onSubmit={handleStudentEdit} onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Update status ── */}
      <Dialog open={statusOpen} onOpenChange={o => { if (!o) setStatusOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Update Student Status</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {[{ label: 'Student Status', items: STUDENT_STATUSES, value: draftStudentStatus, set: setDraftStudentStatus },
              { label: 'Enrollment Status', items: ENROLLMENT_STATUSES, value: draftEnrollmentStatus, set: setDraftEnrollmentStatus }].map(({ label, items, value, set }) => (
              <div key={label} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((s: { value: number; label: string }) => (
                    <button key={s.value} type="button" onClick={() => set(s.value)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        value === s.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-200 dark:ring-blue-800'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}>
                      {s.label}
                      {value === s.value && <Check className="h-3.5 w-3.5 text-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveStatus} disabled={savingStatus}>
                {savingStatus ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1.5" />}
                {savingStatus ? 'Saving…' : 'Save Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add new parent ── */}
      <Dialog open={addParentOpen} onOpenChange={o => { if (!o) setAddParentOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add New Parent / Guardian</DialogTitle></DialogHeader>
          <ParentForm onSubmit={handleAddParent} onCancel={() => setAddParentOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* ── Edit parent ── */}
      <Dialog open={!!editingParent} onOpenChange={o => { if (!o) setEditingParent(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Parent / Guardian</DialogTitle></DialogHeader>
          {editingParent && (
            <ParentForm
              defaultValues={{ firstname: editingParent.firstname, lastname: editingParent.lastname, email: editingParent.email || undefined, phone: editingParent.phone || undefined, relationship: editingParent.relationship ?? 3, occupation: editingParent.occupation || undefined, address: editingParent.address || undefined }}
              onSubmit={handleEditParent} onCancel={() => setEditingParent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Link existing parent ── */}
      <Dialog open={linkOpen} onOpenChange={o => { if (!o) setLinkOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Link Existing Parent</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Search by name…" value={parentSearch}
                onChange={e => { setParentSearch(e.target.value); searchParents(e.target.value); }} autoFocus />
            </div>
            {searchLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : parentResults.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {parentResults.map(p => (
                  <button key={p.parentid} onClick={() => handleLinkExisting(p.parentid)}
                    className="w-full flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-3 text-left transition-colors">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{p.fullname || `${p.firstname} ${p.lastname}`}</p>
                      <p className="text-xs text-slate-500">{PARENT_RELATIONSHIPS[p.relationship] ?? 'Guardian'}{p.email ? ` · ${p.email}` : ''}</p>
                    </div>
                    <Plus className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : parentSearch ? (
              <p className="text-sm text-slate-400 text-center py-4">No parents found</p>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Type a name to search</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Unlink confirm ── */}
      <ConfirmDialog open={!!unlinkTarget} onOpenChange={o => !o && setUnlinkTarget(null)}
        title="Remove parent?" description="This will unlink the parent from this student. The parent record will not be deleted."
        onConfirm={() => { if (unlinkTarget) { handleUnlink(unlinkTarget); setUnlinkTarget(null); } }} />

      {/* ── Add / Edit Disciplinary Record ── */}
      <Dialog open={discOpen} onOpenChange={o => { if (!o) setDiscOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDisc ? 'Edit Disciplinary Record' : 'Add Disciplinary Record'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">

            {/* Incident type */}
            <F label="Incident Type *">
              <SelectRoot
                value={String(discForm.incidenttype)}
                onValueChange={v => setDiscForm((f: AnyRecord) => ({ ...f, incidenttype: Number(v) }))}
              >
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                  <SelectValue>
                    {INCIDENT_TYPES.find(t => t.value === discForm.incidenttype)?.label ?? 'Select type…'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </F>

            {/* Date */}
            <F label="Date *">
              <DatePicker
                value={discForm.date}
                onChange={v => setDiscForm((f: AnyRecord) => ({ ...f, date: v }))}
                placeholder="Select date…"
                className="h-10"
              />
            </F>

            {/* Description */}
            <F label="Description *">
              <Textarea rows={3} value={discForm.description} onChange={e => setDiscForm((f: AnyRecord) => ({ ...f, description: e.target.value }))} placeholder="Describe the incident in detail…" />
            </F>

            {/* Action */}
            <F label="Action Taken">
              <Textarea rows={2} value={discForm.action} onChange={e => setDiscForm((f: AnyRecord) => ({ ...f, action: e.target.value }))} placeholder="e.g. Referred to principal, parents called…" />
            </F>

            {/* Checkboxes */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={discForm.parentnotified} onChange={e => setDiscForm((f: AnyRecord) => ({ ...f, parentnotified: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Parent / Guardian has been notified</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={discForm.resolved} onChange={e => setDiscForm((f: AnyRecord) => ({ ...f, resolved: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Mark as resolved</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setDiscOpen(false)}>Cancel</Button>
              <Button disabled={discSaving || !discForm.description.trim()} onClick={handleDiscSave}>
                {discSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                {discSaving ? 'Saving…' : editingDisc ? 'Update Record' : 'Save Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete disciplinary confirm ── */}
      <ConfirmDialog open={!!deleteDiscId} onOpenChange={o => !o && setDeleteDiscId(null)}
        title="Delete record?" description="This will permanently delete this disciplinary record."
        onConfirm={async () => {
          if (!deleteDiscId) return;
          try { await disciplinaryAPI.delete(deleteDiscId); toast.success('Record deleted'); load(); }
          catch { toast.error('Failed to delete'); }
          finally { setDeleteDiscId(null); }
        }} />

      {/* ── Add / Edit Medical Record ── */}
      <Dialog open={medOpen} onOpenChange={o => { if (!o) setMedOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{medicalRecord ? 'Edit Medical Record' : 'Add Medical Record'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

            <SectionDivider label="Vitals" />

            {/* Blood type pills */}
            <div className="space-y-1.5">
              <Label>Blood Type</Label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_TYPES.map(bt => {
                  const active = medForm.bloodtype === bt;
                  return (
                    <button key={bt} type="button"
                      onClick={() => setMedForm((f: AnyRecord) => ({ ...f, bloodtype: active ? '' : bt }))}
                      className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-all ${
                        active
                          ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50/50'
                      }`}>
                      {bt}
                    </button>
                  );
                })}
              </div>
            </div>

            <F label="Last Checkup Date">
              <Input type="date" value={medForm.lastcheckupdate ?? ''}
                onChange={e => setMedForm((f: AnyRecord) => ({ ...f, lastcheckupdate: e.target.value }))} />
            </F>

            <SectionDivider label="Conditions & Medications" />

            {([
              ['allergies',          'Allergies',           'e.g. Peanuts, Penicillin, Latex…'],
              ['chronicconditions',  'Chronic Conditions',  'e.g. Asthma, Diabetes, Epilepsy…'],
              ['currentmedications', 'Current Medications', 'e.g. Ventolin 100mcg inhaler…'],
              ['vaccinationrecords', 'Vaccination Records', 'e.g. COVID-19 (2023), Yellow Fever…'],
            ] as const).map(([field, label, ph]) => (
              <F key={field} label={label}>
                <Textarea rows={2} value={medForm[field] ?? ''} placeholder={ph}
                  onChange={e => setMedForm((f: AnyRecord) => ({ ...f, [field]: e.target.value }))} />
              </F>
            ))}

            <SectionDivider label="Emergency Contact" />

            <div className="grid grid-cols-2 gap-3">
              <F label="Contact Name">
                <Input value={medForm.emergencycontact ?? ''} placeholder="e.g. Mary Doe"
                  onChange={e => setMedForm((f: AnyRecord) => ({ ...f, emergencycontact: e.target.value }))} />
              </F>
              <F label="Contact Phone">
                <Input value={medForm.emergencyphone ?? ''} placeholder="+233 20 000 0000"
                  onChange={e => setMedForm((f: AnyRecord) => ({ ...f, emergencyphone: e.target.value }))} />
              </F>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setMedOpen(false)}>Cancel</Button>
              <Button disabled={medSaving} onClick={handleMedSave}>
                {medSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                {medSaving ? 'Saving…' : 'Save Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
