'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Building2, UserCheck, UserX, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/Modal';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import type { Department } from '@/lib/dataverse/departments';
import { AISummary } from '@/components/ui/AISummary';
import { departmentsAPI, teachersAPI } from '@/lib/api-client';

const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'bg-sky-100    text-sky-700    dark:bg-sky-900/40    dark:text-sky-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
    'bg-rose-100   text-rose-700   dark:bg-rose-900/40   dark:text-rose-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'bg-teal-100   text-teal-700   dark:bg-teal-900/40   dark:text-teal-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
];

function deptColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function hodInitials(fullName: string) {
    return fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
    try { return format(new Date(iso), 'dd MMM yyyy'); }
    catch { return '—'; }
}

interface TeacherOption { id: string; name: string; }

const schema = z.object({
    name:        z.string().min(1, 'Department name is required'),
    description: z.string().optional(),
    hodid:       z.string().optional(),
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

function DepartmentForm({ defaultValues, teachers, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    teachers: TeacherOption[];
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues,
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <F id="name" label="Department Name *" error={errors.name?.message}>
                <Input id="name" {...register('name')} placeholder="e.g. Science Department" />
            </F>
            <F id="description" label="Description"
               hint="Briefly describe the department's scope and responsibilities.">
                <textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                    placeholder="e.g. Covers physics, chemistry, and biology…"
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 resize-none"
                />
            </F>
            <F id="hodid" label="Head of Department">
                <Controller name="hodid" control={control} render={({ field }) => (
                    <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger id="hodid"><SelectValue placeholder="— None —" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">— None —</SelectItem>
                            {teachers.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                )} />
                {teachers.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">No teachers loaded — HoD can be assigned later.</p>
                )}
            </F>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save Department'}
                </Button>
            </div>
        </form>
    );
}

export default function DepartmentsPage() {
    const [rows, setRows]           = useState<Department[]>([]);
    const [filtered, setFiltered]   = useState<Department[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Department | null>(null);
    const [toDelete, setToDelete]   = useState<Department | null>(null);
    const [teachers, setTeachers]   = useState<TeacherOption[]>([]);

    const stats = useMemo(() => ({
        total:      rows.length,
        withHod:    rows.filter(r => r.hodid).length,
        withoutHod: rows.filter(r => !r.hodid).length,
    }), [rows]);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await departmentsAPI.getAll();
            const data = res.data ?? [];
            setRows(data);
            setFiltered(data);
        } catch {
            toast.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const loadTeachers = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await teachersAPI.getAll();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setTeachers((res.data ?? []).map((t: any) => ({
                id: t.teacherid,
                name: `${t.firstname} ${t.lastname}`,
            })));
        } catch { /* non-fatal */ }
    };

    useEffect(() => { load(); loadTeachers(); }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(q
            ? rows.filter(r => `${r.name} ${r.description} ${r.hodname}`.toLowerCase().includes(q))
            : rows
        );
    }, [search, rows]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await departmentsAPI.update(editing.departmentid, data);
                toast.success('Department updated');
            } else {
                await departmentsAPI.create(data);
                toast.success('Department created');
            }
            setModalOpen(false);
            setEditing(null);
            load();
        } catch {
            toast.error('Failed to save department');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await departmentsAPI.delete(id);
            toast.success('Department deleted');
            load();
        } catch {
            toast.error('Failed to delete department');
        }
    };

    const openEdit   = (r: Department) => { setEditing(r); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    return (
        <div className="space-y-5">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Departments</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : `${rows.length} department${rows.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Department
                </Button>
            </div>

            {/* ── Stats cards ──────────────────────────────────────────────── */}
            {!loading && rows.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {([
                        { icon: Building2, label: 'Total Departments', value: stats.total,      bg: 'bg-violet-50 dark:bg-violet-900/30', fg: 'text-violet-600 dark:text-violet-400' },
                        { icon: UserCheck, label: 'HoD Assigned',      value: stats.withHod,    bg: 'bg-emerald-50 dark:bg-emerald-900/30', fg: 'text-emerald-600 dark:text-emerald-400' },
                        { icon: UserX,     label: 'No HoD Yet',        value: stats.withoutHod, bg: 'bg-amber-50 dark:bg-amber-900/30',   fg: 'text-amber-600 dark:text-amber-400' },
                    ] as const).map(({ icon: Icon, label, value, bg, fg }) => (
                        <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${bg} ${fg}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── AI Summary ───────────────────────────────────────────────── */}
            <AISummary type="departments" getData={() => ({ total: rows.length, departments: rows })} />

            {/* ── Search ───────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by name, description or HoD…"
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {search && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* ── Table ────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-violet-600" />
                </div>
            ) : !filtered.length ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <Building2 className="h-7 w-7 text-slate-400 opacity-50" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {search ? `No departments match "${search}"` : 'No departments yet'}
                    </p>
                    {!search && (
                        <Button className="mt-4" size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add your first department
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                {['Department', 'Head of Department', 'Status', 'Created', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map(r => {
                                const color    = deptColor(r.name);
                                const initials = r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                                return (
                                    <tr key={r.departmentid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">

                                        {/* Department + description subtitle */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-start gap-2.5">
                                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${color}`}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">{r.name}</p>
                                                    {r.description && (
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[280px] mt-0.5" title={r.description}>
                                                            {r.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* HoD with mini avatar */}
                                        <td className="px-4 py-3.5">
                                            {r.hodname ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                                                        {hodInitials(r.hodname)}
                                                    </div>
                                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{r.hodname}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-600 italic text-xs">Unassigned</span>
                                            )}
                                        </td>

                                        {/* Status badge */}
                                        <td className="px-4 py-3.5">
                                            {r.hodid
                                                ? <Badge variant="success">Active</Badge>
                                                : <Badge variant="warning">Needs HoD</Badge>}
                                        </td>

                                        {/* Created date */}
                                        <td className="px-4 py-3.5">
                                            {r.createdon ? (
                                                <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                                                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                                    {fmtDate(r.createdon)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600">—</span>
                                            )}
                                        </td>

                                        {/* Actions — visible on row hover */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                                    onClick={() => openEdit(r)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                                                    onClick={() => setToDelete(r)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
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

            {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editing ? `Edit — ${editing.name}` : 'Add Department'}
            >
                <DepartmentForm
                    defaultValues={editing ? {
                        name:        editing.name,
                        description: editing.description || undefined,
                        hodid:       editing.hodid       || undefined,
                    } : undefined}
                    teachers={teachers}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            {/* ── Delete Confirm ───────────────────────────────────────────── */}
            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={o => !o && setToDelete(null)}
                title="Delete department?"
                description={`"${toDelete?.name}" will be permanently removed from Dataverse.`}
                onConfirm={() => {
                    if (toDelete) { handleDelete(toDelete.departmentid); setToDelete(null); }
                }}
            />
        </div>
    );
}
