'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, AlertCircle, Plus, Trash2, Star,
  Search, UserPlus, CalendarDays, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StudentCard } from '@/components/students/StudentCard';
import { StudentForm } from '@/components/students/StudentForm';
import { studentsAPI, attendanceAPI, parentsAPI, studentParentsAPI } from '@/lib/api-client';
import type { Student } from '@/lib/dataverse/students';
import type { Parent } from '@/lib/dataverse/parents';
import type { StudentParent } from '@/lib/dataverse/studentparents';
import { PARENT_RELATIONSHIPS } from '@/lib/dataverse/parents';

// ─── Parent form schema ───────────────────────────────────────────────────────
const parentSchema = z.object({
  firstname:      z.string().min(1, 'Required'),
  lastname:       z.string().min(1, 'Required'),
  emailaddress1:  z.string().email('Invalid email').optional().or(z.literal('')),
  telephone1:     z.string().optional(),
  relationship:   z.coerce.number().default(3),
  address1_line1: z.string().optional(),
});
type ParentFormData = z.infer<typeof parentSchema>;

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ParentForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<ParentFormData>;
  onSubmit: (d: ParentFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ParentFormData>({
    resolver: zodResolver(parentSchema) as never,
    defaultValues: { relationship: 3, ...defaultValues },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <F id="firstname" label="First Name *" error={errors.firstname?.message}>
          <Input id="firstname" {...register('firstname')} placeholder="Jane" />
        </F>
        <F id="lastname" label="Last Name *" error={errors.lastname?.message}>
          <Input id="lastname" {...register('lastname')} placeholder="Doe" />
        </F>
      </div>
      <F id="relationship" label="Relationship">
        <select id="relationship" {...register('relationship')}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
          {Object.entries(PARENT_RELATIONSHIPS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </F>
      <div className="grid grid-cols-2 gap-3">
        <F id="emailaddress1" label="Email" error={errors.emailaddress1?.message}>
          <Input id="emailaddress1" type="email" {...register('emailaddress1')} placeholder="parent@email.com" />
        </F>
        <F id="telephone1" label="Phone">
          <Input id="telephone1" type="tel" {...register('telephone1')} placeholder="+1 555 0001" />
        </F>
      </div>
      <F id="address1_line1" label="Address">
        <Input id="address1_line1" {...register('address1_line1')} placeholder="Street address" />
      </F>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Parent'}</Button>
      </div>
    </form>
  );
}

// ─── Enrollment status label ──────────────────────────────────────────────────
const ENROLLMENT_STATUS: Record<number, string> = {
  922330000: 'Active',
  922330001: 'Withdrawn',
  922330002: 'Graduated',
  922330003: 'Suspended',
};

function formatDate(d: string | undefined) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [student, setStudent]             = useState<Student | null>(null);
  const [attendance, setAttendance]       = useState<AttendanceSummary | null>(null);
  const [linkedParents, setLinkedParents] = useState<StudentParent[]>([]);
  const [loading, setLoading]             = useState(true);

  // Modals
  const [editOpen, setEditOpen]           = useState(false);
  const [addParentOpen, setAddParentOpen] = useState(false);
  const [linkOpen, setLinkOpen]           = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [unlinkTarget, setUnlinkTarget]   = useState<string | null>(null);

  // Link-existing-parent search
  const [parentSearch, setParentSearch]   = useState('');
  const [parentResults, setParentResults] = useState<Parent[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const end   = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [stuRes, attRes, parRes]: any[] = await Promise.all([
        studentsAPI.getById(id),
        attendanceAPI.getStudentReport(id, start, end),
        studentParentsAPI.getByStudent(id),
      ]);
      setStudent(stuRes.data ?? null);
      setAttendance(attRes.data?.summary ?? null);
      setLinkedParents(parRes.data ?? []);
    } catch {
      toast.error('Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // ── Student edit ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStudentEdit = async (data: any) => {
    try {
      await studentsAPI.update(id, data);
      toast.success('Student updated');
      setEditOpen(false);
      load();
    } catch {
      toast.error('Failed to update student');
    }
  };

  // ── Create new parent + auto-link ─────────────────────────────────────────
  const handleAddParent = async (data: ParentFormData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await parentsAPI.create(data);
      const newParentId = res.data?.sms_parentid ?? res.data?.parentid;
      if (newParentId) {
        await studentParentsAPI.link({ studentid: id, parentid: newParentId, isprimary: linkedParents.length === 0 });
      }
      toast.success('Parent added and linked');
      setAddParentOpen(false);
      load();
    } catch {
      toast.error('Failed to add parent');
    }
  };

  // ── Edit existing parent ──────────────────────────────────────────────────
  const handleEditParent = async (data: ParentFormData) => {
    if (!editingParent) return;
    try {
      await parentsAPI.update(editingParent.parentid, data);
      toast.success('Parent updated');
      setEditingParent(null);
      load();
    } catch {
      toast.error('Failed to update parent');
    }
  };

  // ── Search & link existing parent ────────────────────────────────────────
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
    try {
      await studentParentsAPI.link({ studentid: id, parentid, isprimary: linkedParents.length === 0 });
      toast.success('Parent linked');
      setLinkOpen(false);
      setParentSearch(''); setParentResults([]);
      load();
    } catch {
      toast.error('Failed to link parent');
    }
  };

  // ── Toggle primary ────────────────────────────────────────────────────────
  const togglePrimary = async (link: StudentParent) => {
    try {
      await studentParentsAPI.update(link.studentparentid, { isprimary: !link.isprimary });
      toast.success(link.isprimary ? 'Removed primary' : 'Set as primary');
      load();
    } catch { toast.error('Failed to update'); }
  };

  // ── Unlink parent ─────────────────────────────────────────────────────────
  const handleUnlink = async (linkId: string) => {
    try {
      await studentParentsAPI.unlink(linkId);
      toast.success('Parent unlinked');
      load();
    } catch { toast.error('Failed to unlink'); }
  };

  // ─────────────────────────────────────────────────────────────────────────
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

  const attRate = attendance?.percentage ?? 0;

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
        {/* Profile card */}
        <StudentCard student={student} />

        {/* Right column */}
        <div className="space-y-5">

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
                      { label: 'Days Present', value: attendance.present,  color: 'text-green-600 dark:text-green-400' },
                      { label: 'Days Absent',  value: attendance.absent,   color: 'text-red-500 dark:text-red-400' },
                      { label: 'Days Late',    value: attendance.late,     color: 'text-amber-600 dark:text-amber-400' },
                      { label: 'Total Days',   value: attendance.total,    color: 'text-slate-700 dark:text-slate-300' },
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
                      <span className={`font-semibold ${attRate >= 90 ? 'text-green-600' : attRate >= 75 ? 'text-amber-600' : 'text-red-500'}`}>
                        {attRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                      <div className={`h-full rounded-full transition-all ${
                        attRate >= 90 ? 'bg-green-500' : attRate >= 75 ? 'bg-amber-500' : 'bg-red-400'
                      }`} style={{ width: `${attRate}%` }} />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Parents / Guardians */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Parents / Guardians</CardTitle>
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
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                  <UserPlus className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No parents linked yet</p>
                  <p className="text-xs mt-1">Add or link a parent / guardian above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedParents.map(link => (
                    <div key={link.studentparentid}
                      className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex-shrink-0">
                          {link.parentname?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{link.parentname || '—'}</p>
                            {link.isprimary && (
                              <Badge variant="success" className="text-[10px] px-1.5 py-0">Primary</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {PARENT_RELATIONSHIPS[link.relationship] ?? 'Guardian'}
                            {link.parentemail ? ` · ${link.parentemail}` : ''}
                            {link.parentphone ? ` · ${link.parentphone}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" title={link.isprimary ? 'Remove primary' : 'Set as primary'}
                          onClick={() => togglePrimary(link)}
                          className={`h-7 w-7 ${link.isprimary ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}>
                          <Star className="h-3.5 w-3.5" fill={link.isprimary ? 'currentColor' : 'none'} />
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => setEditingParent({
                            parentid:       link.parentid,
                            firstname:      link.parentname?.split(' ')[0] ?? '',
                            lastname:       link.parentname?.split(' ').slice(1).join(' ') ?? '',
                            fullname:       link.parentname ?? '',
                            emailaddress1:  link.parentemail ?? '',
                            telephone1:     link.parentphone ?? '',
                            relationship:   link.relationship,
                            address1_line1: '',
                            createdon:      '',
                            modifiedon:     '',
                          })}
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

          {/* Additional details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <CardTitle>Additional Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {[
                  ['Roll Number',       student.rollnumber || '—'],
                  ['Enrollment Status', ENROLLMENT_STATUS[student.enrollmentstatus] ?? (student.enrollmentstatus ? String(student.enrollmentstatus) : '—')],
                  ['Special Needs',     student.specialneeds ? 'Yes' : 'No'],
                  ['Address',           student.address || '—'],
                  ['Created',           formatDate(student.createdon)],
                  ['Last Updated',      formatDate(student.modifiedon)],
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

      {/* ── Edit student modal ── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Student">
        <StudentForm
          defaultValues={{
            firstname:      student.firstname,
            lastname:       student.lastname,
            dateofbirth:    student.dateofbirth?.slice(0, 10),
            gender:         student.gender,
            email:          student.email || undefined,
            phone:          student.phone || undefined,
            address:        student.address || undefined,
            enrollmentdate: student.enrollmentdate?.slice(0, 10),
            rollnumber:     student.rollnumber || undefined,
            classid:        student.classid || undefined,
          }}
          onSubmit={handleStudentEdit}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* ── Add new parent modal ── */}
      <Modal isOpen={addParentOpen} onClose={() => setAddParentOpen(false)} title="Add New Parent">
        <ParentForm onSubmit={handleAddParent} onCancel={() => setAddParentOpen(false)} />
      </Modal>

      {/* ── Edit parent modal ── */}
      <Modal isOpen={!!editingParent} onClose={() => setEditingParent(null)} title="Edit Parent">
        {editingParent && (
          <ParentForm
            defaultValues={{
              firstname:      editingParent.firstname,
              lastname:       editingParent.lastname,
              emailaddress1:  editingParent.emailaddress1 || undefined,
              telephone1:     editingParent.telephone1 || undefined,
              relationship:   editingParent.relationship,
              address1_line1: editingParent.address1_line1 || undefined,
            }}
            onSubmit={handleEditParent}
            onCancel={() => setEditingParent(null)}
          />
        )}
      </Modal>

      {/* ── Link existing parent modal ── */}
      <Modal isOpen={linkOpen} onClose={() => setLinkOpen(false)} title="Link Existing Parent">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by name…"
              value={parentSearch}
              onChange={e => { setParentSearch(e.target.value); searchParents(e.target.value); }}
            />
          </div>
          {searchLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-[3px] border-slate-200 border-t-blue-600" />
            </div>
          ) : parentResults.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {parentResults.map(p => (
                <button key={p.parentid} onClick={() => handleLinkExisting(p.parentid)}
                  className="w-full flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-3 text-left transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{p.fullname || `${p.firstname} ${p.lastname}`}</p>
                    <p className="text-xs text-slate-500">
                      {PARENT_RELATIONSHIPS[p.relationship] ?? 'Guardian'}
                      {p.emailaddress1 ? ` · ${p.emailaddress1}` : ''}
                    </p>
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
      </Modal>

      {/* ── Unlink confirm ── */}
      <ConfirmDialog
        open={!!unlinkTarget} onOpenChange={o => !o && setUnlinkTarget(null)}
        title="Remove parent?" description="This will unlink the parent from this student. The parent record will not be deleted."
        onConfirm={() => { if (unlinkTarget) { handleUnlink(unlinkTarget); setUnlinkTarget(null); } }}
      />
    </div>
  );
}
