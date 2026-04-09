'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { feesAPI } from '@/lib/api-client';
import type { FeePayment, FeeStructure } from '@/lib/dataverse/fees';

const schema = z.object({
  studentid:      z.string().min(1, 'Required'),
  feestructureid: z.string().min(1, 'Required'),
  amount:         z.coerce.number().min(0.01, 'Required'),
  paymentdate:    z.string().min(1, 'Required'),
  paymentmethod:  z.coerce.number().min(1),
  transactionid:  z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

const METHODS: Record<number, string> = { 1: 'Cash', 2: 'Bank Transfer', 3: 'Card', 4: 'Mobile Money' };
const PAY_STATUS: Record<number, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  1: { label: 'Paid',    variant: 'success' },
  2: { label: 'Pending', variant: 'warning' },
  3: { label: 'Failed',  variant: 'error' },
};

function PaymentForm({ structures, onSubmit, onCancel }: {
  structures: FeeStructure[];
  onSubmit: (d: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentmethod: 1 },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Student ID *</label>
          <Input {...register('studentid')} placeholder="Student ID" />
          {errors.studentid && <p className="text-xs text-red-500 mt-1">{errors.studentid.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Fee Structure *</label>
          <Select {...register('feestructureid')}>
            <option value="">Select…</option>
            {structures.map((s) => (
              <option key={s.feestructureid} value={s.feestructureid}>
                Grade {s.gradelevel} · ${s.amount}
              </option>
            ))}
          </Select>
          {errors.feestructureid && <p className="text-xs text-red-500 mt-1">{errors.feestructureid.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Amount *</label>
          <Input {...register('amount')} type="number" step="0.01" />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Payment Date *</label>
          <Input {...register('paymentdate')} type="date" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Method *</label>
          <Select {...register('paymentmethod')}>
            {Object.entries(METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Transaction ID *</label>
          <Input {...register('transactionid')} placeholder="TXN-…" />
          {errors.transactionid && <p className="text-xs text-red-500 mt-1">{errors.transactionid.message}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Recording…' : 'Record Payment'}</Button>
      </div>
    </form>
  );
}

export default function FeesPage() {
  const [payments, setPayments]     = useState<FeePayment[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [revenue, setRevenue]       = useState<{ totalRevenue: number; totalPayments: number } | null>(null);
  const [filtered, setFiltered]     = useState<FeePayment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [structRes, revRes]: any[] = await Promise.all([
        feesAPI.getStructures(),
        feesAPI.getRevenue(),
      ]);
      setStructures(structRes.data ?? []);
      setRevenue(revRes.data ?? null);
      // No global payments list endpoint — show structures as placeholder
      setPayments([]);
      setFiltered([]);
    } catch { toast.error('Failed to load fees data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? payments.filter((p) => p.transactionid.toLowerCase().includes(q) || p.receiptnumber.toLowerCase().includes(q)) : payments);
  }, [search, payments]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      await feesAPI.createPayment(data);
      toast.success('Payment recorded');
      setModalOpen(false);
      load();
    } catch { toast.error('Failed to record payment'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fee structures and payments</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
      </div>

      {/* Revenue cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${(revenue?.totalRevenue ?? 0).toLocaleString()}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{revenue?.totalPayments ?? 0}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Fee Structures</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{structures.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee structures table */}
      <Card>
        <CardHeader><CardTitle>Fee Structures</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" /></div>
          ) : !structures.length ? (
            <div className="text-center py-10 text-gray-400 text-sm">No fee structures defined</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Grade Level','Academic Year','Fee Type','Amount','Due Date'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {structures.map((s) => (
                    <tr key={s.feestructureid} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium">Grade {s.gradelevel}</td>
                      <td className="px-3 py-3 text-gray-500">{s.academicyear}</td>
                      <td className="px-3 py-3 text-gray-500">{s.feetype}</td>
                      <td className="px-3 py-3 font-semibold text-green-700">${s.amount.toLocaleString()}</td>
                      <td className="px-3 py-3 text-gray-500">{s.duedate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent payments */}
      {payments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search…" className="pl-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Receipt','Student','Amount','Date','Method','Status'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => {
                    const status = PAY_STATUS[p.status] ?? { label: 'Unknown', variant: 'default' as const };
                    return (
                      <tr key={p.paymentid} className="hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono text-xs">{p.receiptnumber}</td>
                        <td className="px-3 py-3">{p.studentname ?? p.studentid}</td>
                        <td className="px-3 py-3 font-semibold text-green-700">${p.amount.toLocaleString()}</td>
                        <td className="px-3 py-3 text-gray-500">{p.paymentdate}</td>
                        <td className="px-3 py-3 text-gray-500">{METHODS[p.paymentmethod] ?? p.paymentmethod}</td>
                        <td className="px-3 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Fee Payment">
        <PaymentForm structures={structures} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
