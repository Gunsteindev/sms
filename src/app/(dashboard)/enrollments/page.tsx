'use client';

import { useEffect, useState } from 'react';
import {
    Plus, Search, Pencil, Trash2, ClipboardList,
    GraduationCap, Hash, Calendar, BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/Modal';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import type { Enrollment } from '@/lib/dataverse/enrollments';
import { ENROLLMENT_STATUS } from '@/lib/dataverse/enrollments';
import { AISummary } from '@/components/ui/AISummary';
import { enrollmentsAPI, studentsAPI, classesAPI, academicYearsAPI } from '@/lib/api-client';

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'error'> = {
    1: 'success',
    2: 'warning',
    3: 'error',
};

function avatarColor(name: string) {
    const colors = [
        'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
        'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
    ];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
}

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
            <Label htmlFor={id} className="text-slate-700 dark:text-slate-300 text-sm font-medium">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
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
                {/* Student */}
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

                {/* Class */}
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

                {/* Academic Year */}
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

                {/* Roll Number */}
                <F id="rollnumber" label="Roll Number" error={errors.rollnumber?.message}>
                    <Input id="rollnumber" {...register('rollnumber')} placeholder="e.g. STU2024001" />
                </F>

                {/* Enrollment Date */}
                <F id="enrollmentdate" label="Enrollment Date *" error={errors.enrollmentdate?.message}>
                    <Input id="enrollmentdate" {...register('enrollmentdate')} type="date" />
                </F>

                {/* Status */}
                <F id="enrollmentstatus" label="Status" error={errors.enrollmentstatus?.message}>
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

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save Enrollment'}
                </Button>
            </div>
        </form>
    );
}

export default function EnrollmentsPage() {
    const [rows, setRows]           = useState<Enrollment[]>([]);
    const [filtered, setFiltered]   = useState<Enrollment[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Enrollment | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);

    // Dropdown options
    const [students, setStudents] = useState<Option[]>([]);
    const [classes, setClasses]   = useState<Option[]>([]);
    const [years, setYears]       = useState<Option[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await enrollmentsAPI.getAll();
            const data = res.data ?? [];
            setRows(data);
            setFiltered(data);
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setStudents((sr.data ?? []).map((s: any) => ({ id: s.studentid, name: `${s.firstname} ${s.lastname}` })));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setClasses((cr.data ?? []).map((c: any) => ({ id: c.classid, name: c.name })));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setYears((yr.data ?? []).map((y: any) => ({ id: y.academicyearid, name: y.name })));
        } catch {
            // non-fatal; dropdowns fallback to empty
        }
    };

    useEffect(() => { load(); loadDropdowns(); }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            q ? rows.filter(r =>
                `${r.studentname} ${r.classname} ${r.rollnumber} ${r.academicyearname}`.toLowerCase().includes(q)
            ) : rows
        );
    }, [search, rows]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
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
            toast.error('Failed to delete');
        }
    };

    const openEdit = (r: Enrollment) => {
        setEditing(r);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditing(null); };

    // Stats
    const activeCount    = rows.filter(r => r.enrollmentstatus === 1).length;
    const completedCount = rows.filter(r => r.enrollmentstatus === 2).length;
    const droppedCount   = rows.filter(r => r.enrollmentstatus === 3).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Enrollments</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {rows.length} total · {activeCount} active · {completedCount} completed · {droppedCount} dropped
                    </p>
                </div>
                <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1.5" /> Enroll Student
                </Button>
            </div>

            {/* AI Summary */}
            <AISummary
                type="enrollments"
                getData={() => ({ total: rows.length, active: activeCount, completed: completedCount, dropped: droppedCount, enrollments: rows.slice(0, 30) })}
            />

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Search by student, class, roll…"
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                </div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                    <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">{search ? 'No enrollments match your search' : 'No enrollments yet'}</p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-left">
                                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Student</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Class</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Academic Year</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Roll #</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map(r => {
                                const initials = r.studentname
                                    ? r.studentname.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                    : '??';
                                const bg = avatarColor(r.studentname || r.enrollmentid);
                                return (
                                    <tr key={r.enrollmentid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        {/* Student */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`${bg} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-slate-100 leading-tight">{r.studentname || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Class */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                {r.classname || '—'}
                                            </div>
                                        </td>
                                        {/* Academic Year */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                {r.academicyearname || '—'}
                                            </div>
                                        </td>
                                        {/* Roll # */}
                                        <td className="px-4 py-3">
                                            {r.rollnumber ? (
                                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                                    <Hash className="h-3 w-3 text-slate-400" />
                                                    {r.rollnumber}
                                                </div>
                                            ) : <span className="text-slate-400">—</span>}
                                        </td>
                                        {/* Date */}
                                        <td className="px-4 py-3">
                                            {r.enrollmentdate ? (
                                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    {r.enrollmentdate}
                                                </div>
                                            ) : <span className="text-slate-400">—</span>}
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_VARIANT[r.enrollmentstatus] ?? 'default'}>
                                                {ENROLLMENT_STATUS[r.enrollmentstatus] ?? r.enrollmentstatusname}
                                            </Badge>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                                                    <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setToDelete(r.enrollmentid)}>
                                                    <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Enrollment' : 'Enroll Student'}
            >
                <EnrollmentForm
                    defaultValues={editing ? {
                        studentid:        editing.studentid,
                        classid:          editing.classid,
                        academicyearid:   editing.academicyearid,
                        rollnumber:       editing.rollnumber,
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

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={o => !o && setToDelete(null)}
                title="Remove enrollment?"
                description="This will permanently delete the enrollment record."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
