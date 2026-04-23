'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { feeInvoicesAPI, feeStructuresAPI, academicYearsAPI, termsAPI } from '@/lib/api-client';
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
    feestatus:      z.coerce.number().default(1),
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
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: defaultValues ?? { feestatus: 1, amount: 0 },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <F id="studentid" label="Student ID *" error={errors.studentid?.message}>
                <Input id="studentid" {...register('studentid')} placeholder="Student GUID" />
            </F>
            <F id="feestructureid" label="Fee Structure *" error={errors.feestructureid?.message}>
                <select id="feestructureid" {...register('feestructureid')}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="">— Select —</option>
                    {feeStructures.map(fs => (
                        <option key={fs.feestructureid} value={fs.feestructureid}>{fs.name}</option>
                    ))}
                </select>
            </F>
            <div className="grid grid-cols-2 gap-3">
                <F id="amount" label="Amount *" error={errors.amount?.message}>
                    <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="0.00" />
                </F>
                <F id="duedate" label="Due Date" error={errors.duedate?.message}>
                    <Input id="duedate" type="date" {...register('duedate')} />
                </F>
            </div>
            <F id="feestatus" label="Status">
                <select id="feestatus" {...register('feestatus')}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    {Object.entries(FEE_INVOICE_STATUS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </F>
            <div className="grid grid-cols-2 gap-3">
                <F id="academicyearid" label="Academic Year">
                    <select id="academicyearid" {...register('academicyearid')}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">— None —</option>
                        {academicYears.map(ay => (
                            <option key={ay.academicyearid} value={ay.academicyearid}>{ay.name}</option>
                        ))}
                    </select>
                </F>
                <F id="termid" label="Term">
                    <select id="termid" {...register('termid')}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">— None —</option>
                        {terms.map(t => (
                            <option key={t.termid} value={t.termid}>{t.name}</option>
                        ))}
                    </select>
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
    const [filtered, setFiltered]   = useState<FeeInvoice[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
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
            setFiltered(fiRes.data ?? []);
            setFeeStructures(fsRes.data ?? []);
            setAcademicYears(ayRes.data ?? []);
            setTerms(tRes.data ?? []);
        } catch { toast.error('Failed to load fee invoices'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(q ? rows.filter(r =>
            r.studentname.toLowerCase().includes(q) ||
            r.feestructurename.toLowerCase().includes(q)
        ) : rows);
    }, [search, rows]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await feeInvoicesAPI.update(editing.feeid, data);
                toast.success('Fee invoice updated');
            } else {
                await feeInvoicesAPI.create(data);
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fee Invoices</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
                </div>
                <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1.5" /> Add Fee Invoice
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search by student or fee…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <FileText className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No fee invoices found</p>
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-left">
                                {['Student', 'Fee Structure', 'Amount', 'Due Date', 'Term', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filtered.map(r => (
                                <tr key={r.feeid} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                                            {r.studentname || r.studentid.slice(0, 8) + '…'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.feestructurename || '—'}</td>
                                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{formatCurrency(r.amount)}</td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{formatDate(r.duedate)}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{r.termname || '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={STATUS_VARIANT[r.feestatus] ?? 'default'}>
                                            {FEE_INVOICE_STATUS[r.feestatus] ?? 'Unknown'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}>
                                                <Pencil className="h-3.5 w-3.5 text-gray-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(r.feeid)}>
                                                <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
                title={editing ? 'Edit Fee Invoice' : 'Add Fee Invoice'}>
                <FeeInvoiceForm
                    defaultValues={editing ? {
                        studentid:      editing.studentid,
                        feestructureid: editing.feestructureid,
                        amount:         editing.amount,
                        duedate:        editing.duedate?.slice(0, 10),
                        feestatus:      editing.feestatus,
                        academicyearid: editing.academicyearid || undefined,
                        termid:         editing.termid || undefined,
                    } : undefined}
                    feeStructures={feeStructures}
                    academicYears={academicYears}
                    terms={terms}
                    onSubmit={handleSubmit}
                    onCancel={() => { setModalOpen(false); setEditing(null); }}
                />
            </Modal>

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete fee invoice?" description="This will permanently remove the fee invoice."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
