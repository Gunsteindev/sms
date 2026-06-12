'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, BookOpen, Users, DoorOpen, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { classesAPI, academicYearsAPI, gradeLevelsAPI, teachersAPI } from '@/lib/api-client';
import { AISummary } from '@/components/ui/AISummary';
import { Pagination } from '@/components/ui/Pagination';
import type { Class } from '@/lib/dataverse/classes';

const PAGE_SIZE = 10;

const schema = z.object({
  classname:       z.string().min(1, 'Required'),
  classnumber:     z.string().optional(),
  section:         z.string().optional(),
  capacity:        z.coerce.number().min(1, 'Required'),
  roomnumber:      z.string().min(1, 'Required'),
  academicyearid:  z.string().optional(),
  gradelevelid:    z.string().optional(),
  teacherid:       z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function F({ id, label, hint, error, children }: {
  id: string; label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint  && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function ClassForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gradeLevels, setGradeLevels]     = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teachers, setTeachers]           = useState<any[]>([]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    academicYearsAPI.getAll().then((r: any) => setAcademicYears(r.data ?? [])).catch(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gradeLevelsAPI.getAll().then((r: any) => setGradeLevels(r.data ?? [])).catch(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teachersAPI.getAll().then((r: any) => setTeachers(r.data ?? [])).catch(() => {});
  }, []);

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

      {/* ── Class Details ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Class Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <F id="classname" label="Class Name *" error={errors.classname?.message}>
              <Input id="classname" {...register('classname')} placeholder="e.g. Primary 1A" />
            </F>
          </div>
          <F id="classnumber" label="Class Number">
            <Input id="classnumber" {...register('classnumber')} placeholder="e.g. 10-A" />
          </F>
          <F id="section" label="Section">
            <Input id="section" {...register('section')} placeholder="e.g. A, B, C" />
          </F>
          <F id="capacity" label="Capacity *" error={errors.capacity?.message}>
            <Input id="capacity" {...register('capacity')} type="number" min={1} placeholder="e.g. 30" />
          </F>
          <F id="roomnumber" label="Room Number *" error={errors.roomnumber?.message}>
            <Input id="roomnumber" {...register('roomnumber')} placeholder="e.g. 101" />
          </F>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      {/* ── Academic Assignment ── */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Academic Assignment</p>
        <div className="grid grid-cols-2 gap-4">
          <F id="academicyearid" label="Academic Year">
            <Controller name="academicyearid" control={control} render={({ field }) => (
              <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger id="academicyearid" className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                  <SelectValue>
                    {field.value
                      ? (academicYears.find((y: any) => y.academicyearid === field.value)?.name ?? '— None —')
                      : '— None —'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {academicYears.map((y: any) => (
                    <SelectItem key={y.academicyearid} value={y.academicyearid}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            )} />
          </F>
          <F id="gradelevelid" label="Grade Level">
            <Controller name="gradelevelid" control={control} render={({ field }) => (
              <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger id="gradelevelid" className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                  <SelectValue>
                    {field.value
                      ? (gradeLevels.find((g: any) => g.gradelevelid === field.value)?.name ?? '— None —')
                      : '— None —'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {gradeLevels.map((g: any) => (
                    <SelectItem key={g.gradelevelid} value={g.gradelevelid}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            )} />
          </F>
        </div>
        <F id="teacherid" label="Class Teacher">
          <Controller name="teacherid" control={control} render={({ field }) => (
            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger id="teacherid" className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                <SelectValue>
                  {field.value ? (() => {
                    const t = teachers.find((t: any) => t.teacherid === field.value);
                    return t ? `${t.firstname} ${t.lastname}` : '— None —';
                  })() : '— None —'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {teachers.map((t: any) => (
                  <SelectItem key={t.teacherid} value={t.teacherid}>
                    {t.firstname} {t.lastname}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          )} />
        </F>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Class'}</Button>
      </div>
    </form>
  );
}

export default function ClassesPage() {
  const [classes, setClasses]     = useState<Class[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Class | null>(null);
  const [toDelete, setToDelete]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await classesAPI.getAll();
      const items = res.data ?? [];
      setClasses(items);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? classes.filter((c) =>
          `${c.classname} ${c.classnumber} ${c.gradelevelname} ${c.academicyearname} ${c.teachername} ${c.roomnumber}`
            .toLowerCase().includes(q)
        )
      : classes;
  }, [search, classes]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      if (editing) {
        await classesAPI.update(editing.classid, data);
        toast.success('Class updated');
      } else {
        await classesAPI.create(data);
        toast.success('Class added');
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch {
      toast.error('Failed to save class');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await classesAPI.delete(id);
      toast.success('Class deleted');
      load();
    } catch {
      toast.error('Failed to delete class');
    }
  };

  const openEdit = (c: Class) => { setEditing(c); setModalOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Classes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${classes.length} class${classes.length !== 1 ? 'es' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Class
          </Button>
        </div>
      </div>

      <AISummary type="classes" getData={() => ({ total: classes.length, classes })} />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name, teacher, room…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600" />
        </div>
      ) : !filtered.length ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
            <BookOpen className="h-7 w-7 opacity-50" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {search ? `No classes match "${search}"` : 'No classes found'}
          </p>
          {!search && <p className="text-xs mt-1">Add a class to get started</p>}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                {['Class', 'Number', 'Grade Level', 'Academic Year', 'Teacher', 'Room', 'Capacity', ''].map((h) => (
                  <TableHead key={h}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((c) => (
                <TableRow key={c.classid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  {/* Class name */}
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                        <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{c.classname || '—'}</span>
                    </div>
                  </TableCell>
                  {/* Number */}
                  <TableCell className="px-4 py-3.5">
                    {c.classnumber
                      ? <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5">{c.classnumber}</span>
                      : <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  {/* Grade level */}
                  <TableCell className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    {c.gradelevelname || <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  {/* Academic year */}
                  <TableCell className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    {c.academicyearname || <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  {/* Teacher */}
                  <TableCell className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    {c.teachername || <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  {/* Room */}
                  <TableCell className="px-4 py-3.5">
                    {c.roomnumber
                      ? <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <DoorOpen className="h-3.5 w-3.5 text-slate-400" />{c.roomnumber}
                        </span>
                      : <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  {/* Capacity / enrolled */}
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{c.capacity}</span>
                    </div>
                  </TableCell>
                  {/* Actions */}
                  <TableCell className="px-4 py-3.5">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(c.classid)}
                        className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="class" onChange={setPage} />
        </div>
      )}

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit — ${editing.classname}` : 'Add Class'}</DialogTitle>
          </DialogHeader>
        <ClassForm
          defaultValues={editing ? {
            classname:      editing.classname,
            classnumber:    editing.classnumber || undefined,
            section:        editing.section     || undefined,
            capacity:       editing.capacity,
            roomnumber:     editing.roomnumber,
            academicyearid: editing.academicyearid || undefined,
            gradelevelid:   editing.gradelevelid   || undefined,
            teacherid:      editing.teacherid       || undefined,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
              </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete class?"
        description="This will permanently remove the class record from Dataverse."
        onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
      />
    </div>
  );
}
