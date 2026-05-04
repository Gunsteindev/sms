'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Clock, AlertCircle, Users, Calendar, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';
import type { Attendance } from '@/lib/dataverse/attendance';
import { AISummary } from '@/components/ui/AISummary';
import { Pagination } from '@/components/ui/Pagination';
import { attendanceAPI, studentsAPI, classesAPI } from '@/lib/api-client';

const PAGE_SIZE = 10;

function today() { return new Date().toISOString().split('T')[0]; }

const STATUSES: Record<number, { label: string; variant: 'success' | 'error' | 'warning' | 'default'; icon: React.ElementType }> = {
    1: { label: 'Present', variant: 'success', icon: CheckCircle2 },
    2: { label: 'Absent',  variant: 'error',   icon: XCircle },
    3: { label: 'Late',    variant: 'warning',  icon: Clock },
    4: { label: 'Excused', variant: 'default',  icon: AlertCircle },
};

interface Option { id: string; name: string; }

const schema = z.object({
    studentid:        z.string().min(1, 'Required'),
    date:             z.string().min(1, 'Required'),
    attendancestatus: z.string().default('Present'),
    checkintime:      z.string().optional(),
    classid:          z.string().optional(),
    subjectid:        z.string().optional(),
    remarks:          z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-slate-700 dark:text-slate-300 text-sm font-medium">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function AttendanceForm({ defaultValues, students, classes, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    students: Option[];
    classes: Option[];
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: { date: today(), attendancestatus: 'Present', ...defaultValues },
    });
    const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Student ── */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Student</p>
                <F id="studentid" label="Student *" error={errors.studentid?.message}>
                    <Controller name="studentid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger id="studentid" className={ST}>
                                <SelectValue>
                                    {field.value
                                        ? (students.find(s => s.id === field.value)?.name ?? 'Select student')
                                        : 'Select student'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* ── Attendance Details ── */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Attendance Details</p>
                <div className="grid grid-cols-2 gap-4">
                    <F id="date" label="Date *" error={errors.date?.message}>
                        <Controller control={control} name="date" render={({ field }) => (
                            <DatePicker id="date" value={field.value} onChange={field.onChange} placeholder="Select date" />
                        )} />
                    </F>
                    <F id="attendancestatus" label="Status *" error={errors.attendancestatus?.message}>
                        <Controller name="attendancestatus" control={control} render={({ field }) => (
                            <SelectRoot value={field.value} onValueChange={v => field.onChange(v)}>
                                <SelectTrigger id="attendancestatus" className={ST}>
                                    <SelectValue>
                                        {field.value || 'Select status'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATUSES).map(([k, v]) => (
                                        <SelectItem key={k} value={v.label}>{v.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                    <F id="checkintime" label="Check-in Time" error={errors.checkintime?.message}>
                        <Input id="checkintime" {...register('checkintime')} type="time" />
                    </F>
                    <F id="classid" label="Class" error={errors.classid?.message}>
                        <Controller name="classid" control={control} render={({ field }) => (
                            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                                <SelectTrigger id="classid" className={ST}>
                                    <SelectValue>
                                        {field.value
                                            ? (classes.find(c => c.id === field.value)?.name ?? '— None —')
                                            : '— None —'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">— None —</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                    <div className="col-span-2">
                        <F id="remarks" label="Remarks" error={errors.remarks?.message}>
                            <Input id="remarks" {...register('remarks')} placeholder="Optional notes" />
                        </F>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Record'}</Button>
            </div>
        </form>
    );
}

const formatTime = (t?: string) => {
    if (!t) return '—';
    if (t.includes('T')) return t.slice(11, 16);
    return t.slice(0, 5);
};

function avatarColor(name: string) {
    const colors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
}

export default function AttendancePage() {
    const [rows, setRows]                 = useState<Attendance[]>([]);
    const [loading, setLoading]           = useState(true);
    const [dateFilter, setDateFilter]     = useState(today());
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
    const [page, setPage]                 = useState(1);
    const [modalOpen, setModalOpen]       = useState(false);
    const [editing, setEditing]           = useState<Attendance | null>(null);
    const [toDelete, setToDelete]         = useState<string | null>(null);

    const [students, setStudents] = useState<Option[]>([]);
    const [classes, setClasses]   = useState<Option[]>([]);

    const load = async (date: string) => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await attendanceAPI.getByDate(date);
            setRows(res.data ?? []);
        } catch {
            toast.error('Failed to load attendance');
        } finally {
            setLoading(false);
        }
    };

    const loadDropdowns = async () => {
        try {
            const [sr, cr] = await Promise.all([
                studentsAPI.getAll() as Promise<any>,
                classesAPI.getAll()  as Promise<any>,
            ]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setStudents((sr.data ?? []).map((s: any) => ({ id: s.studentid, name: `${s.firstname} ${s.lastname}` })));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setClasses((cr.data ?? []).map((c: any) => ({ id: c.classid, name: c.classname ?? c.name })));
        } catch { /* non-fatal */ }
    };

    useEffect(() => { loadDropdowns(); }, []);
    useEffect(() => { load(dateFilter); }, [dateFilter]);
    useEffect(() => { setPage(1); }, [search, statusFilter, dateFilter]);

    const filtered = useMemo(() => {
        let list = rows;
        if (statusFilter !== 'all') list = list.filter(r => r.attendancestatus === statusFilter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(r => (r.studentname ?? '').toLowerCase().includes(q) || (r.remarks ?? '').toLowerCase().includes(q));
        }
        return list;
    }, [rows, statusFilter, search]);

    const counts = useMemo(() => {
        const c = { 1: 0, 2: 0, 3: 0, 4: 0 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.forEach(r => { if (r.attendancestatus in c) (c as any)[r.attendancestatus]++; });
        return c;
    }, [rows]);

    const total = rows.length;
    const rate  = total > 0 ? ((counts[1] / total) * 100).toFixed(1) : null;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await attendanceAPI.update(editing.attendanceid, { ...data, attendancestatus: Object.entries(STATUSES).find(([,v])=>v.label===data.attendancestatus)?.[0] ? Number(Object.entries(STATUSES).find(([,v])=>v.label===data.attendancestatus)![0]) : 1 });
                toast.success('Record updated');
            } else {
                await attendanceAPI.markBulk([{ ...data, attendancestatus: Object.entries(STATUSES).find(([,v])=>v.label===data.attendancestatus)?.[0] ? Number(Object.entries(STATUSES).find(([,v])=>v.label===data.attendancestatus)![0]) : 1 }]);
                toast.success('Record added');
            }
            setModalOpen(false);
            setEditing(null);
            load(dateFilter);
        } catch {
            toast.error('Failed to save record');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await attendanceAPI.delete(id);
            toast.success('Deleted');
            load(dateFilter);
        } catch {
            toast.error('Failed to delete');
        }
    };

    const closeModal = () => { setModalOpen(false); setEditing(null); };

    const summaryCards = [
        { label: 'Present', value: counts[1], icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-950/40', icon_c: 'text-emerald-600',  border: 'border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-400', status: 1 as number | 'all' },
        { label: 'Absent',  value: counts[2], icon: XCircle,      bg: 'bg-red-50 dark:bg-red-950/40',         icon_c: 'text-red-600',     border: 'border-red-200 dark:border-red-800',         ring: 'ring-red-400',     status: 2 as number | 'all' },
        { label: 'Late',    value: counts[3], icon: Clock,        bg: 'bg-amber-50 dark:bg-amber-950/40',     icon_c: 'text-amber-600',   border: 'border-amber-200 dark:border-amber-800',     ring: 'ring-amber-400',   status: 3 as number | 'all' },
        { label: 'Excused', value: counts[4], icon: AlertCircle,  bg: 'bg-blue-50 dark:bg-blue-950/40',       icon_c: 'text-blue-600',    border: 'border-blue-200 dark:border-blue-800',       ring: 'ring-blue-400',    status: 4 as number | 'all' },
        { label: 'Total',   value: total,     icon: Users,        bg: 'bg-slate-100 dark:bg-slate-800',       icon_c: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', ring: 'ring-slate-400', status: 'all' as number | 'all' },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(dateFilter + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={e => { setDateFilter(e.target.value); setStatusFilter('all'); setSearch(''); }}
                        className="w-40"
                    />
                    <Button variant="outline" size="sm" onClick={() => load(dateFilter)} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Record
                    </Button>
                </div>
            </div>

            <AISummary
                type="attendance"
                getData={() => ({ date: dateFilter, counts, total, records: filtered.slice(0, 30) })}
            />

            {/* Summary cards — clickable to filter */}
            <div className="grid grid-cols-5 gap-3">
                {summaryCards.map(({ label, value, icon: Icon, bg, icon_c, border, ring, status }) => {
                    const active = statusFilter === status;
                    return (
                        <button key={label} onClick={() => setStatusFilter(active ? 'all' : status)}
                            className={`group text-left rounded-xl border bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md ${border} ${active ? `ring-2 ${ring} ring-offset-1` : ''}`}>
                            <div className="p-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} mb-3`}>
                                    <Icon className={`h-5 w-5 ${icon_c}`} />
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Rate banner */}
            {rate && (
                <div className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-violet-200">Attendance Rate</p>
                        <p className="text-4xl font-bold mt-1.5 leading-none">{rate}%</p>
                        <p className="text-sm text-violet-300 mt-2">{counts[1]} present · {total} total records</p>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                        <Calendar className="h-8 w-8 text-white/70" />
                    </div>
                </div>
            )}

            {/* Search + status pills */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by student name…"
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {([['all', 'All'], [1, 'Present'], [2, 'Absent'], [3, 'Late'], [4, 'Excused']] as [number | 'all', string][]).map(([val, lbl]) => (
                        <button key={String(val)} onClick={() => setStatusFilter(val)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                statusFilter === val
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}>
                            {lbl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-violet-600" />
                </div>
            ) : !filtered.length ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <Calendar className="h-7 w-7 opacity-50" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {rows.length === 0 ? 'No attendance records for this date' : 'No records match the current filter'}
                    </p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                {['Student', 'Date', 'Status', 'Check-in', 'Class', 'Remarks', ''].map(h => (
                                    <TableHead key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {paginated.map(r => {
                                const st = STATUSES[r.attendancestatus] ?? STATUSES[1];
                                const name = r.studentname || 'Student';
                                const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                const bg = avatarColor(name);
                                return (
                                    <TableRow key={r.attendanceid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                                        <TableCell className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`${bg} flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white`}>
                                                    {initials}
                                                </div>
                                                <span className="font-semibold text-slate-900 dark:text-slate-100">{r.studentname || '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs font-mono">
                                            {r.date || '—'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <Badge variant={st.variant}>{st.label}</Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 text-xs">
                                            {formatTime(r.checkintime)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs">
                                            {r.classname
                                                ? <>{r.classname}{r.subjectname ? <span className="text-slate-400"> · {r.subjectname}</span> : null}</>
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 text-slate-400 dark:text-slate-500 max-w-[160px] truncate text-xs">
                                            {r.remarks || '—'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}
                                                    className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setToDelete(r.attendanceid)}
                                                    className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="record" onChange={setPage} />
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Record' : 'Add Attendance Record'}</DialogTitle>
                </DialogHeader>
                <AttendanceForm
                    defaultValues={editing ? {
                        studentid:        editing.studentid,
                        date:             editing.date,
                        attendancestatus: STATUSES[editing.attendancestatus]?.label ?? 'Present',
                        checkintime:      editing.checkintime ? formatTime(editing.checkintime) : undefined,
                        classid:          editing.classid   || undefined,
                        subjectid:        editing.subjectid || undefined,
                        remarks:          editing.remarks   || undefined,
                    } : { date: dateFilter }}
                    students={students}
                    classes={classes}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                />
                          </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={o => !o && setToDelete(null)}
                title="Delete record?"
                description="This will permanently remove the attendance record."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
