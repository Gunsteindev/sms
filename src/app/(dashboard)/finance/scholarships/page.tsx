'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Award, TrendingUp, Users, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AISummary } from '@/components/ui/AISummary';
import { scholarshipsAPI, academicYearsAPI } from '@/lib/api-client';
import type { Scholarship } from '@/lib/dataverse/scholarships';
import type { AcademicYear } from '@/lib/dataverse/academicyears';
import { SCHOLARSHIP_TYPES } from '@/lib/dataverse/scholarships';

// sms_type picklist: 922330000=Full, 922330001=Partial, 922330002=Bursary
const TYPE_VARIANT: Record<number, 'info' | 'success' | 'outline' | 'warning'> = {
    922330000: 'success',  // Full
    922330001: 'info',     // Partial
    922330002: 'warning',  // Bursary
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
    if (!d) return '—';
    try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}

function fmtCurrency(n: number) {
    if (!n) return null;
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(n);
}

// ── Form ──────────────────────────────────────────────────────────────────────
const schema = z.object({
    name:            z.string().min(1, 'Required'),
    condition:       z.string().optional(),
    sponsoredby:     z.string().optional(),
    scholarshiptype: z.coerce.number(),
    amount:          z.coerce.number().optional(),
    percentage:      z.coerce.number().min(0).max(100).optional(),
    startdate:       z.string().min(1, 'Required'),
    enddate:         z.string().optional(),
    studentid:       z.string().optional(),
    academicyearid:  z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const SELECT_CLS = 'w-full h-9 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400';

function F({ id, label, error, children }: {
    id: string; label: string; error?: string; children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
}

function ScholarshipForm({ defaultValues, academicYears, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    academicYears: AcademicYear[];
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: defaultValues ?? { scholarshiptype: 922330000 },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <F id="name" label="Name *" error={errors.name?.message}>
                <Input id="name" {...register('name')} placeholder="e.g. Presidential Merit Scholarship" />
            </F>
            <F id="condition" label="Terms / Conditions">
                <textarea id="condition" {...register('condition')} rows={3}
                    placeholder="Describe the eligibility criteria and renewal conditions…"
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 resize-none" />
            </F>
            <F id="sponsoredby" label="Sponsored By">
                <Input id="sponsoredby" {...register('sponsoredby')} placeholder="e.g. Ministry of Education, Ghana" />
            </F>
            <F id="scholarshiptype" label="Type *" error={errors.scholarshiptype?.message}>
                <select id="scholarshiptype" {...register('scholarshiptype')} className={SELECT_CLS}>
                    {Object.entries(SCHOLARSHIP_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </F>
            <div className="grid grid-cols-2 gap-3">
                <F id="amount" label="Amount (GHS)">
                    <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="0.00" />
                </F>
                <F id="percentage" label="Coverage (%)">
                    <Input id="percentage" type="number" step="0.1" min="0" max="100" {...register('percentage')} placeholder="0–100" />
                </F>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <F id="startdate" label="Start Date *" error={errors.startdate?.message}>
                    <Input id="startdate" type="date" {...register('startdate')} />
                </F>
                <F id="enddate" label="End Date">
                    <Input id="enddate" type="date" {...register('enddate')} />
                </F>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <F id="studentid" label="Student ID">
                    <Input id="studentid" {...register('studentid')} placeholder="Student GUID (optional)" />
                </F>
                <F id="academicyearid" label="Academic Year">
                    <select id="academicyearid" {...register('academicyearid')} className={SELECT_CLS}>
                        <option value="">— None —</option>
                        {academicYears.map(ay => (
                            <option key={ay.academicyearid} value={ay.academicyearid}>{ay.name}</option>
                        ))}
                    </select>
                </F>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save Scholarship'}
                </Button>
            </div>
        </form>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ScholarshipsPage() {
    const [rows, setRows]           = useState<Scholarship[]>([]);
    const [filtered, setFiltered]   = useState<Scholarship[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Scholarship | null>(null);
    const [toDelete, setToDelete]   = useState<Scholarship | null>(null);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

    const stats = useMemo(() => {
        const full     = rows.filter(r => r.scholarshiptype === 922330000).length;
        const withStudent = rows.filter(r => !!r.studentid).length;
        const totalAmt = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
        return { total: rows.length, full, withStudent, totalAmt };
    }, [rows]);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [schRes, ayRes]: any[] = await Promise.all([
                scholarshipsAPI.getAll(),
                academicYearsAPI.getAll(),
            ]);
            setRows(schRes.data ?? []);
            setFiltered(schRes.data ?? []);
            setAcademicYears(ayRes.data ?? []);
        } catch { toast.error('Failed to load scholarships'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(q
            ? rows.filter(r =>
                `${r.name} ${r.studentname} ${r.condition} ${r.sponsoredby} ${r.academicyearname}`
                    .toLowerCase().includes(q))
            : rows
        );
    }, [search, rows]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await scholarshipsAPI.update(editing.scholarshipid, data);
                toast.success('Scholarship updated');
            } else {
                await scholarshipsAPI.create(data);
                toast.success('Scholarship created');
            }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save scholarship'); }
    };

    const handleDelete = async (id: string) => {
        try { await scholarshipsAPI.delete(id); toast.success('Scholarship deleted'); load(); }
        catch { toast.error('Failed to delete scholarship'); }
    };

    const openEdit   = (r: Scholarship) => { setEditing(r); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    return (
        <div className="space-y-5">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Scholarships</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : `${rows.length} scholarship${rows.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Scholarship
                </Button>
            </div>

            {/* ── Stats cards ────────────────────────────────────────────── */}
            {!loading && rows.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    {([
                        { icon: Award,      label: 'Total',         value: stats.total,                          bg: 'bg-amber-50 dark:bg-amber-900/30',   fg: 'text-amber-600 dark:text-amber-400' },
                        { icon: BookOpen,   label: 'Full Awards',   value: stats.full,                           bg: 'bg-violet-50 dark:bg-violet-900/30', fg: 'text-violet-600 dark:text-violet-400' },
                        { icon: Users,      label: 'With Student',  value: stats.withStudent,                    bg: 'bg-sky-50 dark:bg-sky-900/30',       fg: 'text-sky-600 dark:text-sky-400' },
                        { icon: TrendingUp, label: 'Total Value',   value: fmtCurrency(stats.totalAmt) ?? 'GHS 0', bg: 'bg-emerald-50 dark:bg-emerald-900/30', fg: 'text-emerald-600 dark:text-emerald-400' },
                    ] as const).map(({ icon: Icon, label, value, bg, fg }) => (
                        <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${bg} ${fg}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{value}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── AI Summary ─────────────────────────────────────────────── */}
            <AISummary type="scholarships" getData={() => ({ total: rows.length, scholarships: rows })} />

            {/* ── Search ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by name, student, sponsor…"
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

            {/* ── Table ──────────────────────────────────────────────────── */}
            {loading ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-amber-500" />
                </div>
            ) : !filtered.length ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <Award className="h-7 w-7 text-slate-400 opacity-50" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {search ? `No scholarships match "${search}"` : 'No scholarships yet'}
                    </p>
                    {!search && (
                        <Button className="mt-4" size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add your first scholarship
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                {['Scholarship', 'Type', 'Value', 'Sponsored By', 'Student', 'Period', 'Acad. Year', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map(r => (
                                <tr key={r.scholarshipid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">

                                    {/* Name + condition */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-start gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <Award className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">{r.name}</p>
                                                {r.condition && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[220px] mt-0.5" title={r.condition}>
                                                        {r.condition}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Type */}
                                    <td className="px-4 py-3.5">
                                        <Badge variant={TYPE_VARIANT[r.scholarshiptype] ?? 'outline'}>
                                            {SCHOLARSHIP_TYPES[r.scholarshiptype] ?? '—'}
                                        </Badge>
                                    </td>

                                    {/* Value */}
                                    <td className="px-4 py-3.5">
                                        {fmtCurrency(r.amount)
                                            ? <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fmtCurrency(r.amount)}</span>
                                            : r.percentage
                                                ? <span className="font-mono text-slate-700 dark:text-slate-300">{r.percentage}%</span>
                                                : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </td>

                                    {/* Sponsored by */}
                                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs max-w-[160px] truncate" title={r.sponsoredby || undefined}>
                                        {r.sponsoredby || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}
                                    </td>

                                    {/* Student */}
                                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                        {r.studentname || <span className="text-slate-300 dark:text-slate-600 italic text-xs">Unassigned</span>}
                                    </td>

                                    {/* Period */}
                                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {fmtDate(r.startdate)}
                                        {r.enddate && <> <span className="text-slate-300 dark:text-slate-600">→</span> {fmtDate(r.enddate)}</>}
                                    </td>

                                    {/* Academic year */}
                                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                                        {r.academicyearname || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </td>

                                    {/* Actions — visible on hover */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                                onClick={() => openEdit(r)}>
                                                <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                                                onClick={() => setToDelete(r)}>
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

            {/* ── Modal ──────────────────────────────────────────────────── */}
            <Modal isOpen={modalOpen} onClose={closeModal}
                title={editing ? `Edit — ${editing.name}` : 'Add Scholarship'}>
                <ScholarshipForm
                    defaultValues={editing ? {
                        name:            editing.name,
                        condition:       editing.condition   || undefined,
                        sponsoredby:     editing.sponsoredby || undefined,
                        scholarshiptype: editing.scholarshiptype,
                        amount:          editing.amount      || undefined,
                        percentage:      editing.percentage  || undefined,
                        startdate:       editing.startdate?.slice(0, 10),
                        enddate:         editing.enddate?.slice(0, 10) || undefined,
                        studentid:       editing.studentid   || undefined,
                        academicyearid:  editing.academicyearid || undefined,
                    } : undefined}
                    academicYears={academicYears}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            {/* ── Delete confirm ─────────────────────────────────────────── */}
            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={o => !o && setToDelete(null)}
                title="Delete scholarship?"
                description={`"${toDelete?.name}" will be permanently removed from Dataverse.`}
                onConfirm={() => {
                    if (toDelete) { handleDelete(toDelete.scholarshipid); setToDelete(null); }
                }}
            />
        </div>
    );
}
