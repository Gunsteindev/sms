'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, ShoppingCart, RefreshCw, Download, Clock, CheckCircle2, TrendingUp, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/Pagination';
import { exportToCSV } from '@/lib/csv';
import { procurementAPI } from '@/lib/api-client';
import type { Expenditure } from '@/lib/dataverse/procurement';

const PAGE_SIZE = 10;
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const CATEGORIES: Record<number, string> = { 1: 'Supplies', 2: 'Equipment', 3: 'Services', 4: 'Maintenance', 5: 'Utilities', 6: 'Other' };
const STATUSES: Record<number, string>   = { 1: 'Pending', 2: 'Approved', 3: 'Paid', 4: 'Rejected' };
const STATUS_VARIANT: Record<number, 'warning' | 'success' | 'default' | 'destructive'> = {
    1: 'warning', 2: 'success', 3: 'default', 4: 'destructive',
};

const schema = z.object({
    name:            z.string().min(1, 'Required'),
    amount:          z.coerce.number().min(0, 'Required'),
    category:        z.string().default('6'),
    expendituredate: z.string().min(1, 'Required'),
    supplier:        z.string().optional(),
    approvedby:      z.string().optional(),
    status:          z.string().default('1'),
    reference:       z.string().optional(),
    notes:           z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function ExpenditureForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: { category: '6', status: '1', amount: 0, ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="col-span-2">
                <F id="name" label="Description *" error={errors.name?.message}>
                    <Input id="name" {...register('name')} />
                </F>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <F id="amount" label="Amount *" error={errors.amount?.message}>
                    <Input id="amount" type="number" step="0.01" {...register('amount')} />
                </F>
                <F id="expendituredate" label="Date *" error={errors.expendituredate?.message}>
                    <Controller control={control} name="expendituredate" render={({ field }) => (
                        <DatePicker id="expendituredate" value={field.value} onChange={field.onChange} />
                    )} />
                </F>

                <F id="category" label="Category">
                    <Controller name="category" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '6'} onValueChange={v => field.onChange(v ?? '6')}>
                            <SelectTrigger id="category" className={ST}><SelectValue>{(v: string) => CATEGORIES[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>

                <F id="status" label="Status">
                    <Controller name="status" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '1'} onValueChange={v => field.onChange(v ?? '1')}>
                            <SelectTrigger id="status" className={ST}><SelectValue>{(v: string) => STATUSES[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {Object.entries(STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>

                <F id="supplier" label="Supplier / Vendor">
                    <Input id="supplier" {...register('supplier')} />
                </F>

                <F id="reference" label="Reference No.">
                    <Input id="reference" {...register('reference')} />
                </F>
            </div>

            <F id="approvedby" label="Approved By">
                <Input id="approvedby" {...register('approvedby')} />
            </F>

            <F id="notes" label="Notes">
                <Textarea id="notes" {...register('notes')} rows={2} />
            </F>

            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
            </div>
        </form>
    );
}

export default function ProcurementPage() {
    const [rows, setRows]           = useState<Expenditure[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]           = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Expenditure | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await procurementAPI.getAll();
            setRows(res.data ?? []);
        } catch { toast.error('Failed to load expenditures'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return rows.filter(r =>
            (!statusFilter || String(r.status) === statusFilter) &&
            (!q || `${r.name} ${r.supplier} ${r.reference}`.toLowerCase().includes(q))
        );
    }, [search, statusFilter, rows]);

    const totalAmount  = filtered.reduce((s, r) => s + r.amount, 0);
    const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const fmt          = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        const payload = { ...data, category: Number(data.category), status: Number(data.status) };
        try {
            if (editing) { await procurementAPI.update(editing.expenditureid, payload); toast.success('Updated'); }
            else         { await procurementAPI.create(payload);                        toast.success('Recorded'); }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const handleDelete = async (id: string) => {
        try { await procurementAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Procurement & Expenditures</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''} · Total: {fmt(rows.reduce((s, r) => s + r.amount, 0))}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        exportToCSV(`expenditures_${new Date().toISOString().slice(0, 10)}`, [
                            'Description', 'Amount', 'Category', 'Date', 'Supplier', 'Reference', 'Status', 'Approved By',
                        ], filtered.map(r => [
                            r.name, r.amount, CATEGORIES[r.category] ?? '', r.expendituredate?.slice(0, 10),
                            r.supplier, r.reference, STATUSES[r.status] ?? '', r.approvedby,
                        ]));
                    }}>
                        <Download className="h-4 w-4 mr-1.5" /> Export CSV
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Record
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { key: 3, label: 'Total Paid',     icon: TrendingUp,  accent: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', icon_c: 'text-emerald-600', border: 'border-emerald-100 dark:border-emerald-800' },
                    { key: 2, label: 'Approved',       icon: CheckCircle2, accent: 'bg-blue-500',   light: 'bg-blue-50 dark:bg-blue-900/20',       icon_c: 'text-blue-600',    border: 'border-blue-100 dark:border-blue-800' },
                    { key: 1, label: 'Pending',        icon: Clock,       accent: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-900/20',     icon_c: 'text-amber-600',   border: 'border-amber-100 dark:border-amber-800' },
                    { key: 4, label: 'Rejected',       icon: XCircle,     accent: 'bg-red-500',     light: 'bg-red-50 dark:bg-red-900/20',         icon_c: 'text-red-500',     border: 'border-red-100 dark:border-red-800' },
                ].map(({ key, label, icon: Icon, accent, light, icon_c, border }) => {
                    const subset = rows.filter(r => r.status === key);
                    const amt    = subset.reduce((s, r) => s + r.amount, 0);
                    return (
                        <div key={key} className={`relative rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-sm overflow-hidden ${border}`}>
                            <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
                            <div className="flex items-start justify-between gap-4 mt-1">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight">{subset.length}</p>
                                    <p className="mt-1 text-xs text-slate-400 truncate">{fmt(amt)}</p>
                                </div>
                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${light}`}>
                                    <Icon className={`h-5 w-5 ${icon_c}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <Input placeholder="Search records…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <SelectRoot value={statusFilter} onValueChange={v => setStatusFilter(v ?? '')}>
                    <SelectTrigger className="w-36 h-10"><SelectValue>{(v: string) => STATUSES[Number(v)] ?? 'All Statuses'}</SelectValue></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        {Object.entries(STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                </SelectRoot>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                    <ShoppingCart className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No expenditure records found</p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow>
                                {['Item', 'Description', 'Amount', 'Category', 'Date', 'Supplier', 'Reference', 'Status', 'Approved By', ''].map(h => (
                                    <TableHead key={h}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(r => (
                                <TableRow key={r.expenditureid}>
                                    <TableCell>
                                        <p className="font-medium text-slate-900 dark:text-slate-100">{r.name}</p>
                                    </TableCell>
                                    <TableCell>
                                        {r.notes
                                            ? <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px] block">{r.notes}</span>
                                            : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">{fmt(r.amount)}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{CATEGORIES[r.category] ?? '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                                        {r.expendituredate ? new Date(r.expendituredate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{r.supplier || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{r.reference || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[r.status] ?? 'default'}>{STATUSES[r.status] ?? 'Unknown'}</Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{r.approvedby || '—'}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}>
                                                <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(r.expenditureid)}>
                                                <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total shown: <span className="font-semibold text-slate-900 dark:text-slate-100">{fmt(totalAmount)}</span></p>
                        <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="record" onChange={setPage} />
                    </div>
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Expenditure' : 'Add Expenditure'}</DialogTitle>
                    </DialogHeader>
                    <ExpenditureForm
                        defaultValues={editing ? {
                            name: editing.name, amount: editing.amount,
                            category: String(editing.category), expendituredate: editing.expendituredate?.slice(0, 10),
                            supplier: editing.supplier, approvedby: editing.approvedby,
                            status: String(editing.status), reference: editing.reference, notes: editing.notes,
                        } : undefined}
                        onSubmit={handleSubmit}
                        onCancel={() => { setModalOpen(false); setEditing(null); }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete record?" description="This will permanently remove the expenditure record."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
