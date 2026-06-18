'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, CreditCard, RefreshCw, Download, Printer } from 'lucide-react';
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
import { feePaymentsAPI, feeInvoicesAPI } from '@/lib/api-client';
import { exportToCSV } from '@/lib/csv';
import { ReceiptDialog } from '@/components/ui/ReceiptDialog';
import { Pagination } from '@/components/ui/Pagination';
import type { FeePayment } from '@/lib/dataverse/fees';

interface FeeOption { feeid: string; name: string; studentid: string; studentname: string; amount: number; }

const PAGE_SIZE = 10;

// Allowed payment channels: Cash, Mobile Money, Bank Transfer
const PAYMENT_METHODS: Record<number, string> = {
    1: 'Cash', 4: 'Mobile Money', 2: 'Bank Transfer',
};
const PAYMENT_STATUS: Record<number, string> = {
    1: 'Paid', 2: 'Pending', 3: 'Failed', 4: 'Refunded',
};
const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'destructive' | 'default'> = {
    1: 'success', 2: 'warning', 3: 'destructive', 4: 'default',
};

// Mobile Money (4) and Bank Transfer (2) require a transaction/reference number; Cash (1) does not.
const REFERENCE_REQUIRED_METHODS = new Set(['2', '4']);

const schema = z.object({
    studentid:      z.string().optional(),
    feeid:          z.string().optional(),
    amount:         z.coerce.number().min(0, 'Required'),
    paymentdate:    z.string().min(1, 'Required'),
    paymentmethod:  z.string().min(1, 'Required'),
    paymentstatus:  z.string().default('1'),
    transactionid:  z.string().optional(),
    receiptnumber:  z.string().optional(),
}).refine(
    d => !REFERENCE_REQUIRED_METHODS.has(d.paymentmethod) || !!d.transactionid?.trim(),
    { path: ['transactionid'], message: 'Transaction / reference no. is required for Mobile Money and Bank Transfer' },
);
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

function FeePaymentForm({ defaultValues, fees, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    fees: FeeOption[];
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';
    const { register, control, setValue, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: defaultValues ?? { paymentmethod: '1', paymentstatus: '1', amount: 0 },
    });

    // Distinct students that have fee invoices
    const students = useMemo(() => {
        const m = new Map<string, string>();
        fees.forEach(f => { if (f.studentid && !m.has(f.studentid)) m.set(f.studentid, f.studentname); });
        return Array.from(m, ([studentid, studentname]) => ({ studentid, studentname }))
            .sort((a, b) => a.studentname.localeCompare(b.studentname));
    }, [fees]);

    const selectedStudent = watch('studentid');
    const studentItems = useMemo(() => fees.filter(f => f.studentid === selectedStudent), [fees, selectedStudent]);

    // Mobile Money / Bank Transfer need a reference for reconciliation; Cash does not.
    const refRequired = REFERENCE_REQUIRED_METHODS.has(watch('paymentmethod'));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <F id="studentid" label="Student *" error={errors.studentid?.message}>
                <Controller name="studentid" control={control} render={({ field }) => (
                    <SelectRoot value={field.value ?? ''} onValueChange={(v) => {
                        field.onChange(v);
                        setValue('feeid', '');   // reset item — fees differ per student
                    }}>
                        <SelectTrigger id="studentid" className={ST}>
                            <SelectValue>
                                {field.value ? (students.find(s => s.studentid === field.value)?.studentname ?? '— Select student —') : '— Select student —'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">— Select student —</SelectItem>
                            {students.map(s => <SelectItem key={s.studentid} value={s.studentid}>{s.studentname}</SelectItem>)}
                        </SelectContent>
                    </SelectRoot>
                )} />
            </F>
            <F id="feeid" label="Item *" error={errors.feeid?.message}>
                <Controller name="feeid" control={control} render={({ field }) => (
                    <SelectRoot value={field.value ?? ''} disabled={!selectedStudent} onValueChange={(v) => {
                        field.onChange(v);
                        const fee = fees.find(f => f.feeid === v);
                        if (fee) setValue('amount', fee.amount);
                    }}>
                        <SelectTrigger id="feeid" className={ST}>
                            <SelectValue>
                                {field.value
                                    ? (fees.find(f => f.feeid === field.value)?.name ?? '— Select item —')
                                    : (selectedStudent ? '— Select item —' : '— Select student first —')}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">— Select item —</SelectItem>
                            {studentItems.map(f => (
                                <SelectItem key={f.feeid} value={f.feeid}>{f.name} ({f.amount})</SelectItem>
                            ))}
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
                                {[1, 4, 2].map(k => <SelectItem key={k} value={String(k)}>{PAYMENT_METHODS[k]}</SelectItem>)}
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
                <F id="transactionid" label={`Transaction / Reference No.${refRequired ? ' *' : ''}`} error={errors.transactionid?.message}>
                    <Input id="transactionid" {...register('transactionid')} placeholder={refRequired ? 'MoMo / bank reference' : 'Optional'} />
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
    const [receiptData, setReceiptData] = useState<FeePayment | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);
    const [fees, setFees] = useState<FeeOption[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [fpRes, feeRes]: any[] = await Promise.all([
                feePaymentsAPI.getAll({ pageSize: 500 }),
                feeInvoicesAPI.getAll({ pageSize: 1000 }),
            ]);
            setRows(fpRes.data ?? []);
            setFees(feeRes.data ?? []);
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
            const payload = {
                amount:        Number(data.amount),
                paymentdate:   data.paymentdate,
                paymentmethod: Number(data.paymentmethod),
                paymentstatus: Number(data.paymentstatus),
                transactionid: data.transactionid || undefined,
                receiptnumber: data.receiptnumber || undefined,
            };
            const fee = fees.find(f => f.feeid === data.feeid);
            if (!fee) { toast.error('Please select a fee'); return; }
            const full = { ...payload, feeid: fee.feeid, studentid: fee.studentid };
            if (editing) {
                await feePaymentsAPI.update(editing.feepaymentid, full);
                toast.success('Payment updated');
            } else {
                await feePaymentsAPI.create(full);
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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fee Payments</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        exportToCSV(`fee_payments_${new Date().toISOString().slice(0, 10)}`, [
                            'Student', 'Fee Structure', 'Amount', 'Date', 'Method', 'Receipt', 'Status',
                        ], filtered.map(r => [
                            r.studentname, r.feestructurename, r.amount,
                            r.paymentdate?.slice(0, 10),
                            PAYMENT_METHODS[r.paymentmethod] ?? '',
                            r.receiptnumber,
                            PAYMENT_STATUS[r.paymentstatus] ?? '',
                        ]));
                    }}>
                        <Download className="h-4 w-4 mr-1.5" /> Export CSV
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1.5" /> Record Payment
                    </Button>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input placeholder="Search by student, fee or receipt…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                    <CreditCard className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No fee payments found</p>
                </div>
            ) : (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-left">
                                {['Student', 'Fee Structure', 'Amount', 'Date', 'Method', 'Receipt', 'Status', 'Actions'].map(h => (
                                    <TableHead key={h} className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(r => (
                                <TableRow key={r.feepaymentid} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <TableCell className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-green-500 flex-shrink-0" />
                                            {r.studentname || '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.feestructurename || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 font-mono font-semibold text-green-600 dark:text-green-400">{formatCurrency(r.amount)}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{formatDate(r.paymentdate)}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{PAYMENT_METHODS[r.paymentmethod] ?? '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{r.receiptnumber || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[r.paymentstatus] ?? 'default'}>
                                            {PAYMENT_STATUS[r.paymentstatus] ?? 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" title="Print receipt" onClick={() => setReceiptData(r)}>
                                                <Printer className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}>
                                                <Pencil className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(r.feepaymentid)}>
                                                <Trash2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
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
                        studentid:      editing.studentid,
                        feeid:          editing.feestructureid,   // FeePayment.feestructureid holds the fee invoice id (_sms_fee_value)
                        amount:         editing.amount,
                        paymentdate:    editing.paymentdate?.slice(0, 10),
                        paymentmethod:  String(editing.paymentmethod),
                        paymentstatus:  String(editing.paymentstatus),
                        transactionid:  editing.transactionid || undefined,
                        receiptnumber:  editing.receiptnumber || undefined,
                    } : undefined}
                    fees={fees}
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

            <ReceiptDialog
                open={!!receiptData}
                onClose={() => setReceiptData(null)}
                data={receiptData ? {
                    receiptnumber:  receiptData.receiptnumber,
                    studentname:    receiptData.studentname,
                    feestructure:   receiptData.feestructurename,
                    amount:         receiptData.amount,
                    paymentdate:    receiptData.paymentdate?.slice(0, 10) ?? '',
                    paymentmethod:  PAYMENT_METHODS[receiptData.paymentmethod] ?? '',
                    paymentstatus:  PAYMENT_STATUS[receiptData.paymentstatus] ?? '',
                    transactionid:  receiptData.transactionid,
                } : null}
            />
        </div>
    );
}
