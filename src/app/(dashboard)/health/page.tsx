'use client';

import { useEffect, useState, useMemo } from 'react';
import { HeartPulse, Search, Edit2, Plus, Phone, AlertCircle, Droplets } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { medicalAPI, studentsAPI } from '@/lib/api-client';
import type { MedicalRecord } from '@/lib/dataverse/medical';

const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

const BLOOD_STYLE: Record<string, string> = {
  'A+': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'A−': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  'B+': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'B−': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  'AB+': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'AB−': 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  'O+': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'O−': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
};

function formatDate(d: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

const schema = z.object({
  bloodtype:          z.string().optional(),
  allergies:          z.string().optional(),
  chronicconditions:  z.string().optional(),
  currentmedications: z.string().optional(),
  vaccinationrecords: z.string().optional(),
  lastcheckupdate:    z.string().optional(),
  emergencycontact:   z.string().optional(),
  emergencyphone:     z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function F({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function MedicalForm({ defaultValues, studentid, onDone, onCancel }: {
  defaultValues?: Partial<FormData>;
  studentid: string;
  onDone: (record: MedicalRecord) => void;
  onCancel: () => void;
}) {
  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { studentid, ...data };
      let result;
      if (defaultValues && (defaultValues as any).__medicalid) {
        const id = (defaultValues as any).__medicalid;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await medicalAPI.update(id, payload);
        result = res.data ?? res;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await medicalAPI.create(payload);
        result = res.data ?? res;
      }
      toast.success('Health record saved');
      onDone(result);
    } catch {
      toast.error('Failed to save health record');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
      {/* Medical info */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medical Information</p>
        <F id="bloodtype" label="Blood Type">
          <Controller name="bloodtype" control={control} render={({ field }) => (
            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className={ST}>
                <SelectValue>{field.value || '— Unknown —'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Unknown —</SelectItem>
                {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
              </SelectContent>
            </SelectRoot>
          )} />
        </F>
        <F id="allergies" label="Allergies">
          <Textarea id="allergies" {...register('allergies')} rows={2} placeholder="e.g. Peanuts, Penicillin, Pollen…" />
        </F>
        <F id="chronicconditions" label="Chronic Conditions">
          <Textarea id="chronicconditions" {...register('chronicconditions')} rows={2} placeholder="e.g. Asthma, Diabetes, Sickle Cell…" />
        </F>
        <F id="currentmedications" label="Current Medications">
          <Textarea id="currentmedications" {...register('currentmedications')} rows={2} placeholder="e.g. Salbutamol inhaler, Metformin…" />
        </F>
      </div>

      {/* Emergency & history */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emergency &amp; History</p>
        <div className="grid grid-cols-2 gap-4">
          <F id="emergencycontact" label="Emergency Contact">
            <Input id="emergencycontact" {...register('emergencycontact')} placeholder="Full name" />
          </F>
          <F id="emergencyphone" label="Emergency Phone">
            <Input id="emergencyphone" {...register('emergencyphone')} placeholder="+233 55 000 0000" />
          </F>
        </div>
        <F id="lastcheckupdate" label="Last Check-up Date">
          <Input id="lastcheckupdate" {...register('lastcheckupdate')} type="date" className="h-10 max-w-[200px]" />
        </F>
        <F id="vaccinationrecords" label="Vaccination Records">
          <Textarea id="vaccinationrecords" {...register('vaccinationrecords')} rows={3} placeholder="e.g. BCG – 2020, Hepatitis B – 2021, COVID-19 – 2022…" />
        </F>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Record'}</Button>
      </div>
    </form>
  );
}

export default function HealthPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents]       = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedId, setSelectedId]   = useState('');
  const [record, setRecord]           = useState<MedicalRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentsAPI.getAll().then((r: any) => setStudents(r.data ?? [])).catch(() => {});
  }, []);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    return q
      ? students.filter((s: any) =>
          (s.fullname || `${s.firstname} ${s.lastname}`).toLowerCase().includes(q))
      : students.slice(0, 20);
  }, [studentSearch, students]);

  const selectedStudent = useMemo(() =>
    students.find((s: any) => s.studentid === selectedId),
  [students, selectedId]);

  const selectStudent = async (s: any) => {
    setSelectedId(s.studentid);
    setStudentSearch(s.fullname || `${s.firstname} ${s.lastname}`);
    setShowDropdown(false);
    setLoadingRecord(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await medicalAPI.getByStudent(s.studentid);
      setRecord(res.data ?? null);
    } catch {
      setRecord(null);
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleSaved = (r: MedicalRecord) => {
    setRecord(r);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Health Records</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage student medical information, allergies, and emergency contacts
        </p>
      </div>

      {/* Student selector */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Select Student</p>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search student by name…"
            className="pl-9"
            value={studentSearch}
            onChange={e => { setStudentSearch(e.target.value); setShowDropdown(true); if (!e.target.value) { setSelectedId(''); setRecord(null); } }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && filteredStudents.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              {filteredStudents.map((s: any) => (
                <button
                  key={s.studentid}
                  type="button"
                  onClick={() => selectStudent(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100">{s.fullname || `${s.firstname} ${s.lastname}`}</p>
                  {s.classname && <p className="text-xs text-slate-400">{s.classname}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record display */}
      {selectedId && (
        loadingRecord ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 border-t-emerald-600" />
          </div>
        ) : record ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            {/* Record header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <HeartPulse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedStudent?.fullname || selectedStudent?.firstname + ' ' + selectedStudent?.lastname}</p>
                  <p className="text-xs text-slate-400">Last updated {formatDate(record.modifiedon)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
                <Edit2 className="h-4 w-4 mr-1.5" /> Edit
              </Button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medical info */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medical Information</p>
                <div className="flex items-center gap-3">
                  <Droplets className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Blood Type:</span>
                  {record.bloodtype
                    ? <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${BLOOD_STYLE[record.bloodtype] ?? 'bg-slate-100 text-slate-600'}`}>{record.bloodtype}</span>
                    : <span className="text-sm text-slate-400">Unknown</span>}
                </div>
                {record.allergies && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-orange-500" /> Allergies</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{record.allergies}</p>
                  </div>
                )}
                {record.chronicconditions && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Chronic Conditions</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{record.chronicconditions}</p>
                  </div>
                )}
                {record.currentmedications && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Current Medications</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{record.currentmedications}</p>
                  </div>
                )}
              </div>

              {/* Emergency & history */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emergency Contact</p>
                {record.emergencycontact ? (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-4 space-y-1.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{record.emergencycontact}</p>
                    {record.emergencyphone && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />{record.emergencyphone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No emergency contact set</p>
                )}
                {record.lastcheckupdate && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Last Check-up</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{formatDate(record.lastcheckupdate)}</p>
                  </div>
                )}
                {record.vaccinationrecords && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Vaccination Records</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{record.vaccinationrecords}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
              <HeartPulse className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No health record for this student</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Create one to track medical information</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Create Health Record
            </Button>
          </div>
        )
      )}

      {/* Empty state — no student selected */}
      {!selectedId && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
            <HeartPulse className="h-7 w-7 opacity-50" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Select a student to view their health record</p>
          <p className="text-xs mt-1">Search by name above</p>
        </div>
      )}

      {/* Edit modal */}
      <Dialog open={modalOpen} onOpenChange={o => !o && setModalOpen(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{record ? 'Edit Health Record' : 'Create Health Record'}</DialogTitle>
          </DialogHeader>
          {selectedId && (
            <MedicalForm
              studentid={selectedId}
              defaultValues={record ? {
                __medicalid:        record.medicalid,
                bloodtype:          record.bloodtype          || undefined,
                allergies:          record.allergies          || undefined,
                chronicconditions:  record.chronicconditions  || undefined,
                currentmedications: record.currentmedications || undefined,
                vaccinationrecords: record.vaccinationrecords || undefined,
                lastcheckupdate:    record.lastcheckupdate    || undefined,
                emergencycontact:   record.emergencycontact   || undefined,
                emergencyphone:     record.emergencyphone     || undefined,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any : undefined}
              onDone={handleSaved}
              onCancel={() => setModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
