'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, CalendarDays, Clock, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInWeeks, isAfter, isBefore, isToday } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { termsAPI, academicYearsAPI } from '@/lib/api-client';
import { Pagination } from '@/components/ui/Pagination';
import type { Term } from '@/lib/dataverse/terms';
import type { AcademicYear } from '@/lib/dataverse/academicyears';

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
    if (!d) return '—';
    try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}

function termStatus(startdate: string, enddate: string): { label: string; variant: 'success' | 'info' | 'default' } {
    if (!startdate || !enddate) return { label: 'Unknown', variant: 'default' };
    const now   = new Date();
    const start = new Date(startdate);
    const end   = new Date(enddate);
    if (isBefore(now, start)) return { label: 'Upcoming', variant: 'info' };
    if (isAfter(now, end))    return { label: 'Past',     variant: 'default' };
    return { label: 'Active', variant: 'success' };
}

function termDuration(startdate: string, enddate: string): string {
    if (!startdate || !enddate) return '—';
    try {
        const w = differenceInWeeks(new Date(enddate), new Date(startdate));
        return w === 1 ? '1 week' : `${w} weeks`;
    } catch { return '—'; }
}

// ── Form ──────────────────────────────────────────────────────────────────────
const schema = z.object({
    name:           z.string().min(1, 'Required'),
    startdate:      z.string().min(1, 'Required'),
    enddate:        z.string().min(1, 'Required'),
    academicyearid: z.string().optional(),
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

function TermForm({ defaultValues, academicYears, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    academicYears: AcademicYear[];
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: defaultValues ?? {},
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <F id="name" label="Term Name *" error={errors.name?.message}>
                <Input id="name" {...register('name')} placeholder="e.g. Term 1, First Semester" />
            </F>
            <F id="academicyearid" label="Academic Year">
                <Controller name="academicyearid" control={control} render={({ field }) => (
                    <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger id="academicyearid" className={ST}>
                            <SelectValue>
                                {field.value
                                    ? (academicYears.find(y => y.academicyearid === field.value)?.name ?? '— Select academic year —')
                                    : '— Select academic year —'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">— Select academic year —</SelectItem>
                            {academicYears.map(y => (
                                <SelectItem key={y.academicyearid} value={y.academicyearid}>{y.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                )} />
            </F>
            <div className="grid grid-cols-2 gap-3">
                <F id="startdate" label="Start Date *" error={errors.startdate?.message}>
                    <Controller control={control} name="startdate" render={({ field }) => (
                        <DatePicker id="startdate" value={field.value} onChange={field.onChange} placeholder="Select date" />
                    )} />
                </F>
                <F id="enddate" label="End Date *" error={errors.enddate?.message}>
                    <Controller control={control} name="enddate" render={({ field }) => (
                        <DatePicker id="enddate" value={field.value} onChange={field.onChange} placeholder="Select date" />
                    )} />
                </F>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save Term'}
                </Button>
            </div>
        </form>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TermsPage() {
    const [rows, setRows]               = useState<Term[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [filterYear, setFilterYear]   = useState('');
    const [page, setPage]               = useState(1);
    const [modalOpen, setModalOpen]     = useState(false);
    const [editing, setEditing]         = useState<Term | null>(null);
    const [toDelete, setToDelete]       = useState<Term | null>(null);

    const stats = useMemo(() => {
        const active   = rows.filter(r => termStatus(r.startdate, r.enddate).label === 'Active').length;
        const upcoming = rows.filter(r => termStatus(r.startdate, r.enddate).label === 'Upcoming').length;
        const withAY   = rows.filter(r => !!r.academicyearid).length;
        return { total: rows.length, active, upcoming, withAY };
    }, [rows]);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [termsRes, yearsRes]: any[] = await Promise.all([
                termsAPI.getAll(),
                academicYearsAPI.getAll(),
            ]);
            setRows(termsRes.data ?? []);
            setAcademicYears(yearsRes.data ?? []);
        } catch { toast.error('Failed to load terms'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search, filterYear]);

    const filtered = useMemo(() => {
        let list = rows;
        if (search)     list = list.filter(r => `${r.name} ${r.academicyearname}`.toLowerCase().includes(search.toLowerCase()));
        if (filterYear) list = list.filter(r => r.academicyearid === filterYear);
        return list;
    }, [search, filterYear, rows]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await termsAPI.update(editing.termid, data);
                toast.success('Term updated');
            } else {
                await termsAPI.create(data);
                toast.success('Term created');
            }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save term'); }
    };

    const handleDelete = async (id: string) => {
        try { await termsAPI.delete(id); toast.success('Term deleted'); load(); }
        catch { toast.error('Failed to delete term'); }
    };

    const openEdit   = (r: Term) => { setEditing(r); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    return (
        <div className="space-y-5">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Terms</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : `${rows.length} term${rows.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Term
                    </Button>
                </div>
            </div>

            {/* ── Stats cards ────────────────────────────────────────────── */}
            {!loading && rows.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    {([
                        { icon: CalendarDays, label: 'Total Terms',    value: stats.total,    bg: 'bg-indigo-50 dark:bg-indigo-900/30',   fg: 'text-indigo-600 dark:text-indigo-400' },
                        { icon: CheckCircle2, label: 'Active',         value: stats.active,   bg: 'bg-emerald-50 dark:bg-emerald-900/30', fg: 'text-emerald-600 dark:text-emerald-400' },
                        { icon: Clock,        label: 'Upcoming',       value: stats.upcoming, bg: 'bg-amber-50 dark:bg-amber-900/30',     fg: 'text-amber-600 dark:text-amber-400' },
                        { icon: Calendar,     label: 'With Acad. Year',value: stats.withAY,   bg: 'bg-sky-50 dark:bg-sky-900/30',         fg: 'text-sky-600 dark:text-sky-400' },
                    ] as const).map(({ icon: Icon, label, value, bg, fg }) => (
                        <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${bg} ${fg}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filters ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search terms…"
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <SelectRoot value={filterYear} onValueChange={v => setFilterYear(v ?? '')}>
                    <SelectTrigger className="w-48 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                        <SelectValue>
                            {filterYear
                                ? (academicYears.find(y => y.academicyearid === filterYear)?.name ?? 'All academic years')
                                : 'All academic years'}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All academic years</SelectItem>
                        {academicYears.map(y => (
                            <SelectItem key={y.academicyearid} value={y.academicyearid}>{y.name}</SelectItem>
                        ))}
                    </SelectContent>
                </SelectRoot>
                {(search || filterYear) && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* ── Table ──────────────────────────────────────────────────── */}
            {loading ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-indigo-500" />
                </div>
            ) : !filtered.length ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <CalendarDays className="h-7 w-7 text-slate-400 opacity-50" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {search || filterYear ? 'No terms match the current filters' : 'No terms yet'}
                    </p>
                    {!search && !filterYear && (
                        <Button className="mt-4" size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add your first term
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                {['Term', 'Academic Year', 'Start Date', 'End Date', 'Duration', 'Status', ''].map(h => (
                                    <TableHead key={h}>
                                        {h}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(r => {
                                const status = termStatus(r.startdate, r.enddate);
                                return (
                                    <TableRow key={r.termid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">

                                        {/* Term name */}
                                        <TableCell className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                                    <CalendarDays className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                                                </div>
                                                <span className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</span>
                                            </div>
                                        </TableCell>

                                        {/* Academic year */}
                                        <TableCell className="px-4 py-3.5">
                                            {r.academicyearname
                                                ? <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">{r.academicyearname}</span>
                                                : <span className="text-slate-300 dark:text-slate-600 text-xs italic">—</span>
                                            }
                                        </TableCell>

                                        {/* Start date */}
                                        <TableCell className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {fmtDate(r.startdate)}
                                        </TableCell>

                                        {/* End date */}
                                        <TableCell className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {fmtDate(r.enddate)}
                                        </TableCell>

                                        {/* Duration */}
                                        <TableCell className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {termDuration(r.startdate, r.enddate)}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="px-4 py-3.5">
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </TableCell>

                                        {/* Actions — visible on hover */}
                                        <TableCell className="px-4 py-3.5">
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
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="term" onChange={setPage} />
                </div>
            )}

            {/* ── Modal ──────────────────────────────────────────────────── */}
            <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? `Edit — ${editing.name}` : 'Add Term'}</DialogTitle>
                </DialogHeader>
                <TermForm
                    academicYears={academicYears}
                    defaultValues={editing ? {
                        name:           editing.name,
                        startdate:      editing.startdate?.slice(0, 10),
                        enddate:        editing.enddate?.slice(0, 10),
                        academicyearid: editing.academicyearid || undefined,
                    } : undefined}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                />
                          </DialogContent>
            </Dialog>

            {/* ── Delete confirm ─────────────────────────────────────────── */}
            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={o => !o && setToDelete(null)}
                title="Delete term?"
                description={`"${toDelete?.name}" will be permanently removed from Dataverse.`}
                onConfirm={() => {
                    if (toDelete) { handleDelete(toDelete.termid); setToDelete(null); }
                }}
            />
        </div>
    );
}
