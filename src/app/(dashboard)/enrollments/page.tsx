'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Plus, Search, Pencil, Trash2, ClipboardList,
    GraduationCap, Hash, Calendar, BookOpen, Users,
    CheckCircle2, XCircle, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/Modal';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { AISummary } from '@/components/ui/AISummary';
import { enrollmentsAPI, studentsAPI, classesAPI, academicYearsAPI } from '@/lib/api-client';
import type { Enrollment } from '@/lib/dataverse/enrollments';
import { ENROLLMENT_STATUS } from '@/lib/dataverse/enrollments';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<number, { label: string; cls: string }> = {
    1: { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    2: { label: 'Completed', cls: 'bg-sky-50     text-sky-700     dark:bg-sky-900/30     dark:text-sky-300'     },
    3: { label: 'Dropped',   cls: 'bg-rose-50    text-rose-700    dark:bg-rose-900/30    dark:text-rose-300'    },
};

function fmtDate(d: string) {
    if (!d) return '—';
    try { return format(new Date(d), 'd MMM yyyy'); } catch { return d; }
}

function avatarInitials(name: string) {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2))
        .toUpperCase();
}

const AVATAR_COLORS = [
    'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500',   'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
];
function avatarColor(seed: string) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Form ──────────────────────────────────────────────────────────────────────
const schema = z.object({
    studentid:        z.string().min(1, 'Required'),
    classid:          z.string().min(1, 'Required'),
    academicyearid:   z.string().min(1, 'Required'),
    rollnumber:       z.string().optional(),
    enrollmentdate:   z.string().min(1, 'Required'),
    enrollmentstatus: z.coerce.number().default(1),
});
type FormData = z.infer<typeof schema>;
interface Option { id: string; name: string; }

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
}

function EnrollmentForm({ defaultValues, onSubmit, onCancel, students, classes, years }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
    students: Option[];
    classes: Option[];
    years: Option[];
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: { enrollmentstatus: 1, ...defaultValues },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <F id="studentid" label="Student *" error={errors.studentid?.message}>
                        <Controller name="studentid" control={control} render={({ field }) => (
                            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                                <SelectTrigger id="studentid"><SelectValue placeholder="Select student" /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                </div>

                <F id="classid" label="Class *" error={errors.classid?.message}>
                    <Controller name="classid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger id="classid"><SelectValue placeholder="Select class" /></SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>

                <F id="academicyearid" label="Academic Year *" error={errors.academicyearid?.message}>
                    <Controller name="academicyearid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger id="academicyearid"><SelectValue placeholder="Select year" /></SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>

                <F id="enrollmentdate" label="Enrollment Date *" error={errors.enrollmentdate?.message}>
                    <Input id="enrollmentdate" {...register('enrollmentdate')} type="date" />
                </F>

                <F id="rollnumber" label="Roll Number">
                    <Input id="rollnumber" {...register('rollnumber')} placeholder="e.g. STU-2025-001" />
                </F>

                <div className="col-span-2">
                    <F id="enrollmentstatus" label="Status">
                        <Controller name="enrollmentstatus" control={control} render={({ field }) => (
                            <SelectRoot value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                                <SelectTrigger id="enrollmentstatus"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ENROLLMENT_STATUS).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save Enrollment'}
                </Button>
            </div>
        </form>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function EnrollmentsPage() {
    const [rows, setRows]           = useState<Enrollment[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Enrollment | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);

    const [students, setStudents] = useState<Option[]>([]);
    const [classes, setClasses]   = useState<Option[]>([]);
    const [years, setYears]       = useState<Option[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await enrollmentsAPI.getAll();
            setRows(res.data ?? []);
        } catch {
            toast.error('Failed to load enrollments');
        } finally {
            setLoading(false);
        }
    };

    const loadDropdowns = async () => {
        try {
            const [sr, cr, yr] = await Promise.all([
                studentsAPI.getAll() as Promise<any>,
                classesAPI.getAll()  as Promise<any>,
                academicYearsAPI.getAll() as Promise<any>,
            ]);
            setStudents((sr.data ?? []).map((s: any) => ({ id: s.studentid, name: `${s.firstname} ${s.lastname}` })));
            setClasses((cr.data ?? []).map((c: any) => ({ id: c.classid, name: c.classname ?? c.name })));
            setYears((yr.data ?? []).map((y: any) => ({ id: y.academicyearid, name: y.name })));
        } catch { /* non-fatal */ }
    };

    useEffect(() => { load(); loadDropdowns(); }, []);

    const stats = useMemo(() => ({
        total:     rows.length,
        active:    rows.filter(r => r.enrollmentstatus === 1).length,
        completed: rows.filter(r => r.enrollmentstatus === 2).length,
        dropped:   rows.filter(r => r.enrollmentstatus === 3).length,
    }), [rows]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return rows.filter(r => {
            const matchSearch = !q || `${r.studentname} ${r.classname} ${r.rollnumber} ${r.academicyearname}`.toLowerCase().includes(q);
            const matchStatus = statusFilter === 'all' || r.enrollmentstatus === Number(statusFilter);
            return matchSearch && matchStatus;
        });
    }, [rows, search, statusFilter]);

    const handleSubmit = async (data: FormData) => {
        try {
            if (editing) {
                await enrollmentsAPI.update(editing.enrollmentid, data);
                toast.success('Enrollment updated');
            } else {
                await enrollmentsAPI.create(data);
                toast.success('Student enrolled');
            }
            setModalOpen(false);
            setEditing(null);
            load();
        } catch {
            toast.error('Failed to save enrollment');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await enrollmentsAPI.delete(id);
            toast.success('Enrollment removed');
            load();
        } catch {
            toast.error('Failed to delete enrollment');
        }
    };

    const openEdit  = (r: Enrollment) => { setEditing(r); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Enrollments</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : `${stats.total} enrollment${stats.total !== 1 ? 's' : ''} across all classes`}
                    </p>
                </div>
                <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1.5" /> Enroll Student
                </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total',     value: stats.total,     icon: Users,         ring: 'text-indigo-500  dark:text-indigo-400',  bg: 'bg-indigo-50  dark:bg-indigo-900/20'  },
                    { label: 'Active',    value: stats.active,    icon: ClipboardList, ring: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle2,  ring: 'text-sky-500     dark:text-sky-400',     bg: 'bg-sky-50     dark:bg-sky-900/20'     },
                    { label: 'Dropped',   value: stats.dropped,   icon: XCircle,       ring: 'text-rose-500    dark:text-rose-400',    bg: 'bg-rose-50    dark:bg-rose-900/20'    },
                ].map(({ label, value, icon: Icon, ring, bg }) => (
                    <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${ring}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">{loading ? '—' : value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <AISummary
                type="enrollments"
                getData={() => ({ total: stats.total, active: stats.active, completed: stats.completed, dropped: stats.dropped, enrollments: rows.slice(0, 30) })}
            />

            {/* Search + filter */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by student, class, roll…"
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 h-9">
                    <Filter className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="text-sm bg-transparent border-none outline-none text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                        <option value="all">All statuses</option>
                        {Object.entries(ENROLLMENT_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-indigo-600" />
                </div>
            ) : !filtered.length ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <ClipboardList className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {search || statusFilter !== 'all' ? 'No enrollments match your filters' : 'No enrollments yet'}
                    </p>
                    {!search && statusFilter === 'all' && (
                        <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Click "Enroll Student" to get started</p>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                {['Student', 'Class', 'Academic Year', 'Roll #', 'Enrolled', 'Status', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map(r => {
                                const statusCfg = STATUS_CFG[r.enrollmentstatus];
                                const bg = avatarColor(r.studentname || r.enrollmentid);
                                return (
                                    <tr key={r.enrollmentid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        {/* Student */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`${bg} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                                                    {avatarInitials(r.studentname)}
                                                </div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100">{r.studentname || '—'}</p>
                                            </div>
                                        </td>
                                        {/* Class */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                <BookOpen className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                {r.classname || '—'}
                                            </div>
                                        </td>
                                        {/* Academic Year */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                <GraduationCap className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                {r.academicyearname || '—'}
                                            </div>
                                        </td>
                                        {/* Roll # */}
                                        <td className="px-4 py-3.5">
                                            {r.rollnumber
                                                ? <span className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5">
                                                    <Hash className="h-2.5 w-2.5" />{r.rollnumber}
                                                  </span>
                                                : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                        </td>
                                        {/* Date */}
                                        <td className="px-4 py-3.5">
                                            {r.enrollmentdate
                                                ? <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                    {fmtDate(r.enrollmentdate)}
                                                  </div>
                                                : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-3.5">
                                            {statusCfg
                                                ? <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.cls}`}>
                                                    {statusCfg.label}
                                                  </span>
                                                : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                        </td>
                                        {/* Actions */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(r)}
                                                    className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                                    <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setToDelete(r.enrollmentid)}
                                                    className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Footer count */}
                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {filtered.length} of {rows.length} enrollment{rows.length !== 1 ? 's' : ''}
                            {statusFilter !== 'all' && ` · filtered by ${ENROLLMENT_STATUS[Number(statusFilter)]}`}
                        </p>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Enrollment' : 'Enroll Student'}>
                <EnrollmentForm
                    defaultValues={editing ? {
                        studentid:        editing.studentid,
                        classid:          editing.classid,
                        academicyearid:   editing.academicyearid,
                        rollnumber:       editing.rollnumber || undefined,
                        enrollmentdate:   editing.enrollmentdate,
                        enrollmentstatus: editing.enrollmentstatus,
                    } : undefined}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                    students={students}
                    classes={classes}
                    years={years}
                />
            </Modal>

            {/* Delete confirm */}
            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={o => !o && setToDelete(null)}
                title="Remove enrollment?"
                description="This will permanently delete the enrollment record from Dataverse."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
