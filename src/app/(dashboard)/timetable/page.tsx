'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CalendarDays, Clock, DoorOpen, User, RefreshCw } from 'lucide-react';
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
import { AISummary } from '@/components/ui/AISummary';
import { Pagination } from '@/components/ui/Pagination';
import { timetableAPI, classesAPI, subjectsAPI, teachersAPI } from '@/lib/api-client';

const PAGE_SIZE = 10;
import type { TimetableEntry } from '@/lib/dataverse/timetable';
import { DAYS_OF_WEEK } from '@/lib/dataverse/timetable';

// ── colour palette per subject ────────────────────────────────────────────────
const SUBJECT_COLORS = [
    'bg-blue-50   border-blue-200   text-blue-800   dark:bg-blue-900/30  dark:border-blue-700  dark:text-blue-200',
    'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200',
    'bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-200',
    'bg-amber-50  border-amber-200  text-amber-800  dark:bg-amber-900/30 dark:border-amber-700  dark:text-amber-200',
    'bg-rose-50   border-rose-200   text-rose-800   dark:bg-rose-900/30  dark:border-rose-700   dark:text-rose-200',
    'bg-cyan-50   border-cyan-200   text-cyan-800   dark:bg-cyan-900/30  dark:border-cyan-700   dark:text-cyan-200',
];

function subjectColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length];
}

// ── form ──────────────────────────────────────────────────────────────────────
const schema = z.object({
    dayofweek:    z.string().min(1, 'Required'),
    starttime:    z.string().min(1, 'Required'),
    endtime:      z.string().min(1, 'Required'),
    roomnumber:   z.string().optional(),
    periodnumber: z.coerce.number().optional(),
    classid:      z.string().optional(),
    subjectid:    z.string().optional(),
    teacherid:    z.string().optional(),
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

function TimetableForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [classes,  setClasses]  = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [subjects, setSubjects] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [teachers, setTeachers] = useState<any[]>([]);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        classesAPI.getAll().then((r: any)  => setClasses(r.data ?? [])).catch(() => {});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subjectsAPI.getAll().then((r: any) => setSubjects(r.data ?? [])).catch(() => {});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teachersAPI.getAll().then((r: any) => setTeachers(r.data ?? [])).catch(() => {});
    }, []);

    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: { dayofweek: 'Monday', ...defaultValues },
    });

    const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

            {/* ── Schedule ── */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Schedule</p>
                <div className="grid grid-cols-2 gap-4">
                    <F id="dayofweek" label="Day *" error={errors.dayofweek?.message}>
                        <Controller name="dayofweek" control={control} render={({ field }) => (
                            <SelectRoot value={field.value} onValueChange={v => field.onChange(v)}>
                                <SelectTrigger className={ST}>
                                    <SelectValue>{field.value || 'Select day'}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(DAYS_OF_WEEK).map(([k, v]) => (
                                        <SelectItem key={k} value={v}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                    <F id="periodnumber" label="Period #">
                        <Input id="periodnumber" {...register('periodnumber')} type="number" min={1} max={10} placeholder="e.g. 1" />
                    </F>
                    <F id="starttime" label="Start Time *" error={errors.starttime?.message}>
                        <Input id="starttime" {...register('starttime')} type="time" />
                    </F>
                    <F id="endtime" label="End Time *" error={errors.endtime?.message}>
                        <Input id="endtime" {...register('endtime')} type="time" />
                    </F>
                    <div className="col-span-2">
                        <F id="roomnumber" label="Room Number">
                            <Input id="roomnumber" {...register('roomnumber')} placeholder="e.g. 101" />
                        </F>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* ── Assignment ── */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Assignment</p>
                <div className="grid grid-cols-2 gap-4">
                    <F id="classid" label="Class">
                        <Controller name="classid" control={control} render={({ field }) => (
                            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                                <SelectTrigger className={ST}>
                                    <SelectValue>
                                        {field.value
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            ? (classes.find((c: any) => c.classid === field.value)?.classname ?? '— None —')
                                            : '— None —'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">— None —</SelectItem>
                                    {classes.map((c: any) => (
                                        <SelectItem key={c.classid} value={c.classid}>{c.classname}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                    <F id="subjectid" label="Subject">
                        <Controller name="subjectid" control={control} render={({ field }) => (
                            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                                <SelectTrigger className={ST}>
                                    <SelectValue>
                                        {field.value
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            ? (subjects.find((s: any) => s.subjectid === field.value)?.name ?? '— None —')
                                            : '— None —'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">— None —</SelectItem>
                                    {subjects.map((s: any) => (
                                        <SelectItem key={s.subjectid} value={s.subjectid}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                </div>
                <F id="teacherid" label="Teacher">
                    <Controller name="teacherid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger className={ST}>
                                <SelectValue>
                                    {field.value ? (() => {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Entry'}</Button>
            </div>
        </form>
    );
}

// ── period card ───────────────────────────────────────────────────────────────
function PeriodCard({ entry, onEdit, onDelete }: {
    entry: TimetableEntry;
    onEdit: (e: TimetableEntry) => void;
    onDelete: (id: string) => void;
}) {
    const color = subjectColor(entry.subjectname || entry.name);
    return (
        <div className={`group relative rounded-lg border p-2.5 text-xs transition-shadow hover:shadow-sm ${color}`}>
            {/* subject name */}
            <p className="font-semibold truncate leading-snug">
                {entry.subjectname || entry.name || '—'}
            </p>
            {/* time */}
            <div className="flex items-center gap-1 mt-1 opacity-80">
                <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                <span>{entry.starttime}–{entry.endtime}</span>
            </div>
            {/* room */}
            {entry.roomnumber && (
                <div className="flex items-center gap-1 mt-0.5 opacity-80">
                    <DoorOpen className="h-2.5 w-2.5 flex-shrink-0" />
                    <span>Room {entry.roomnumber}</span>
                </div>
            )}
            {/* teacher */}
            {entry.teachername && (
                <div className="flex items-center gap-1 mt-0.5 opacity-70 truncate">
                    <User className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate">{entry.teachername}</span>
                </div>
            )}
            {/* hover actions */}
            <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(entry)}
                    className="rounded p-0.5 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800">
                    <Pencil className="h-3 w-3" />
                </button>
                <button onClick={() => onDelete(entry.timetableid)}
                    className="rounded p-0.5 bg-white/70 dark:bg-slate-900/70 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500">
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function TimetablePage() {
    const [rows, setRows]         = useState<TimetableEntry[]>([]);
    const [loading, setLoading]   = useState(true);
    const [filterDay, setFilterDay] = useState<number | 'all'>('all');
    const [view, setView]         = useState<'grid' | 'list'>('grid');
    const [page, setPage]         = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]   = useState<TimetableEntry | null>(null);
    const [toDelete, setToDelete] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await timetableAPI.getAll();
            setRows(res.data ?? []);
        } catch { toast.error('Failed to load timetable'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [filterDay]);

    const filtered = filterDay === 'all' ? rows : rows.filter(r => r.dayofweek === filterDay);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Group by day for grid view
    const byDay: Record<number, TimetableEntry[]> = {};
    for (let d = 1; d <= 5; d++) byDay[d] = [];
    filtered.forEach(r => {
        if (r.dayofweek >= 1 && r.dayofweek <= 5) byDay[r.dayofweek].push(r);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await timetableAPI.update(editing.timetableid, { ...data, dayofweek: Object.entries(DAYS_OF_WEEK).find(([,v])=>v===data.dayofweek)?.[0] ? Number(Object.entries(DAYS_OF_WEEK).find(([,v])=>v===data.dayofweek)![0]) : 1 });
                toast.success('Entry updated');
            } else {
                await timetableAPI.create({ ...data, dayofweek: Object.entries(DAYS_OF_WEEK).find(([,v])=>v===data.dayofweek)?.[0] ? Number(Object.entries(DAYS_OF_WEEK).find(([,v])=>v===data.dayofweek)![0]) : 1 });
                toast.success('Entry added');
            }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save entry'); }
    };

    const handleDelete = async (id: string) => {
        try { await timetableAPI.delete(id); toast.success('Entry deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    const openEdit = (e: TimetableEntry) => { setEditing(e); setModalOpen(true); };

    const WORK_DAYS = [1, 2, 3, 4, 5] as const;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Timetable</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : `${rows.length} entr${rows.length !== 1 ? 'ies' : 'y'}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    {/* View toggle */}
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                        {(['grid', 'list'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)}
                                className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                                    view === v
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}>
                                {v}
                            </button>
                        ))}
                    </div>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Entry
                    </Button>
                </div>
            </div>

            <AISummary type="timetable" getData={() => ({ total: rows.length, entries: rows })} />

            {/* Day filter pills */}
            <div className="flex gap-2 flex-wrap">
                <button onClick={() => setFilterDay('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filterDay === 'all'
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}>All days</button>
                {WORK_DAYS.map(d => (
                    <button key={d} onClick={() => setFilterDay(d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            filterDay === d
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}>{DAYS_OF_WEEK[d]}</button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-violet-600" />
                </div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <CalendarDays className="h-7 w-7 opacity-50" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No timetable entries found</p>
                </div>

            ) : view === 'grid' ? (
                /* ── GRID VIEW ── */
                <div className="overflow-x-auto">
                    <div className="grid gap-3 min-w-[700px]"
                        style={{ gridTemplateColumns: filterDay === 'all' ? 'repeat(5, 1fr)' : '1fr' }}>
                        {(filterDay === 'all' ? WORK_DAYS : [filterDay as number]).map(day => (
                            <div key={day}>
                                {/* Day header */}
                                <div className="mb-2 px-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {DAYS_OF_WEEK[day]}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-600">
                                        {byDay[day]?.length ?? 0} period{byDay[day]?.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {/* Period cards */}
                                <div className="space-y-2">
                                    {(byDay[day] ?? []).length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-3 text-center text-xs text-slate-400 dark:text-slate-600">
                                            No periods
                                        </div>
                                    ) : (
                                        (byDay[day] ?? []).map(entry => (
                                            <PeriodCard key={entry.timetableid} entry={entry}
                                                onEdit={openEdit} onDelete={id => setToDelete(id)} />
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            ) : (
                /* ── LIST VIEW ── */
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                {['Day', 'Period', 'Time', 'Subject', 'Class', 'Teacher', 'Room', ''].map(h => (
                                    <TableHead key={h}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(r => (
                                <TableRow key={r.timetableid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                    <TableCell>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {DAYS_OF_WEEK[r.dayofweek] ?? r.dayofweekname}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                                        {r.periodnumber ? `P${r.periodnumber}` : '—'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                                        {r.starttime}–{r.endtime}
                                    </TableCell>
                                    <TableCell>
                                        {r.subjectname
                                            ? <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium border ${subjectColor(r.subjectname)}`}>{r.subjectname}</span>
                                            : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                                        {r.classname || <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                                        {r.teachername || <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </TableCell>
                                    <TableCell>
                                        {r.roomnumber
                                            ? <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5">
                                                <DoorOpen className="h-3 w-3" />{r.roomnumber}
                                              </span>
                                            : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-0.5">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}
                                                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                                <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(r.timetableid)}
                                                className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="entry" onChange={setPage} />
                </div>
            )}

            {/* Modal */}
            <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditing(null); } }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Entry' : 'Add Timetable Entry'}</DialogTitle>
                </DialogHeader>
                <TimetableForm
                    defaultValues={editing ? {
                        dayofweek:    DAYS_OF_WEEK[editing.dayofweek] ?? 'Monday',
                        starttime:    editing.starttime,
                        endtime:      editing.endtime,
                        roomnumber:   editing.roomnumber   || undefined,
                        periodnumber: editing.periodnumber ?? undefined,
                        classid:      editing.classid      || undefined,
                        subjectid:    editing.subjectid    || undefined,
                        teacherid:    editing.teacherid    || undefined,
                    } : undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => { setModalOpen(false); setEditing(null); }}
                />
                          </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete entry?" description="This will permanently remove the timetable entry."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
