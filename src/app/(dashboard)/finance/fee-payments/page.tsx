'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, CreditCard, RefreshCw } from 'lucide-react';
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
import { feePaymentsAPI, feeStructuresAPI } from '@/lib/api-client';
import { Pagination } from '@/components/ui/Pagination';
import type { FeePayment } from '@/lib/dataverse/fees';
import type { FeeStructure } from '@/lib/dataverse/fees';

const PAGE_SIZE = 10;

const PAYMENT_METHODS: Record<number, string> = {
    1: 'Cash', 2: 'Bank Transfer', 3: 'Card', 4: 'Mobile Money', 5: 'Cheque',
};
const PAYMENT_STATUS: Record<number, string> = {
    1: 'Paid', 2: 'Pending', 3: 'Failed', 4: 'Refunded',
};
const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'destructive' | 'default'> = {
    1: 'success', 2: 'warning', 3: 'destructive', 4: 'default',
};

const schema = z.object({
    studentid:      z.string().min(1, 'Required'),
    feestructureid: z.string().min(1, 'Required'),
    amount:         z.coerce.number().min(0, 'Required'),
    paymentdate:    z.string().min(1, 'Required'),
    paymentmethod:  z.string().min(1, 'Required'),
    paymentstatus:  z.string().default('Paid'),
    transactionid:  z.string().optional(),
    receiptnumber:  z.string().optional(),
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

function FeePaymentForm({ defaultValues, feeStructures, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    feeStructures: FeeStructure[];
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: defaultValues ?? { paymentmethod: 'Cash', paymentstatus: 'Paid', amount: 0 },
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
                <F id="paymentdate" label="Payment Date *" error={errors.paymentdate?.message}>
                    <Controller control={control} name="paymentdate" render={({ field }) => (
                        <DatePicker id="paymentdate" value={field.value} onChange={field.onChange} placeholder="Select date" />
                    )} />
                </F>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <F id="paymentmethod" label="Payment Method *" error={errors.paymentmethod?.message}>
                    <Controller name="paymentmethod" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger id="paymentmethod" className={ST}>
                                <SelectValue>{field.value ? (PAYMENT_METHODS[Number(field.value)] ?? field.value) : '— Select —'}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(PAYMENT_METHODS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="paymentstatus" label="Status">
                    <Controller name="paymentstatus" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger id="paymentstatus" className={ST}>
                                <SelectValue>{field.value ? (PAYMENT_STATUS[Number(field.value)] ?? field.value) : '— Select —'}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(PAYMENT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <F id="transactionid" label="Transaction ID">
                    <Input id="transactionid" {...register('transactionid')} placeholder="Optional" />
                </F>
                <F id="receiptnumber" label="Receipt Number">
                    <Input id="receiptnumber" {...register('receiptnumber')} placeholder="Auto-generated if blank" />
                </F>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
            </div>
        </form>
    );
}

export default function FeePaymentsPage() {
    const [rows, setRows]           = useState<FeePayment[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [page, setPage]           = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<FeePayment | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [fpRes, fsRes]: any[] = await Promise.all([
                feePaymentsAPI.getAll(),
                feeStructuresAPI.getAll(),
            ]);
            setRows(fpRes.data ?? []);
            setFeeStructures(fsRes.data ?? []);
        } catch { toast.error('Failed to load fee payments'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return q ? rows.filter(r =>
            r.studentname.toLowerCase().includes(q) ||
            r.feestructurename.toLowerCase().includes(q) ||
            r.receiptnumber.toLowerCase().includes(q)
        ) : rows;
    }, [search, rows]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await feePaymentsAPI.update(editing.feepaymentid, { ...data, paymentmethod: Object.entries(PAYMENT_METHODS).find(([,v])=>v===data.paymentmethod)?.[0] ? Number(Object.entries(PAYMENT_METHODS).find(([,v])=>v===data.paymentmethod)![0]) : 1, paymentstatus: Object.entries(PAYMENT_STATUS).find(([,v])=>v===data.paymentstatus)?.[0] ? Number(Object.entries(PAYMENT_STATUS).find(([,v])=>v===data.paymentstatus)![0]) : 1 });
                toast.success('Payment updated');
            } else {
                await feePaymentsAPI.create({ ...data, paymentmethod: Object.entries(PAYMENT_METHODS).find(([,v])=>v===data.paymentmethod)?.[0] ? Number(Object.entries(PAYMENT_METHODS).find(([,v])=>v===data.paymentmethod)![0]) : 1, paymentstatus: Object.entries(PAYMENT_STATUS).find(([,v])=>v===data.paymentstatus)?.[0] ? Number(Object.entries(PAYMENT_STATUS).find(([,v])=>v===data.paymentstatus)![0]) : 1 });
                toast.success('Payment recorded');
            }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const handleDelete = async (id: string) => {
        try { await feePaymentsAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    const formatDate     = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
    const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fee Payments</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1.5" /> Record Payment
                    </Button>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search by student, fee or receipt…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <CreditCard className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No fee payments found</p>
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-left">
                                {['Student', 'Fee Structure', 'Amount', 'Date', 'Method', 'Receipt', 'Status', 'Actions'].map(h => (
                                    <TableHead key={h} className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {paginated.map(r => (
                                <TableRow key={r.feepaymentid} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-green-500 flex-shrink-0" />
                                            {r.studentname || '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.feestructurename || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 font-mono font-semibold text-green-600 dark:text-green-400">{formatCurrency(r.amount)}</TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 font-mono text-xs">{formatDate(r.paymentdate)}</TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-xs">{PAYMENT_METHODS[r.paymentmethod] ?? '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-gray-400 font-mono text-xs">{r.receiptnumber || '—'}</TableCell>
                                    <TableCell className="px-4 py-3">
                                        <Badge variant={STATUS_VARIANT[r.paymentstatus] ?? 'default'}>
                                            {PAYMENT_STATUS[r.paymentstatus] ?? 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}>
                                                <Pencil className="h-3.5 w-3.5 text-gray-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(r.feepaymentid)}>
                                                <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="payment" onChange={setPage} />
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditing(null); } }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
                </DialogHeader>
                <FeePaymentForm
                    defaultValues={editing ? {
                        studentid:     editing.studentname,
                        feestructureid: '',
                        amount:         editing.amount,
                        paymentdate:    editing.paymentdate?.slice(0, 10),
                        paymentmethod:  PAYMENT_METHODS[editing.paymentmethod] ?? 'Cash',
                        paymentstatus:  PAYMENT_STATUS[editing.paymentstatus] ?? 'Paid',
                        transactionid:  editing.transactionid || undefined,
                        receiptnumber:  editing.receiptnumber || undefined,
                    } : undefined}
                    feeStructures={feeStructures}
                    onSubmit={handleSubmit}
                    onCancel={() => { setModalOpen(false); setEditing(null); }}
                />
                          </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete payment?" description="This will permanently remove the fee payment record."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
