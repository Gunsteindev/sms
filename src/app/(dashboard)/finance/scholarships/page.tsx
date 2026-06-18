'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Award, TrendingUp, Users, BookOpen, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { AISummary } from '@/components/ui/AISummary';
import { Pagination } from '@/components/ui/Pagination';
import { scholarshipsAPI, academicYearsAPI, studentsAPI } from '@/lib/api-client';

const PAGE_SIZE = 10;
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
    scholarshiptype: z.string().min(1, 'Required'),
    amount:          z.coerce.number().optional(),
    percentage:      z.coerce.number().min(0).max(100).optional(),
    startdate:       z.string().min(1, 'Required'),
    enddate:         z.string().optional(),
    studentid:       z.string().optional(),
    academicyearid:  z.string().optional(),
});
type FormData = z.infer<typeof schema>;


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

const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

interface StudentOption { id: string; name: string; }

function ScholarshipForm({ defaultValues, academicYears, students, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    academicYears: AcademicYear[];
    students: StudentOption[];
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: defaultValues ?? { scholarshiptype: 'Full' },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

            {/* ── Scholarship Details ── */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Scholarship Details</p>
                <div className="space-y-4">
                    <F id="name" label="Name *" error={errors.name?.message}>
                        <Input id="name" {...register('name')} placeholder="e.g. Presidential Merit Scholarship" />
                    </F>
                    <F id="sponsoredby" label="Sponsored By">
                        <Input id="sponsoredby" {...register('sponsoredby')} placeholder="e.g. Ministry of Education, Ghana" />
                    </F>
                    <F id="condition" label="Terms / Conditions">
                        <Textarea id="condition" {...register('condition')} rows={3}
                            placeholder="Describe the eligibility criteria and renewal conditions…" />
                    </F>
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* ── Assignment ── */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Assignment</p>
                <div className="grid grid-cols-2 gap-4">
                    <F id="scholarshiptype" label="Type *" error={errors.scholarshiptype?.message}>
                        <Controller name="scholarshiptype" control={control} render={({ field }) => (
                            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                                <SelectTrigger id="scholarshiptype" className={ST}>
                                    <SelectValue>{field.value || '— Select type —'}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(SCHOLARSHIP_TYPES).map(([k, v]) => (
                                        <SelectItem key={k} value={v}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                    <F id="academicyearid" label="Academic Year">
                        <Controller name="academicyearid" control={control} render={({ field }) => (
                            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                                <SelectTrigger id="academicyearid" className={ST}>
                                    <SelectValue>
                                        {field.value
                                            ? (academicYears.find(ay => ay.academicyearid === field.value)?.name ?? '— None —')
                                            : '— None —'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">— None —</SelectItem>
                                    {academicYears.map(ay => (
                                        <SelectItem key={ay.academicyearid} value={ay.academicyearid}>{ay.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                    <F id="amount" label="Amount (GHS)">
                        <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="0.00" />
                    </F>
                    <F id="percentage" label="Coverage (%)">
                        <Input id="percentage" type="number" step="0.1" min="0" max="100" {...register('percentage')} placeholder="0–100" />
                    </F>
                    <F id="startdate" label="Start Date *" error={errors.startdate?.message}>
                        <Controller control={control} name="startdate" render={({ field }) => (
                            <DatePicker id="startdate" value={field.value} onChange={field.onChange} placeholder="Select date" />
                        )} />
                    </F>
                    <F id="enddate" label="End Date">
                        <Controller control={control} name="enddate" render={({ field }) => (
                            <DatePicker id="enddate" value={field.value} onChange={field.onChange} placeholder="Select date" />
                        )} />
                    </F>
                </div>
                <F id="studentid" label="Student">
                    <Controller name="studentid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger id="studentid" className={ST}>
                                <SelectValue>
                                    {field.value
                                        ? (students.find(s => s.id === field.value)?.name ?? '— None —')
                                        : '— None —'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">— None —</SelectItem>
                                {students.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    )} />
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
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [page, setPage]           = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Scholarship | null>(null);
    const [toDelete, setToDelete]   = useState<Scholarship | null>(null);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [students, setStudents]           = useState<StudentOption[]>([]);

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
            const [schRes, ayRes, sRes]: any[] = await Promise.all([
                scholarshipsAPI.getAll(),
                academicYearsAPI.getAll(),
                studentsAPI.getAll({ pageSize: 1000 }),
            ]);
            setRows(schRes.data ?? []);
            setAcademicYears(ayRes.data ?? []);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setStudents((sRes.data ?? []).map((s: any) => ({ id: s.studentid, name: s.fullname || `${s.firstname} ${s.lastname}`.trim() })));
        } catch { toast.error('Failed to load scholarships'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return q
            ? rows.filter(r =>
                `${r.name} ${r.studentname} ${r.condition} ${r.sponsoredby} ${r.academicyearname}`
                    .toLowerCase().includes(q))
            : rows;
    }, [search, rows]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await scholarshipsAPI.update(editing.scholarshipid, { ...data, scholarshiptype: Object.entries(SCHOLARSHIP_TYPES).find(([,v])=>v===data.scholarshiptype)?.[0] ? Number(Object.entries(SCHOLARSHIP_TYPES).find(([,v])=>v===data.scholarshiptype)![0]) : 922330000 });
                toast.success('Scholarship updated');
            } else {
                await scholarshipsAPI.create({ ...data, scholarshiptype: Object.entries(SCHOLARSHIP_TYPES).find(([,v])=>v===data.scholarshiptype)?.[0] ? Number(Object.entries(SCHOLARSHIP_TYPES).find(([,v])=>v===data.scholarshiptype)![0]) : 922330000 });
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
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Scholarship
                    </Button>
                </div>
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
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                {['Scholarship', 'Terms / Conditions', 'Type', 'Value', 'Sponsored By', 'Student', 'Period', 'Acad. Year', ''].map(h => (
                                    <TableHead key={h}>
                                        {h}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(r => (
                                <TableRow key={r.scholarshipid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">

                                    {/* Name */}
                                    <TableCell className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                                <Award className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                            </div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">{r.name}</p>
                                        </div>
                                    </TableCell>

                                    {/* Terms / Conditions */}
                                    <TableCell className="px-4 py-3.5">
                                        {r.condition
                                            ? <span className="text-slate-600 dark:text-slate-300 truncate max-w-[220px] block" title={r.condition}>{r.condition}</span>
                                            : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </TableCell>

                                    {/* Type */}
                                    <TableCell className="px-4 py-3.5">
                                        <Badge variant={TYPE_VARIANT[r.scholarshiptype] ?? 'outline'}>
                                            {SCHOLARSHIP_TYPES[r.scholarshiptype] ?? '—'}
                                        </Badge>
                                    </TableCell>

                                    {/* Value */}
                                    <TableCell className="px-4 py-3.5">
                                        {fmtCurrency(r.amount)
                                            ? <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fmtCurrency(r.amount)}</span>
                                            : r.percentage
                                                ? <span className="font-mono text-slate-700 dark:text-slate-300">{r.percentage}%</span>
                                                : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </TableCell>

                                    {/* Sponsored by */}
                                    <TableCell className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs max-w-[160px] truncate" title={r.sponsoredby || undefined}>
                                        {r.sponsoredby || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}
                                    </TableCell>

                                    {/* Student */}
                                    <TableCell className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                        {r.studentname || <span className="text-slate-300 dark:text-slate-600 italic text-xs">Unassigned</span>}
                                    </TableCell>

                                    {/* Period */}
                                    <TableCell className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {fmtDate(r.startdate)}
                                        {r.enddate && <> <span className="text-slate-300 dark:text-slate-600">→</span> {fmtDate(r.enddate)}</>}
                                    </TableCell>

                                    {/* Academic year */}
                                    <TableCell className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                                        {r.academicyearname || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="px-4 py-3.5">
                                        <div className="flex justify-end gap-0.5">
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="scholarship" onChange={setPage} />
                </div>
            )}

            {/* ── Modal ──────────────────────────────────────────────────── */}
            <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? `Edit — ${editing.name}` : 'Add Scholarship'}</DialogTitle>
                </DialogHeader>
                <ScholarshipForm
                    defaultValues={editing ? {
                        name:            editing.name,
                        condition:       editing.condition   || undefined,
                        sponsoredby:     editing.sponsoredby || undefined,
                        scholarshiptype: SCHOLARSHIP_TYPES[editing.scholarshiptype] ?? 'Full',
                        amount:          editing.amount      || undefined,
                        percentage:      editing.percentage  || undefined,
                        startdate:       editing.startdate?.slice(0, 10),
                        enddate:         editing.enddate?.slice(0, 10) || undefined,
                        studentid:       editing.studentid   || undefined,
                        academicyearid:  editing.academicyearid || undefined,
                    } : undefined}
                    academicYears={academicYears}
                    students={students}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                />
                          </DialogContent>
            </Dialog>

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
