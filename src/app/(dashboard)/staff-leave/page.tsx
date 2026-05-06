'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, CalendarOff, RefreshCw, Download, Check, X } from 'lucide-react';
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
import { staffLeaveAPI } from '@/lib/api-client';
import type { StaffLeave } from '@/lib/dataverse/staffleave';

const PAGE_SIZE = 10;
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const LEAVE_TYPES: Record<number, string> = {
    1: 'Annual', 2: 'Sick', 3: 'Maternity/Paternity', 4: 'Compassionate', 5: 'Study', 6: 'Unpaid',
};
const STATUSES: Record<number, string> = { 1: 'Pending', 2: 'Approved', 3: 'Rejected', 4: 'Cancelled' };
const STATUS_VARIANT: Record<number, 'warning' | 'success' | 'destructive' | 'default'> = {
    1: 'warning', 2: 'success', 3: 'destructive', 4: 'default',
};

const schema = z.object({
    employeeid:   z.string().min(1, 'Required'),
    employeename: z.string().optional(),
    leavetype:    z.string().min(1, 'Required'),
    startdate:    z.string().min(1, 'Required'),
    enddate:      z.string().min(1, 'Required'),
    reason:       z.string().optional(),
    status:       z.string().default('1'),
    approvedby:   z.string().optional(),
    comments:     z.string().optional(),
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

function LeaveForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: { leavetype: '1', status: '1', ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
                <F id="employeeid" label="Employee ID *" error={errors.employeeid?.message}>
                    <Input id="employeeid" {...register('employeeid')} placeholder="Employee GUID" />
                </F>
                <F id="employeename" label="Employee Name">
                    <Input id="employeename" {...register('employeename')} />
                </F>

                <F id="leavetype" label="Leave Type *" error={errors.leavetype?.message}>
                    <Controller name="leavetype" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '1'} onValueChange={v => field.onChange(v ?? '1')}>
                            <SelectTrigger id="leavetype" className={ST}><SelectValue>{(v: string) => LEAVE_TYPES[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {Object.entries(LEAVE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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

                <F id="startdate" label="Start Date *" error={errors.startdate?.message}>
                    <Controller control={control} name="startdate" render={({ field }) => (
                        <DatePicker id="startdate" value={field.value} onChange={field.onChange} />
                    )} />
                </F>

                <F id="enddate" label="End Date *" error={errors.enddate?.message}>
                    <Controller control={control} name="enddate" render={({ field }) => (
                        <DatePicker id="enddate" value={field.value} onChange={field.onChange} />
                    )} />
                </F>
            </div>

            <F id="reason" label="Reason">
                <Textarea id="reason" {...register('reason')} rows={2} />
            </F>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval</p>
                <div className="grid grid-cols-2 gap-4">
                    <F id="approvedby" label="Approved By">
                        <Input id="approvedby" {...register('approvedby')} />
                    </F>
                    <div className="col-span-2">
                        <F id="comments" label="Comments">
                            <Textarea id="comments" {...register('comments')} rows={2} />
                        </F>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
            </div>
        </form>
    );
}

export default function StaffLeavePage() {
    const [rows, setRows]           = useState<StaffLeave[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]           = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<StaffLeave | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await staffLeaveAPI.getAll();
            setRows(res.data ?? []);
        } catch { toast.error('Failed to load leave records'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return rows.filter(r =>
            (!statusFilter || String(r.status) === statusFilter) &&
            (!q || `${r.employeename} ${r.reason}`.toLowerCase().includes(q))
        );
    }, [search, statusFilter, rows]);

    const pending    = rows.filter(r => r.status === 1).length;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const daysBetween = (start: string, end: string) => {
        if (!start || !end) return 0;
        return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        const days = daysBetween(data.startdate, data.enddate);
        const payload = { ...data, leavetype: Number(data.leavetype), status: Number(data.status), days };
        try {
            if (editing) { await staffLeaveAPI.update(editing.leaveid, payload); toast.success('Updated'); }
            else         { await staffLeaveAPI.create(payload);                  toast.success('Leave request created'); }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const quickStatus = async (id: string, status: number) => {
        try { await staffLeaveAPI.update(id, { status }); toast.success(status === 2 ? 'Approved' : 'Rejected'); load(); }
        catch { toast.error('Failed to update status'); }
    };

    const handleDelete = async (id: string) => {
        try { await staffLeaveAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Staff Leave</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {rows.length} record{rows.length !== 1 ? 's' : ''}
                        {pending > 0 && <span className="ml-2 text-amber-600 font-medium">· {pending} pending</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        exportToCSV(`staff_leave_${new Date().toISOString().slice(0, 10)}`, [
                            'Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Approved By',
                        ], filtered.map(r => [
                            r.employeename, LEAVE_TYPES[r.leavetype] ?? '',
                            r.startdate?.slice(0, 10), r.enddate?.slice(0, 10),
                            r.days || daysBetween(r.startdate, r.enddate),
                            STATUSES[r.status] ?? '', r.approvedby,
                        ]));
                    }}>
                        <Download className="h-4 w-4 mr-1.5" /> Export CSV
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> New Request
                    </Button>
                </div>
            </div>

            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="Search by employee…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <CalendarOff className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No leave records found</p>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800">
                                {['Employee', 'Leave Type', 'Period', 'Days', 'Reason', 'Status', ''].map(h => (
                                    <TableHead key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {paginated.map(r => {
                                const days = r.days || daysBetween(r.startdate, r.enddate);
                                return (
                                    <TableRow key={r.leaveid} className="hover:bg-blue-50/30 dark:hover:bg-gray-800/50 transition-colors">
                                        <TableCell className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{r.employeename || '—'}</p>
                                            {r.approvedby && <p className="text-xs text-gray-400">Approved by: {r.approvedby}</p>}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500">{LEAVE_TYPES[r.leavetype] ?? '—'}</TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 font-mono text-xs">
                                            <div>{r.startdate?.slice(0, 10)}</div>
                                            <div className="text-gray-400">→ {r.enddate?.slice(0, 10)}</div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-900 dark:text-gray-100 font-semibold">{days}</TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{r.reason || '—'}</TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge variant={STATUS_VARIANT[r.status] ?? 'default'}>{STATUSES[r.status] ?? 'Unknown'}</Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {r.status === 1 && (
                                                    <>
                                                        <Button variant="ghost" size="icon" title="Approve" onClick={() => quickStatus(r.leaveid, 2)}>
                                                            <Check className="h-4 w-4 text-green-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" title="Reject" onClick={() => quickStatus(r.leaveid, 3)}>
                                                            <X className="h-4 w-4 text-red-400" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setToDelete(r.leaveid)}>
                                                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="record" onChange={setPage} />
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Leave Request' : 'New Leave Request'}</DialogTitle>
                    </DialogHeader>
                    <LeaveForm
                        defaultValues={editing ? {
                            employeeid: editing.employeeid, employeename: editing.employeename,
                            leavetype: String(editing.leavetype), startdate: editing.startdate?.slice(0, 10),
                            enddate: editing.enddate?.slice(0, 10), reason: editing.reason,
                            status: String(editing.status), approvedby: editing.approvedby, comments: editing.comments,
                        } : undefined}
                        onSubmit={handleSubmit}
                        onCancel={() => { setModalOpen(false); setEditing(null); }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete record?" description="This will permanently remove the leave request."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
