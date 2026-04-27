'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, BookMarked, Hash, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
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
import { subjectsAPI, teachersAPI, gradeLevelsAPI } from '@/lib/api-client';
import { SUBJECT_TYPES } from '@/lib/dataverse/subjects';
import type { Subject } from '@/lib/dataverse/subjects';

// sms_type picklist: 922330000=Core, 922330001=Elective, 922330002=Extra
const TYPE_OPTIONS = [
    { label: 'Core',     value: 922330000 },
    { label: 'Elective', value: 922330001 },
    { label: 'Extra',    value: 922330002 },
];
// Convert label → numeric value
const labelToType = (label?: string): number | undefined => {
    if (!label) return undefined;
    return TYPE_OPTIONS.find(o => o.label.toLowerCase() === label.toLowerCase())?.value;
};

const TYPE_STYLE: Record<number, string> = {
    922330000: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    922330001: 'bg-amber-50  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300',
    922330002: 'bg-slate-100 text-slate-600  dark:bg-slate-800     dark:text-slate-300',
};

const schema = z.object({
    name:         z.string().min(1, 'Required'),
    code:         z.string().min(1, 'Required'),
    credithours:  z.coerce.number().min(0).optional(),
    passscore:    z.coerce.number().min(0).max(100).optional(),
    typeLabel:    z.string().optional(),
    description:  z.string().optional(),
    gradelevelid: z.string().optional(),
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

function SubjectForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [teachers, setTeachers]       = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [gradeLevels, setGradeLevels] = useState<any[]>([]);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teachersAPI.getAll().then((r: any) => setTeachers(r.data ?? [])).catch(() => {});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gradeLevelsAPI.getAll().then((r: any) => setGradeLevels(r.data ?? [])).catch(() => {});
    }, []);

    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
                <F id="name" label="Subject Name *" error={errors.name?.message}>
                    <Input id="name" {...register('name')} placeholder="e.g. Mathematics" />
                </F>
                <F id="code" label="Code *" error={errors.code?.message}>
                    <Input id="code" {...register('code')} placeholder="e.g. MATH101" />
                </F>
                <F id="credithours" label="Credit Hours">
                    <Input id="credithours" {...register('credithours')} type="number" min={0} />
                </F>
                <F id="passscore" label="Pass Score (%)">
                    <Input id="passscore" {...register('passscore')} type="number" min={0} max={100} placeholder="e.g. 50" />
                </F>
                <F id="typeLabel" label="Type">
                    <Controller name="typeLabel" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">— None —</SelectItem>
                                {TYPE_OPTIONS.map(o => (
                                    <SelectItem key={o.value} value={o.label}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="gradelevelid" label="Grade Level">
                    <Controller name="gradelevelid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select grade level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">— None —</SelectItem>
                                {gradeLevels.map((g: any) => (
                                    <SelectItem key={g.gradelevelid} value={g.gradelevelid}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="teacherid" label="Assigned Teacher">
                    <Controller name="teacherid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
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
                <div className="col-span-2">
                    <F id="description" label="Description">
                        <Input id="description" {...register('description')} placeholder="Brief description…" />
                    </F>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Subject'}</Button>
            </div>
        </form>
    );
}

const SUBJECT_COLORS = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
];

function subjectColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length];
}

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [filtered, setFiltered] = useState<Subject[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]   = useState<Subject | null>(null);
    const [toDelete, setToDelete] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await subjectsAPI.getAll();
            const items = res.data ?? [];
            setSubjects(items);
            setFiltered(items);
        } catch {
            toast.error('Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(q
            ? subjects.filter(s =>
                `${s.name} ${s.code} ${s.typelabel} ${s.gradelevelname} ${s.teachername}`
                    .toLowerCase().includes(q))
            : subjects
        );
    }, [search, subjects]);

    const handleSubmit = async (data: FormData) => {
        try {
            // Convert string label back to numeric picklist value
            const payload = {
                ...data,
                type: labelToType(data.typeLabel),
                typeLabel: undefined,
            };
            if (editing) {
                await subjectsAPI.update(editing.subjectid, payload);
                toast.success('Subject updated');
            } else {
                await subjectsAPI.create(payload);
                toast.success('Subject added');
            }
            setModalOpen(false);
            setEditing(null);
            load();
        } catch {
            toast.error('Failed to save subject');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await subjectsAPI.delete(id);
            toast.success('Subject deleted');
            load();
        } catch {
            toast.error('Failed to delete subject');
        }
    };

    const openEdit = (s: Subject) => { setEditing(s); setModalOpen(true); };

    const coreCount     = subjects.filter(s => s.type === 922330000).length;
    const electiveCount = subjects.filter(s => s.type === 922330001).length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Subjects</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : `${subjects.length} subject${subjects.length !== 1 ? 's' : ''}${coreCount ? ` · ${coreCount} core` : ''}${electiveCount ? ` · ${electiveCount} elective` : ''}`}
                    </p>
                </div>
                <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Subject
                </Button>
            </div>

            <AISummary type="subjects" getData={() => ({ total: subjects.length, subjects })} />

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Search by name, code, type…"
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-violet-600" />
                </div>
            ) : !filtered.length ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <BookMarked className="h-7 w-7 opacity-50" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {search ? `No subjects match "${search}"` : 'No subjects found'}
                    </p>
                    {!search && <p className="text-xs mt-1">Add a subject to get started</p>}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                {['Subject', 'Code', 'Type', 'Grade Level', 'Teacher', 'Hrs', 'Pass', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map(s => (
                                <tr key={s.subjectid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                    {/* Subject name */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${subjectColor(s.name)}`}>
                                                {s.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</p>
                                                {s.description && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[180px]">{s.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    {/* Code */}
                                    <td className="px-4 py-3.5">
                                        {s.code
                                            ? <span className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5">
                                                <Hash className="h-2.5 w-2.5" />{s.code}
                                              </span>
                                            : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </td>
                                    {/* Type */}
                                    <td className="px-4 py-3.5">
                                        {s.type !== null && s.typelabel
                                            ? <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLE[s.type] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                {s.typelabel}
                                              </span>
                                            : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </td>
                                    {/* Grade level */}
                                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                        {s.gradelevelname || <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </td>
                                    {/* Teacher */}
                                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                        {s.teachername || <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </td>
                                    {/* Credit hours */}
                                    <td className="px-4 py-3.5">
                                        {s.credithours
                                            ? <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />{s.credithours}
                                              </span>
                                            : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </td>
                                    {/* Pass score */}
                                    <td className="px-4 py-3.5">
                                        {s.passscore !== null && s.passscore !== undefined
                                            ? <span className="text-slate-600 dark:text-slate-300">{s.passscore}%</span>
                                            : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </td>
                                    {/* Actions */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(s)}
                                                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                                <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(s.subjectid)}
                                                className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
                                                <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null); }}
                title={editing ? `Edit — ${editing.name}` : 'Add Subject'}
            >
                <SubjectForm
                    defaultValues={editing ? {
                        name:         editing.name,
                        code:         editing.code,
                        credithours:  editing.credithours || undefined,
                        passscore:    editing.passscore   ?? undefined,
                        typeLabel:    editing.typelabel   || undefined,
                        description:  editing.description || undefined,
                        gradelevelid: editing.gradelevelid || undefined,
                        teacherid:    editing.teacherid    || undefined,
                    } : undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => { setModalOpen(false); setEditing(null); }}
                />
            </Modal>

            {/* Delete confirm */}
            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={o => !o && setToDelete(null)}
                title="Delete subject?"
                description="This will permanently remove the subject record from Dataverse."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
