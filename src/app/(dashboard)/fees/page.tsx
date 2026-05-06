'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, CheckCircle2, Clock, Plus, Search, Pencil, Trash2, Receipt, RefreshCw, Download, Printer } from 'lucide-react';
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
import { feesAPI, feeStructuresAPI, feePaymentsAPI, academicYearsAPI, gradeLevelsAPI, feeTypesAPI } from '@/lib/api-client';
import { AISummary } from '@/components/ui/AISummary';
import { Pagination } from '@/components/ui/Pagination';
import { exportToCSV } from '@/lib/csv';
import { ReceiptDialog } from '@/components/ui/ReceiptDialog';
import type { FeePayment, FeeStructure } from '@/lib/dataverse/fees';
import type { AcademicYear } from '@/lib/dataverse/academicyears';
import type { GradeLevel } from '@/lib/dataverse/gradelevels';

interface FeeTypeOption { feetypeid: string; name: string; }

const PAGE_SIZE = 10;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const fsSchema = z.object({
  name:           z.string().min(1, 'Required'),
  feetypeid:      z.string().optional(),
  amount:         z.coerce.number().min(0, 'Required'),
  duedate:        z.string().optional(),
  gradelevelid:   z.string().optional(),
  academicyearid: z.string().optional(),
});
type FSFormData = z.infer<typeof fsSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const METHODS: Record<number, string> = { 1: 'Cash', 2: 'Bank Transfer', 3: 'Card', 4: 'Mobile Money' };
const PAY_STATUS: Record<number, { label: string; variant: 'success' | 'warning' | 'destructive' | 'default' }> = {
  1: { label: 'Paid',    variant: 'success' },
  2: { label: 'Pending', variant: 'warning' },
  3: { label: 'Failed',  variant: 'destructive' },
};
const STATUS_FILTERS = [
  { value: 0,   label: 'All' },
  { value: 1,   label: 'Paid' },
  { value: 2,   label: 'Pending' },
  { value: 3,   label: 'Failed' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(n);
}

// ─── Fee Structure form ───────────────────────────────────────────────────────

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FeeStructureForm({ defaultValues, academicYears, gradeLevels, feeTypes, onSubmit, onCancel }: {
  defaultValues?: Partial<FSFormData>;
  academicYears: AcademicYear[];
  gradeLevels: GradeLevel[];
  feeTypes: FeeTypeOption[];
  onSubmit: (d: FSFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FSFormData>({
    resolver: zodResolver(fsSchema) as never,
    defaultValues: defaultValues ?? { amount: 0 },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <F id="name" label="Name *" error={errors.name?.message}>
        <Input id="name" {...register('name')} placeholder="e.g. Tuition Fee Term 1" />
      </F>
      <div className="grid grid-cols-2 gap-3">
        <F id="feetypeid" label="Fee Type" error={errors.feetypeid?.message}>
          <Controller name="feetypeid" control={control} render={({ field }) => (
            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger id="feetypeid" className={ST}>
                <SelectValue>
                  {field.value ? (feeTypes.find(ft => ft.feetypeid === field.value)?.name ?? '— Select type —') : '— Select type —'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Select type —</SelectItem>
                {feeTypes.map(ft => <SelectItem key={ft.feetypeid} value={ft.feetypeid}>{ft.name}</SelectItem>)}
              </SelectContent>
            </SelectRoot>
          )} />
        </F>
        <F id="amount" label="Amount (GHS) *" error={errors.amount?.message}>
          <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="0.00" />
        </F>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F id="gradelevelid" label="Grade Level">
          <Controller name="gradelevelid" control={control} render={({ field }) => (
            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger id="gradelevelid" className={ST}>
                <SelectValue>
                  {field.value ? (gradeLevels.find(gl => gl.gradelevelid === field.value)?.name ?? '— All grades —') : '— All grades —'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— All grades —</SelectItem>
                {gradeLevels.map(gl => <SelectItem key={gl.gradelevelid} value={gl.gradelevelid}>{gl.name}</SelectItem>)}
              </SelectContent>
            </SelectRoot>
          )} />
        </F>
        <F id="duedate" label="Due Date">
          <Controller control={control} name="duedate" render={({ field }) => (
            <DatePicker id="duedate" value={field.value} onChange={field.onChange} placeholder="Select date" />
          )} />
        </F>
      </div>
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
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FeesPage() {
  const [tab, setTab]                 = useState<'structures' | 'payments'>('structures');
  const [structures, setStructures]   = useState<FeeStructure[]>([]);
  const [payments, setPayments]       = useState<FeePayment[]>([]);
  const [revenue, setRevenue]         = useState<{ totalRevenue: number; totalPayments: number } | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [gradeLevels, setGradeLevels]     = useState<GradeLevel[]>([]);
  const [feeTypes, setFeeTypes]           = useState<FeeTypeOption[]>([]);
  const [loading, setLoading]         = useState(true);
  const [receiptData, setReceiptData] = useState<FeePayment | null>(null);
  const [search, setSearch]           = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState(0);
  const [pageFS, setPageFS]           = useState(1);
  const [pagePay, setPagePay]         = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<FeeStructure | null>(null);
  const [toDelete, setToDelete]       = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [fsRes, revRes, payRes, ayRes, glRes, ftRes]: any[] = await Promise.all([
        feeStructuresAPI.getAll(),
        feesAPI.getRevenue(),
        feePaymentsAPI.getAll({ pageSize: 500 }),
        academicYearsAPI.getAll(),
        gradeLevelsAPI.getAll(),
        feeTypesAPI.getAll(),
      ]);
      setStructures(fsRes.data ?? []);
      setRevenue(revRes.data ?? null);
      setPayments(payRes.data ?? []);
      setAcademicYears(ayRes.data ?? []);
      setGradeLevels(glRes.data ?? []);
      setFeeTypes(ftRes.data ?? []);
    } catch { toast.error('Failed to load fees data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalPaid    = payments.filter(p => p.paymentstatus === 1).reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.paymentstatus === 2).reduce((s, p) => s + p.amount, 0);

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredFS = q
    ? structures.filter(s => s.name.toLowerCase().includes(q) || s.feetypename.toLowerCase().includes(q))
    : structures;

  const filteredPay = payments.filter(p => {
    const matchStatus = payStatusFilter === 0 || p.paymentstatus === payStatusFilter;
    const matchSearch = !q || p.studentname.toLowerCase().includes(q) || p.receiptnumber.toLowerCase().includes(q) || p.feestructurename.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const switchTab = (t: 'structures' | 'payments') => { setTab(t); setSearch(''); setPayStatusFilter(0); setPageFS(1); setPagePay(1); };

  const totalPagesFS  = Math.max(1, Math.ceil(filteredFS.length / PAGE_SIZE));
  const paginatedFS   = filteredFS.slice((pageFS - 1) * PAGE_SIZE, pageFS * PAGE_SIZE);
  const totalPagesPay = Math.max(1, Math.ceil(filteredPay.length / PAGE_SIZE));
  const paginatedPay  = filteredPay.slice((pagePay - 1) * PAGE_SIZE, pagePay * PAGE_SIZE);

  const handleFSSubmit = async (data: FSFormData) => {
    try {
      if (editing) {
        await feeStructuresAPI.update(editing.feestructureid, data);
        toast.success('Fee structure updated');
      } else {
        await feeStructuresAPI.create(data);
        toast.success('Fee structure created');
      }
      setModalOpen(false); setEditing(null); load();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    try { await feeStructuresAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fees</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Fee structures and payment records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          {tab === 'structures' && (
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Fee Structure
            </Button>
          )}
        </div>
      </div>

      <AISummary type="fees" getData={() => ({ revenue, feeStructures: structures })} />

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Collected',    value: formatCurrency(totalPaid),              icon: TrendingUp,  accent: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', icon_c: 'text-emerald-600', border: 'border-emerald-100 dark:border-emerald-800' },
          { label: 'Total Pending',      value: formatCurrency(totalPending),           icon: Clock,       accent: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-900/20',    icon_c: 'text-amber-600',   border: 'border-amber-100 dark:border-amber-800' },
          { label: 'Transactions',       value: payments.length,                        icon: CheckCircle2, accent: 'bg-blue-500',   light: 'bg-blue-50 dark:bg-blue-900/20',      icon_c: 'text-blue-600',    border: 'border-blue-100 dark:border-blue-800' },
          { label: 'Fee Structures',     value: structures.length,                      icon: DollarSign,  accent: 'bg-violet-500',  light: 'bg-violet-50 dark:bg-violet-900/20',  icon_c: 'text-violet-600',  border: 'border-violet-100 dark:border-violet-800' },
        ].map(({ label, value, icon: Icon, accent, light, icon_c, border }) => (
          <div key={label} className={`relative rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-sm overflow-hidden ${border}`}>
            <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
            <div className="flex items-start justify-between gap-4 mt-1">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight truncate">{value}</p>
              </div>
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${light}`}>
                <Icon className={`h-5 w-5 ${icon_c}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1">
          {(['structures', 'payments'] as const).map(t => (
            <button key={t} onClick={() => switchTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
              {t === 'structures' ? `Fee Structures (${structures.length})` : `Payments (${payments.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Search + filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {tab === 'payments' && (
          <div className="flex items-center gap-1.5">
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setPayStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  payStatusFilter === f.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Fee Structures tab ─────────────────────────────────────────────── */}
      {tab === 'structures' && (
        loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !filteredFS.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Receipt className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No fee structures found</p>
            <p className="text-xs mt-1 opacity-70">Add a fee structure or run the seed script</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-left">
                  {['Name', 'Type', 'Amount', 'Grade', 'Due Date', 'Academic Year', 'Actions'].map(h => (
                    <TableHead key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedFS.map(s => (
                  <TableRow key={s.feestructureid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors">
                    <TableCell className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate max-w-[280px]">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="default">{s.feetypename || '—'}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-400 font-mono">{formatCurrency(s.amount)}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-500">{s.gradelevelname || '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-500 font-mono text-xs">{formatDate(s.duedate)}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-500 text-xs">{s.academicyearname || '—'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setModalOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setToDelete(s.feestructureid)}>
                          <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={pageFS} totalPages={totalPagesFS} total={filteredFS.length} pageSize={PAGE_SIZE} label="fee structure" onChange={setPageFS} />
          </div>
        )
      )}

      {/* ── Payments tab ───────────────────────────────────────────────────── */}
      {tab === 'payments' && (
        loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !filteredPay.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <CheckCircle2 className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No payments recorded</p>
            <p className="text-xs mt-1 opacity-70">
              {payments.length > 0 ? 'No payments match the current filter' : 'Run the seed script to populate sample data'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-3">
              <Button variant="outline" size="sm" onClick={() => {
                exportToCSV(`fee_payments_${new Date().toISOString().slice(0,10)}`, [
                  'Receipt No', 'Student', 'Fee Structure', 'Amount', 'Date', 'Method', 'Status',
                ], filteredPay.map(p => [
                  p.receiptnumber, p.studentname, p.feestructurename,
                  p.amount, p.paymentdate?.slice(0,10),
                  METHODS[p.paymentmethod] ?? '', PAY_STATUS[p.paymentstatus]?.label ?? '',
                ]));
              }}>
                <Download className="h-4 w-4 mr-1.5" /> Export CSV
              </Button>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    {['Receipt', 'Student', 'Fee Structure', 'Amount', 'Date', 'Method', 'Status', ''].map(h => (
                      <TableHead key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {paginatedPay.map(p => {
                    const status = PAY_STATUS[p.paymentstatus] ?? { label: 'Unknown', variant: 'default' as const };
                    return (
                      <TableRow key={p.feepaymentid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors">
                        <TableCell className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{p.receiptnumber || '—'}</TableCell>
                        <TableCell className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{p.studentname || '—'}</TableCell>
                        <TableCell className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[200px]">
                          <span className="truncate block">{p.feestructurename || '—'}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-400 font-mono">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="px-4 py-3 text-slate-600 text-xs font-mono">{formatDate(p.paymentdate)}</TableCell>
                        <TableCell className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{METHODS[p.paymentmethod] ?? '—'}</TableCell>
                        <TableCell className="px-4 py-3"><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                        <TableCell className="px-2 py-3">
                          <button onClick={() => setReceiptData(p)} title="Print receipt"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination page={pagePay} totalPages={totalPagesPay} total={filteredPay.length} pageSize={PAGE_SIZE} label="payment" onChange={setPagePay} />
            </div>
          </>
        )
      )}

      {/* Fee Structure modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Fee Structure' : 'Add Fee Structure'}</DialogTitle>
          </DialogHeader>
        <FeeStructureForm
          defaultValues={editing ? {
            name:           editing.name,
            feetypeid:      editing.feetypeid || undefined,
            amount:         editing.amount,
            duedate:        editing.duedate?.slice(0, 10),
            gradelevelid:   editing.gradelevelid || undefined,
            academicyearid: editing.academicyearid || undefined,
          } : undefined}
          academicYears={academicYears}
          gradeLevels={gradeLevels}
          feeTypes={feeTypes}
          onSubmit={handleFSSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
              </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
        title="Delete fee structure?" description="This will permanently remove the fee structure."
        onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
      />

      <ReceiptDialog
        open={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData ? {
          receiptnumber: receiptData.receiptnumber,
          studentname:   receiptData.studentname,
          feestructure:  receiptData.feestructurename,
          amount:        receiptData.amount,
          paymentdate:   receiptData.paymentdate,
          paymentmethod: METHODS[receiptData.paymentmethod] ?? '—',
          paymentstatus: PAY_STATUS[receiptData.paymentstatus]?.label ?? 'Unknown',
          transactionid: receiptData.transactionid,
        } : null}
      />
    </div>
  );
}
