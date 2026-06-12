'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Layers, Hash, AlignLeft, TrendingUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { gradeLevelsAPI } from '@/lib/api-client';
import { Pagination } from '@/components/ui/Pagination';
import type { GradeLevel } from '@/lib/dataverse/gradelevels';

const PAGE_SIZE = 10;

// ── Form ──────────────────────────────────────────────────────────────────────
const schema = z.object({
    name:        z.string().min(1, 'Required'),
    ordernumber: z.coerce.number().min(0, 'Required'),
    code:        z.string().optional(),
    description: z.string().optional(),
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

function GradeLevelForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues,
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <F id="name" label="Name *" error={errors.name?.message}>
                <Input id="name" {...register('name')} placeholder="e.g. Grade 1, Form 1, Year 7" />
            </F>
            <div className="grid grid-cols-2 gap-3">
                <F id="ordernumber" label="Order Number *" error={errors.ordernumber?.message}>
                    <Input id="ordernumber" type="number" min={0} {...register('ordernumber')} placeholder="e.g. 1" />
                </F>
                <F id="code" label="Code">
                    <Input id="code" {...register('code')} placeholder="e.g. G1, F1" />
                </F>
            </div>
            <F id="description" label="Description">
                <Input id="description" {...register('description')} placeholder="Optional description" />
            </F>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save Grade Level'}
                </Button>
            </div>
        </form>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function orderColour(n: number): string {
    if (n <= 3)  return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    if (n <= 6)  return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300';
    if (n <= 9)  return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300';
    return           'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300';
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GradeLevelsPage() {
    const [rows, setRows]           = useState<GradeLevel[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [page, setPage]           = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<GradeLevel | null>(null);
    const [toDelete, setToDelete]   = useState<GradeLevel | null>(null);

    const stats = useMemo(() => {
        const withDesc = rows.filter(r => !!r.description).length;
        const sorted   = [...rows].sort((a, b) => a.ordernumber - b.ordernumber);
        const first    = sorted[0]                    ?? null;
        const last     = sorted[sorted.length - 1]   ?? null;
        return { total: rows.length, withDesc, first, last };
    }, [rows]);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await gradeLevelsAPI.getAll();
            setRows(res.data ?? []);
        } catch { toast.error('Failed to load grade levels'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return q
            ? rows.filter(r =>
                `${r.name} ${r.code} ${r.description}`
                    .toLowerCase().includes(q) || String(r.ordernumber).includes(q))
            : rows;
    }, [search, rows]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await gradeLevelsAPI.update(editing.gradelevelid, data);
                toast.success('Grade level updated');
            } else {
                await gradeLevelsAPI.create(data);
                toast.success('Grade level created');
            }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save grade level'); }
    };

    const handleDelete = async (id: string) => {
        try { await gradeLevelsAPI.delete(id); toast.success('Grade level deleted'); load(); }
        catch { toast.error('Failed to delete grade level'); }
    };

    const openEdit   = (r: GradeLevel) => { setEditing(r); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    return (
        <div className="space-y-5">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Grade Levels</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : `${rows.length} grade level${rows.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Grade Level
                    </Button>
                </div>
            </div>

            {/* ── Stats cards ────────────────────────────────────────────── */}
            {!loading && rows.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Grades</p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <Hash className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                {stats.first ? stats.first.name : '—'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">First Grade</p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                {stats.last ? stats.last.name : '—'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Last Grade</p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                            <AlignLeft className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.withDesc}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">With Description</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Search ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by name, code or order…"
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
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-violet-500" />
                </div>
            ) : !filtered.length ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <Layers className="h-7 w-7 text-slate-400 opacity-50" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {search ? `No grade levels match "${search}"` : 'No grade levels yet'}
                    </p>
                    {!search && (
                        <Button className="mt-4" size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add your first grade level
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                {['Order', 'Grade Name', 'Code', 'Description', ''].map(h => (
                                    <TableHead key={h}>
                                        {h}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(r => (
                                <TableRow key={r.gradelevelid} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">

                                    {/* Order badge */}
                                    <TableCell className="px-4 py-3.5 w-20">
                                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${orderColour(r.ordernumber)}`}>
                                            {r.ordernumber}
                                        </span>
                                    </TableCell>

                                    {/* Name */}
                                    <TableCell className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                                <Layers className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                                            </div>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</span>
                                        </div>
                                    </TableCell>

                                    {/* Code */}
                                    <TableCell className="px-4 py-3.5">
                                        {r.code
                                            ? <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{r.code}</span>
                                            : <span className="text-slate-300 dark:text-slate-600 italic text-xs">—</span>}
                                    </TableCell>

                                    {/* Description */}
                                    <TableCell className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs">
                                        {r.description
                                            ? <span className="truncate block max-w-xs" title={r.description}>{r.description}</span>
                                            : <span className="italic text-slate-300 dark:text-slate-600 text-xs">—</span>}
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
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="grade level" onChange={setPage} />
                </div>
            )}

            {/* ── Modal ──────────────────────────────────────────────────── */}
            <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? `Edit — ${editing.name}` : 'Add Grade Level'}</DialogTitle>
                </DialogHeader>
                <GradeLevelForm
                    defaultValues={editing ? {
                        name:        editing.name,
                        ordernumber: editing.ordernumber,
                        code:        editing.code        || undefined,
                        description: editing.description || undefined,
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
                title="Delete grade level?"
                description={`"${toDelete?.name}" will be permanently removed from Dataverse.`}
                onConfirm={() => {
                    if (toDelete) { handleDelete(toDelete.gradelevelid); setToDelete(null); }
                }}
            />
        </div>
    );
}
