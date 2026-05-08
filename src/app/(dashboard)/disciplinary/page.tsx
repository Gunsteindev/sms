'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw, ShieldAlert, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { disciplinaryAPI, studentsAPI, teachersAPI } from '@/lib/api-client';
import { INCIDENT_TYPE_LABELS } from '@/lib/dataverse/disciplinary';
import type { DisciplinaryRecord, IncidentType } from '@/lib/dataverse/disciplinary';

const PAGE_SIZE = 10;

const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const INCIDENT_STYLE: Record<number, string> = {
  1: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
  2: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  3: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  4: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300',
};

function formatDate(d: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

const schema = z.object({
  studentid:      z.string().min(1, 'Required'),
  date:           z.string().min(1, 'Required'),
  incidenttype:   z.string().min(1, 'Required'),
  description:    z.string().min(1, 'Required'),
  action:         z.string().optional(),
  reportedbyid:   z.string().optional(),
  parentnotified: z.boolean().default(false),
  resolved:       z.boolean().default(false),
  resolutiondate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function DisciplinaryForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentsAPI.getAll().then((r: any) => setStudents(r.data ?? [])).catch(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teachersAPI.getAll().then((r: any) => setTeachers(r.data ?? [])).catch(() => {});
  }, []);

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { parentnotified: false, resolved: false, ...defaultValues },
  });

  const isResolved = watch('resolved');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
      {/* Identification */}
      <div className="grid grid-cols-2 gap-4">
        <F id="studentid" label="Student *" error={errors.studentid?.message}>
          <Controller name="studentid" control={control} render={({ field }) => (
            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className={ST}>
                <SelectValue>
                  {field.value
                    ? (() => { const s = students.find((s: any) => s.studentid === field.value); return s ? (s.fullname || `${s.firstname} ${s.lastname}`) : 'Select…'; })()
                    : 'Select student…'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {students.map((s: any) => (
                  <SelectItem key={s.studentid} value={s.studentid}>
                    {s.fullname || `${s.firstname} ${s.lastname}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          )} />
        </F>
        <F id="date" label="Date *" error={errors.date?.message}>
          <Input id="date" {...register('date')} type="date" className="h-10" />
        </F>
      </div>
      <F id="incidenttype" label="Incident Type *" error={errors.incidenttype?.message}>
        <Controller name="incidenttype" control={control} render={({ field }) => (
          <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
            <SelectTrigger className={ST}>
              <SelectValue>{field.value ? INCIDENT_TYPE_LABELS[Number(field.value)] ?? 'Select…' : 'Select type…'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INCIDENT_TYPE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        )} />
      </F>

      {/* Incident details */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Incident Details</p>
        <F id="description" label="Description *" error={errors.description?.message}>
          <Textarea id="description" {...register('description')} rows={3} placeholder="Describe the incident…" />
        </F>
        <F id="action" label="Action Taken">
          <Textarea id="action" {...register('action')} rows={2} placeholder="What action was taken?" />
        </F>
        <F id="reportedbyid" label="Reported By">
          <Controller name="reportedbyid" control={control} render={({ field }) => (
            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className={ST}>
                <SelectValue>
                  {field.value
                    ? (() => { const t = teachers.find((t: any) => t.teacherid === field.value); return t ? `${t.firstname} ${t.lastname}` : '— None —'; })()
                    : '— None —'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {teachers.map((t: any) => (
                  <SelectItem key={t.teacherid} value={t.teacherid}>{t.firstname} {t.lastname}</SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          )} />
        </F>
      </div>

      {/* Status */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('parentnotified')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Parent Notified</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('resolved')} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Resolved</span>
          </label>
        </div>
        {isResolved && (
          <F id="resolutiondate" label="Resolution Date">
            <Input id="resolutiondate" {...register('resolutiondate')} type="date" className="h-10 max-w-[200px]" />
          </F>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Record'}</Button>
      </div>
    </form>
  );
}

export default function DisciplinaryPage() {
  const [records, setRecords]         = useState<DisciplinaryRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState<string>('');
  const [resolvedFilter, setResolvedFilter] = useState<string>('');
  const [page, setPage]               = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<DisciplinaryRecord | null>(null);
  const [toDelete, setToDelete]       = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await disciplinaryAPI.getAll();
      setRecords(res.data ?? []);
    } catch {
      toast.error('Failed to load disciplinary records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, typeFilter, resolvedFilter]);

  const filtered = useMemo(() => {
    let list = records;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => `${r.studentname} ${r.description} ${r.action}`.toLowerCase().includes(q));
    }
    if (typeFilter) list = list.filter(r => String(r.incidenttype) === typeFilter);
    if (resolvedFilter === 'open')     list = list.filter(r => !r.resolved);
    if (resolvedFilter === 'resolved') list = list.filter(r =>  r.resolved);
    return list;
  }, [records, search, typeFilter, resolvedFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = async (data: FormData) => {
    try {
      const payload = {
        studentid:      data.studentid,
        date:           data.date,
        incidenttype:   Number(data.incidenttype) as IncidentType,
        description:    data.description,
        action:         data.action         || undefined,
        reportedbyid:   data.reportedbyid   || undefined,
        parentnotified: data.parentnotified,
        resolved:       data.resolved,
        resolutiondate: data.resolutiondate || undefined,
      };
      if (editing) {
        await disciplinaryAPI.update(editing.disciplinaryid, payload);
        toast.success('Record updated');
      } else {
        await disciplinaryAPI.create(payload);
        toast.success('Record added');
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch {
      toast.error('Failed to save record');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await disciplinaryAPI.delete(id);
      toast.success('Record deleted');
      load();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const openEdit = (r: DisciplinaryRecord) => { setEditing(r); setModalOpen(true); };

  const openCount  = records.filter(r => !r.resolved).length;
  const expulsions = records.filter(r => r.incidenttype === 4).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Disciplinary Records</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${records.length} record${records.length !== 1 ? 's' : ''} · ${openCount} open${expulsions ? ` · ${expulsions} expulsion${expulsions !== 1 ? 's' : ''}` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Record
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search student, description…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <SelectRoot value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? '')}>
          <SelectTrigger className="w-44 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
            <SelectValue>{typeFilter ? INCIDENT_TYPE_LABELS[Number(typeFilter)] : 'All Types'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {Object.entries(INCIDENT_TYPE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
        <SelectRoot value={resolvedFilter} onValueChange={(v) => setResolvedFilter(v ?? '')}>
          <SelectTrigger className="w-40 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
            <SelectValue>{resolvedFilter === 'open' ? 'Open' : resolvedFilter === 'resolved' ? 'Resolved' : 'All Status'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </SelectRoot>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-violet-600" />
        </div>
      ) : !filtered.length ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
            <ShieldAlert className="h-7 w-7 opacity-50" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {search || typeFilter || resolvedFilter ? 'No records match the filters' : 'No disciplinary records'}
          </p>
          {!search && !typeFilter && !resolvedFilter && <p className="text-xs mt-1">Records will appear here when incidents are logged</p>}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                {['Student · Date', 'Type', 'Description', 'Action', 'Parent', 'Status', ''].map(h => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(r => (
                <TableRow key={r.disciplinaryid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{r.studentname || '—'}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.date)}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${INCIDENT_STYLE[r.incidenttype] ?? 'bg-slate-100 text-slate-600'}`}>
                      {r.incidenttypename}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <p className="text-slate-700 dark:text-slate-300 max-w-[220px] truncate" title={r.description}>{r.description}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {r.action
                      ? <p className="text-slate-600 dark:text-slate-400 max-w-[160px] truncate text-xs" title={r.action}>{r.action}</p>
                      : <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {r.parentnotified
                      ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400"><Check className="h-3.5 w-3.5" />Yes</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><X className="h-3.5 w-3.5" />No</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {r.resolved
                      ? <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">Resolved</span>
                      : <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Open</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(r.disciplinaryid)} className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="record" onChange={setPage} />
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Record' : 'Add Disciplinary Record'}</DialogTitle>
          </DialogHeader>
          <DisciplinaryForm
            defaultValues={editing ? {
              studentid:      editing.studentid,
              date:           editing.date,
              incidenttype:   String(editing.incidenttype),
              description:    editing.description,
              action:         editing.action         || undefined,
              reportedbyid:   editing.reportedbyid   || undefined,
              parentnotified: editing.parentnotified,
              resolved:       editing.resolved,
              resolutiondate: editing.resolutiondate || undefined,
            } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setModalOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={o => !o && setToDelete(null)}
        title="Delete record?"
        description="This will permanently remove the disciplinary record."
        onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
      />
    </div>
  );
}
