'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, FileText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { feeInvoicesAPI, feeStructuresAPI, academicYearsAPI, termsAPI } from '@/lib/api-client';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 10;
import type { FeeInvoice } from '@/lib/dataverse/feeinvoices';
import type { FeeStructure } from '@/lib/dataverse/fees';
import type { AcademicYear } from '@/lib/dataverse/academicyears';
import type { Term } from '@/lib/dataverse/terms';
import { FEE_INVOICE_STATUS } from '@/lib/dataverse/feeinvoices';

const schema = z.object({
    studentid:      z.string().min(1, 'Required'),
    feestructureid: z.string().min(1, 'Required'),
    amount:         z.coerce.number().min(0, 'Required'),
    duedate:        z.string().optional(),
    feestatus:      z.string().default('Pending'),
    academicyearid: z.string().optional(),
    termid:         z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STATUS_VARIANT: Record<number, 'success' | 'destructive' | 'warning' | 'default'> = {
    1: 'warning', 2: 'success', 3: 'destructive', 4: 'default',
};

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function FeeInvoiceForm({ defaultValues, feeStructures, academicYears, terms, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    feeStructures: FeeStructure[];
    academicYears: AcademicYear[];
    terms: Term[];
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: defaultValues ?? { feestatus: 'Pending', amount: 0 },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <F id="studentid" label="Student ID *" error={errors.studentid?.message}>
                <Input id="studentid" {...register('studentid')} placeholder="Student GUID" />
            </F>
            <F id="feestructureid" label="Fee Structure *" error={errors.feestructureid?.message}>
                <Controller name="feestructureid" control={control} render={({ field }) => (
                    <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger id="feestructureid" className={ST}>
                            <SelectValue>
                                {field.value ? (feeStructures.find(fs => fs.feestructureid === field.value)?.name ?? '— Select —') : '— Select —'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">— Select —</SelectItem>
                            {feeStructures.map(fs => <SelectItem key={fs.feestructureid} value={fs.feestructureid}>{fs.name}</SelectItem>)}
                        </SelectContent>
                    </SelectRoot>
                )} />
            </F>
            <div className="grid grid-cols-2 gap-3">
                <F id="amount" label="Amount *" error={errors.amount?.message}>
                    <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="0.00" />
                </F>
                <F id="duedate" label="Due Date" error={errors.duedate?.message}>
                    <Controller control={control} name="duedate" render={({ field }) => (
                        <DatePicker id="duedate" value={field.value} onChange={field.onChange} placeholder="Select date" />
                    )} />
                </F>
            </div>
            <F id="feestatus" label="Status">
                <Controller name="feestatus" control={control} render={({ field }) => (
                    <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger id="feestatus" className={ST}>
                            <SelectValue>{field.value || '— Select status —'}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(FEE_INVOICE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </SelectRoot>
                )} />
            </F>
            <div className="grid grid-cols-2 gap-3">
                <F id="academicyearid" label="Academic Year">
                    <Controller name="academicyearid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger id="academicyearid" className={ST}>
                                <SelectValue>
                                    {field.value ? (academicYears.find(ay => ay.academicyearid === field.value)?.name ?? '— None —') : '— None —'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">— None —</SelectItem>
                                {academicYears.map(ay => <SelectItem key={ay.academicyearid} value={ay.academicyearid}>{ay.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="termid" label="Term">
                    <Controller name="termid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger id="termid" className={ST}>
                                <SelectValue>
                                    {field.value ? (terms.find(t => t.termid === field.value)?.name ?? '— None —') : '— None —'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">— None —</SelectItem>
                                {terms.map(t => <SelectItem key={t.termid} value={t.termid}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
            </div>
        </form>
    );
}

export default function FeeInvoicesPage() {
    const [rows, setRows]           = useState<FeeInvoice[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [page, setPage]           = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<FeeInvoice | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [terms, setTerms]                 = useState<Term[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [fiRes, fsRes, ayRes, tRes]: any[] = await Promise.all([
                feeInvoicesAPI.getAll(),
                feeStructuresAPI.getAll(),
                academicYearsAPI.getAll(),
                termsAPI.getAll(),
            ]);
            setRows(fiRes.data ?? []);
            setFeeStructures(fsRes.data ?? []);
            setAcademicYears(ayRes.data ?? []);
            setTerms(tRes.data ?? []);
        } catch { toast.error('Failed to load fee invoices'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return q ? rows.filter(r =>
            r.studentname.toLowerCase().includes(q) ||
            r.feestructurename.toLowerCase().includes(q)
        ) : rows;
    }, [search, rows]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await feeInvoicesAPI.update(editing.feeid, data);
                toast.success('Fee invoice updated');
            } else {
                await feeInvoicesAPI.create({ ...data, feestatus: Object.entries(FEE_INVOICE_STATUS).find(([,v])=>v===data.feestatus)?.[0] ? Number(Object.entries(FEE_INVOICE_STATUS).find(([,v])=>v===data.feestatus)![0]) : 1 });
                toast.success('Fee invoice created');
            }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const handleDelete = async (id: string) => {
        try { await feeInvoicesAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    const formatDate  = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
    const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fee Invoices</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1.5" /> Add Fee Invoice
                    </Button>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input placeholder="Search by student or fee…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                    <FileText className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No fee invoices found</p>
                </div>
            ) : (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-left">
                                {['Student', 'Fee Structure', 'Amount', 'Due Date', 'Term', 'Status', 'Actions'].map(h => (
                                    <TableHead key={h} className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(r => (
                                <TableRow key={r.feeid} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <TableCell className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                                            {r.studentname || r.studentid.slice(0, 8) + '…'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.feestructurename || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{formatCurrency(r.amount)}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{formatDate(r.duedate)}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{r.termname || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[r.feestatus] ?? 'default'}>
                                            {FEE_INVOICE_STATUS[r.feestatus] ?? 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}>
                                                <Pencil className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(r.feeid)}>
                                                <Trash2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="invoice" onChange={setPage} />
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditing(null); } }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Fee Invoice' : 'Add Fee Invoice'}</DialogTitle>
                </DialogHeader>
                <FeeInvoiceForm
                    defaultValues={editing ? {
                        studentid:      editing.studentid,
                        feestructureid: editing.feestructureid,
                        amount:         editing.amount,
                        duedate:        editing.duedate?.slice(0, 10),
                        feestatus:      FEE_INVOICE_STATUS[editing.feestatus] ?? 'Pending',
                        academicyearid: editing.academicyearid || undefined,
                        termid:         editing.termid || undefined,
                    } : undefined}
                    feeStructures={feeStructures}
                    academicYears={academicYears}
                    terms={terms}
                    onSubmit={handleSubmit}
                    onCancel={() => { setModalOpen(false); setEditing(null); }}
                />
                          </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete fee invoice?" description="This will permanently remove the fee invoice."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
