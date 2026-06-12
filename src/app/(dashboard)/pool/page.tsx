'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Waves, Pencil, Trash2, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/Pagination';
import { poolSessionsAPI, poolRentalsAPI, poolTransactionsAPI } from '@/lib/api-client';
import type { PoolSession } from '@/lib/dataverse/poolsessions';
import type { PoolRental } from '@/lib/dataverse/poolrentals';
import type { PoolTransaction } from '@/lib/dataverse/pooltransactions';

const PAGE_SIZE = 10;
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';
const MODES: Record<number, string>    = { 1: 'School',   2: 'Public' };
const SHIFTS: Record<number, string>   = { 1: 'Morning',  2: 'Afternoon',  3: 'Full Day' };
const SSTATUS: Record<number, string>  = { 1: 'Open',     2: 'Closed' };
const CATS: Record<number, string>     = { 1: 'Swimsuit', 2: 'Cap', 3: 'Goggles', 4: 'Fins', 5: 'Kickboard', 6: 'Other' };
const TTYPES: Record<number, string>   = { 1: 'Entry Fee',2: 'Snack', 3: 'Drink',  4: 'Swimwear', 5: 'Rental', 6: 'Other' };
const PMETHODS: Record<number, string> = { 1: 'Cash',     2: 'Mobile Money', 3: 'Card' };

const TODAY = new Date().toISOString().slice(0, 10);
const fmt = (n: number) => `GHS ${n.toFixed(2)}`;

function F({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

// ─── Session Dialog ───────────────────────────────────────────────────────────
function SessionDialog({ session, onClose, onSaved }: {
    session: PoolSession | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        defaultValues: session
            ? { name: session.name, sessiondate: session.sessiondate, mode: String(session.mode), shift: String(session.shift), entryfee: session.entryfee }
            : { name: '', sessiondate: TODAY, mode: '1', shift: '1', entryfee: 0 },
    });

    const onSubmit = async (d: { name: string; sessiondate: string; mode: string; shift: string; entryfee: number }) => {
        const payload = { ...d, mode: Number(d.mode), shift: Number(d.shift), status: 1 };
        try {
            if (session) { await poolSessionsAPI.update(session.sessionid, payload); toast.success('Session updated'); }
            else         { await poolSessionsAPI.create(payload); toast.success('Session opened'); }
            reset(); onSaved();
        } catch { toast.error('Failed to save session'); }
    };

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{session ? 'Edit Session' : 'Open New Session'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <F label="Session Name *"><Input {...register('name', { required: true })} placeholder="e.g. Session 2026-05-06 AM" /></F>
                    <div className="grid grid-cols-2 gap-3">
                        <F label="Date"><Input type="date" {...register('sessiondate')} /></F>
                        <F label="Entry Fee (GHS)"><Input type="number" step="0.01" {...register('entryfee', { valueAsNumber: true })} /></F>
                        <F label="Mode">
                            <Controller name="mode" control={control} render={({ field }) => (
                                <SelectRoot value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className={ST}><SelectValue>{(v: string) => MODES[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                                    <SelectContent>{Object.entries(MODES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                </SelectRoot>
                            )} />
                        </F>
                        <F label="Shift">
                            <Controller name="shift" control={control} render={({ field }) => (
                                <SelectRoot value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className={ST}><SelectValue>{(v: string) => SHIFTS[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                                    <SelectContent>{Object.entries(SHIFTS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                </SelectRoot>
                            )} />
                        </F>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : session ? 'Update' : 'Open Session'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Rental Dialog ────────────────────────────────────────────────────────────
function RentalDialog({ rental, onClose, onSaved }: {
    rental: PoolRental | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        defaultValues: rental
            ? { name: rental.name, category: String(rental.category), size: rental.size, totalqty: rental.totalqty, available: rental.available, inuse: rental.inuse, cleaning: rental.cleaning, damaged: rental.damaged, rentalfee: rental.rentalfee, depositfee: rental.depositfee }
            : { name: '', category: '1', size: '', totalqty: 0, available: 0, inuse: 0, cleaning: 0, damaged: 0, rentalfee: 0, depositfee: 0 },
    });

    const onSubmit = async (d: { name: string; category: string; size: string; totalqty: number; available: number; inuse: number; cleaning: number; damaged: number; rentalfee: number; depositfee: number }) => {
        const payload = { ...d, category: Number(d.category) };
        try {
            if (rental) { await poolRentalsAPI.update(rental.rentalid, payload); toast.success('Item updated'); }
            else        { await poolRentalsAPI.create(payload); toast.success('Item added'); }
            reset(); onSaved();
        } catch { toast.error('Failed to save rental item'); }
    };

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>{rental ? 'Edit Rental Item' : 'Add Rental Item'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <F label="Item Name *"><Input {...register('name', { required: true })} placeholder="e.g. Swimsuit Adult M" /></F>
                        </div>
                        <F label="Category">
                            <Controller name="category" control={control} render={({ field }) => (
                                <SelectRoot value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className={ST}><SelectValue>{(v: string) => CATS[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                                    <SelectContent>{Object.entries(CATS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                </SelectRoot>
                            )} />
                        </F>
                        <F label="Size"><Input {...register('size')} placeholder="S / M / L / XL" /></F>
                        <F label="Total Qty"><Input type="number" {...register('totalqty', { valueAsNumber: true })} /></F>
                        <F label="Available"><Input type="number" {...register('available', { valueAsNumber: true })} /></F>
                        <F label="In Use"><Input type="number" {...register('inuse', { valueAsNumber: true })} /></F>
                        <F label="Cleaning"><Input type="number" {...register('cleaning', { valueAsNumber: true })} /></F>
                        <F label="Damaged"><Input type="number" {...register('damaged', { valueAsNumber: true })} /></F>
                        <F label="Rental Fee (GHS)"><Input type="number" step="0.01" {...register('rentalfee', { valueAsNumber: true })} /></F>
                        <F label="Deposit Fee (GHS)"><Input type="number" step="0.01" {...register('depositfee', { valueAsNumber: true })} /></F>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Item'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PoolPage() {
    const [tab, setTab]                   = useState<'overview' | 'rentals' | 'sales' | 'history'>('overview');
    const [sessions, setSessions]         = useState<PoolSession[]>([]);
    const [rentals, setRentals]           = useState<PoolRental[]>([]);
    const [transactions, setTransactions] = useState<PoolTransaction[]>([]);
    const [loading, setLoading]           = useState(true);
    const [sessionDlg, setSessionDlg]     = useState(false);
    const [editSession, setEditSession]   = useState<PoolSession | null>(null);
    const [rentalDlg, setRentalDlg]       = useState(false);
    const [editRental, setEditRental]     = useState<PoolRental | null>(null);
    const [toDelete, setToDelete]         = useState<{ type: 'session' | 'rental' | 'transaction'; id: string } | null>(null);
    const [histFrom, setHistFrom]         = useState('');
    const [histTo, setHistTo]             = useState('');
    const [pageOverview, setPageOverview] = useState(1);
    const [pageRentals,  setPageRentals]  = useState(1);
    const [pageSales,    setPageSales]    = useState(1);
    const [pageHistory,  setPageHistory]  = useState(1);

    // Sales inline form state
    const [sale, setSale] = useState({ transtype: '1', itemname: '', quantity: 1, unitprice: 0, customername: '', paymentmethod: '1' });
    const [savingSale, setSavingSale]     = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [sRes, rRes, tRes] = await Promise.all([poolSessionsAPI.getAll() as any, poolRentalsAPI.getAll() as any, poolTransactionsAPI.getAll() as any]);
            setSessions(sRes.data ?? []);
            setRentals(rRes.data ?? []);
            setTransactions(tRes.data ?? []);
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    }, []);

    const loadHistory = useCallback(async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await poolTransactionsAPI.getAll({ from: histFrom || undefined, to: histTo || undefined }) as any;
            setTransactions(res.data ?? []);
        } catch { toast.error('Failed to load history'); }
    }, [histFrom, histTo]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const openSession = sessions.find(s => s.status === 1);
    const todaySessions = sessions.filter(s => s.sessiondate?.slice(0, 10) === TODAY);
    const todayRevenue = todaySessions.reduce((a, s) => a + s.totalrevenue, 0);
    const todayEntries = todaySessions.reduce((a, s) => a + s.entrycount, 0);
    const todayTx = transactions.filter(t => t.transdate?.slice(0, 10) === TODAY);

    const totalPagesOverview = Math.max(1, Math.ceil(sessions.length   / PAGE_SIZE));
    const totalPagesRentals  = Math.max(1, Math.ceil(rentals.length    / PAGE_SIZE));
    const totalPagesSales    = Math.max(1, Math.ceil(todayTx.length    / PAGE_SIZE));
    const totalPagesHistory  = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
    const paginatedSessions  = sessions.slice((pageOverview - 1) * PAGE_SIZE, pageOverview * PAGE_SIZE);
    const paginatedRentals   = rentals.slice((pageRentals - 1)   * PAGE_SIZE, pageRentals  * PAGE_SIZE);
    const paginatedTodayTx   = todayTx.slice((pageSales - 1)     * PAGE_SIZE, pageSales    * PAGE_SIZE);
    const paginatedHistory   = transactions.slice((pageHistory - 1) * PAGE_SIZE, pageHistory * PAGE_SIZE);

    const handleCloseSession = async (id: string) => {
        try { await poolSessionsAPI.update(id, { status: 2 }); toast.success('Session closed'); loadAll(); }
        catch { toast.error('Failed to close session'); }
    };

    const handleDeleteConfirm = async () => {
        if (!toDelete) return;
        try {
            if (toDelete.type === 'session')     await poolSessionsAPI.delete(toDelete.id);
            if (toDelete.type === 'rental')      await poolRentalsAPI.delete(toDelete.id);
            if (toDelete.type === 'transaction') await poolTransactionsAPI.delete(toDelete.id);
            toast.success('Deleted'); loadAll();
        } catch { toast.error('Failed to delete'); }
        finally { setToDelete(null); }
    };

    const handleSaveSale = async () => {
        if (!sale.itemname) return toast.error('Item name required');
        setSavingSale(true);
        try {
            const total = sale.quantity * sale.unitprice;
            await poolTransactionsAPI.create({
                name: `${TTYPES[Number(sale.transtype) as keyof typeof TTYPES]} - ${sale.itemname} (${TODAY})`,
                transdate: TODAY,
                sessionref: openSession?.sessionid ?? '',
                transtype: Number(sale.transtype),
                itemname: sale.itemname,
                quantity: sale.quantity,
                unitprice: sale.unitprice,
                totalamount: total,
                customername: sale.customername,
                paymentmethod: Number(sale.paymentmethod),
            });
            toast.success('Sale recorded');
            setSale({ transtype: '1', itemname: '', quantity: 1, unitprice: 0, customername: '', paymentmethod: '1' });
            loadAll();
        } catch { toast.error('Failed to record sale'); }
        finally { setSavingSale(false); }
    };

    const switchTab = (t: typeof tab) => { setTab(t); setPageOverview(1); setPageRentals(1); setPageSales(1); setPageHistory(1); };
    const TAB_CLS = (t: typeof tab) =>
        `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`;
    const TAB_LABELS: Record<typeof tab, string> = {
        overview: `Overview${sessions.length > 0 ? ` (${sessions.length})` : ''}`,
        rentals:  `Rentals${rentals.length > 0 ? ` (${rentals.length})` : ''}`,
        sales:    `Sales${todayTx.length > 0 ? ` (${todayTx.length})` : ''}`,
        history:  `History${transactions.length > 0 ? ` (${transactions.length})` : ''}`,
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Waves className="h-6 w-6 text-blue-500" /> Swimming Pool
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''} total</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadAll}><RefreshCw className="h-4 w-4 mr-1.5" /> Refresh</Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                {(['overview', 'rentals', 'sales', 'history'] as const).map(t => (
                    <button key={t} type="button" onClick={() => switchTab(t)} className={TAB_CLS(t)}>{TAB_LABELS[t]}</button>
                ))}
            </div>

            {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
            {tab === 'overview' && (
                <div className="space-y-5">
                    {/* Stat cards */}
                    <div className="grid gap-4 sm:grid-cols-4">
                        {[
                            { label: "Today's Mode",    value: openSession ? (MODES[openSession.mode as keyof typeof MODES] ?? '—') : '—',  accent: 'bg-indigo-500', light: 'bg-indigo-50 dark:bg-indigo-900/20', textc: 'text-indigo-600', border: 'border-indigo-100 dark:border-indigo-800' },
                            { label: 'Open Session',    value: openSession ? openSession.name : 'None',                                     accent: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', textc: 'text-emerald-600', border: 'border-emerald-100 dark:border-emerald-800' },
                            { label: "Total Entries",   value: String(todayEntries),                                                         accent: 'bg-blue-500',    light: 'bg-blue-50 dark:bg-blue-900/20',       textc: 'text-blue-600',    border: 'border-blue-100 dark:border-blue-800' },
                            { label: 'Revenue Today',   value: fmt(todayRevenue),                                                            accent: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-900/20',     textc: 'text-amber-600',   border: 'border-amber-100 dark:border-amber-800' },
                        ].map(({ label, value, accent, light, textc, border }) => (
                            <div key={label} className={`relative rounded-xl border bg-white dark:bg-slate-900 p-4 shadow-sm overflow-hidden ${border}`}>
                                <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mt-1">{label}</p>
                                <p className={`mt-2 text-lg font-bold leading-none ${textc}`}>{value}</p>
                                <div className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl ${light}`}>
                                    <Waves className={`h-4 w-4 ${textc}`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button onClick={() => { setEditSession(null); setSessionDlg(true); }}>
                            <Plus className="h-4 w-4 mr-1" /> Open New Session
                        </Button>
                    </div>

                    {/* Active session card */}
                    {openSession && (
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-emerald-800 dark:text-emerald-200">{openSession.name}</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        {MODES[openSession.mode as keyof typeof MODES]} &middot; {SHIFTS[openSession.shift as keyof typeof SHIFTS]} &middot; {openSession.entrycount} entries &middot; {fmt(openSession.totalrevenue)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => { setEditSession(openSession); setSessionDlg(true); }}>
                                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={() => handleCloseSession(openSession.sessionid)}>
                                        <X className="h-3.5 w-3.5 mr-1" /> Close Session
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent sessions table */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recent Sessions</h2>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {['Date', 'Mode', 'Shift', 'Entries', 'Revenue', 'Status', ''].map(h => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedSessions.map(s => (
                                        <TableRow key={s.sessionid}>
                                            <TableCell className="text-sm">{s.sessiondate?.slice(0, 10) || '—'}</TableCell>
                                            <TableCell className="text-sm">{MODES[s.mode as keyof typeof MODES] ?? '—'}</TableCell>
                                            <TableCell className="text-sm">{SHIFTS[s.shift as keyof typeof SHIFTS] ?? '—'}</TableCell>
                                            <TableCell className="text-sm font-semibold">{s.entrycount}</TableCell>
                                            <TableCell className="text-sm">{fmt(s.totalrevenue)}</TableCell>
                                            <TableCell>
                                                <Badge variant={s.status === 1 ? 'success' : 'default'}>{SSTATUS[s.status as keyof typeof SSTATUS] ?? '—'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditSession(s); setSessionDlg(true); }}>
                                                        <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setToDelete({ type: 'session', id: s.sessionid })}>
                                                        <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!sessions.length && (
                                        <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400 text-sm">No sessions yet</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <Pagination page={pageOverview} totalPages={totalPagesOverview} total={sessions.length} pageSize={PAGE_SIZE} label="session" onChange={setPageOverview} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── RENTALS ──────────────────────────────────────────────────────── */}
            {tab === 'rentals' && (
                <div className="space-y-4">
                    <Button onClick={() => { setEditRental(null); setRentalDlg(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Rental Item
                    </Button>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {['Item', 'Category', 'Size', 'Available', 'In Use', 'Cleaning', 'Damaged', 'Rental Fee', 'Deposit', ''].map(h => (
                                        <TableHead key={h}>{h}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRentals.map(r => (
                                    <TableRow key={r.rentalid}>
                                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">{r.name}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{CATS[r.category as keyof typeof CATS] ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{r.size || '—'}</TableCell>
                                        <TableCell><span className="text-emerald-600 font-semibold">{r.available}</span></TableCell>
                                        <TableCell><span className="text-blue-600 font-semibold">{r.inuse}</span></TableCell>
                                        <TableCell><span className="text-amber-600 font-semibold">{r.cleaning}</span></TableCell>
                                        <TableCell><span className="text-red-500 font-semibold">{r.damaged}</span></TableCell>
                                        <TableCell className="text-sm">{fmt(r.rentalfee)}</TableCell>
                                        <TableCell className="text-sm">{fmt(r.depositfee)}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditRental(r); setRentalDlg(true); }}>
                                                    <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setToDelete({ type: 'rental', id: r.rentalid })}>
                                                    <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!rentals.length && (
                                    <TableRow><TableCell colSpan={10} className="text-center py-10 text-slate-400 text-sm">No rental items yet</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <Pagination page={pageRentals} totalPages={totalPagesRentals} total={rentals.length} pageSize={PAGE_SIZE} label="item" onChange={setPageRentals} />
                    </div>
                </div>
            )}

            {/* ── SALES ────────────────────────────────────────────────────────── */}
            {tab === 'sales' && (
                <div className="space-y-5">
                    {/* Inline sale form */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Record Sale</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>Type</Label>
                                <SelectRoot value={sale.transtype} onValueChange={v => setSale(p => ({ ...p, transtype: v ?? '' }))}>
                                    <SelectTrigger className={ST}><SelectValue>{(v: string) => TTYPES[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                                    <SelectContent>{Object.entries(TTYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                </SelectRoot>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Item Name</Label>
                                <Input value={sale.itemname} onChange={e => setSale(p => ({ ...p, itemname: e.target.value }))} placeholder="e.g. Fanta" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Qty</Label>
                                <Input type="number" value={sale.quantity} onChange={e => setSale(p => ({ ...p, quantity: Number(e.target.value) }))} min={1} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Unit Price (GHS)</Label>
                                <Input type="number" step="0.01" value={sale.unitprice} onChange={e => setSale(p => ({ ...p, unitprice: Number(e.target.value) }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Total</Label>
                                <Input readOnly value={fmt(sale.quantity * sale.unitprice)} className="bg-slate-50 dark:bg-slate-800/60" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Customer</Label>
                                <Input value={sale.customername} onChange={e => setSale(p => ({ ...p, customername: e.target.value }))} placeholder="Optional" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Payment</Label>
                                <SelectRoot value={sale.paymentmethod} onValueChange={v => setSale(p => ({ ...p, paymentmethod: v ?? '' }))}>
                                    <SelectTrigger className={ST}><SelectValue>{(v: string) => PMETHODS[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                                    <SelectContent>{Object.entries(PMETHODS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                </SelectRoot>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSaveSale} disabled={savingSale}>{savingSale ? 'Saving…' : 'Save Sale'}</Button>
                        </div>
                    </div>

                    {/* Today's transactions */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Today&apos;s Sales</h2>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {['Type', 'Item', 'Qty', 'Total', 'Customer', 'Payment', ''].map(h => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedTodayTx.map(t => (
                                        <TableRow key={t.transactionid}>
                                            <TableCell className="text-sm">{TTYPES[t.transtype as keyof typeof TTYPES] ?? '—'}</TableCell>
                                            <TableCell className="text-sm">{t.itemname || '—'}</TableCell>
                                            <TableCell className="text-sm">{t.quantity}</TableCell>
                                            <TableCell className="text-sm font-semibold">{fmt(t.totalamount)}</TableCell>
                                            <TableCell className="text-sm">{t.customername || '—'}</TableCell>
                                            <TableCell className="text-sm">{PMETHODS[t.paymentmethod as keyof typeof PMETHODS] ?? '—'}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => setToDelete({ type: 'transaction', id: t.transactionid })}>
                                                    <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!todayTx.length && (
                                        <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400 text-sm">No sales today yet</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <Pagination page={pageSales} totalPages={totalPagesSales} total={todayTx.length} pageSize={PAGE_SIZE} label="transaction" onChange={setPageSales} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── HISTORY ──────────────────────────────────────────────────────── */}
            {tab === 'history' && (
                <div className="space-y-4">
                    {/* Date range filter */}
                    <div className="flex items-end gap-3 flex-wrap">
                        <div className="space-y-1.5">
                            <Label>From</Label>
                            <DatePicker value={histFrom} onChange={setHistFrom} className="h-10 w-44" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>To</Label>
                            <DatePicker value={histTo} onChange={setHistTo} className="h-10 w-44" />
                        </div>
                        <Button variant="outline" onClick={loadHistory}>Apply</Button>
                        <Button variant="outline" onClick={() => { setHistFrom(''); setHistTo(''); loadAll(); }}>Clear</Button>
                    </div>

                    {/* Summary cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        {[
                            { label: 'Total Revenue',      value: fmt(transactions.reduce((a, t) => a + t.totalamount, 0)) },
                            { label: 'Total Transactions', value: String(transactions.length) },
                            { label: 'Total Qty Sold',     value: String(transactions.reduce((a, t) => a + t.quantity, 0)) },
                        ].map(({ label, value }) => (
                            <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* All transactions */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {['Date', 'Type', 'Item', 'Qty', 'Unit', 'Total', 'Customer', 'Payment', ''].map(h => (
                                        <TableHead key={h}>{h}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedHistory.map(t => (
                                    <TableRow key={t.transactionid}>
                                        <TableCell className="text-xs text-slate-500">{t.transdate?.slice(0, 10) || '—'}</TableCell>
                                        <TableCell className="text-xs">{TTYPES[t.transtype as keyof typeof TTYPES] ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{t.itemname || '—'}</TableCell>
                                        <TableCell className="text-sm">{t.quantity}</TableCell>
                                        <TableCell className="text-sm">{fmt(t.unitprice)}</TableCell>
                                        <TableCell className="text-sm font-semibold">{fmt(t.totalamount)}</TableCell>
                                        <TableCell className="text-sm">{t.customername || '—'}</TableCell>
                                        <TableCell className="text-xs">{PMETHODS[t.paymentmethod as keyof typeof PMETHODS] ?? '—'}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete({ type: 'transaction', id: t.transactionid })}>
                                                <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!transactions.length && (
                                    <TableRow><TableCell colSpan={9} className="text-center py-10 text-slate-400 text-sm">No transactions found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <Pagination page={pageHistory} totalPages={totalPagesHistory} total={transactions.length} pageSize={PAGE_SIZE} label="transaction" onChange={setPageHistory} />
                    </div>
                </div>
            )}

            {/* Dialogs */}
            {sessionDlg && (
                <SessionDialog
                    session={editSession}
                    onClose={() => { setSessionDlg(false); setEditSession(null); }}
                    onSaved={() => { setSessionDlg(false); setEditSession(null); loadAll(); }}
                />
            )}
            {rentalDlg && (
                <RentalDialog
                    rental={editRental}
                    onClose={() => { setRentalDlg(false); setEditRental(null); }}
                    onSaved={() => { setRentalDlg(false); setEditRental(null); loadAll(); }}
                />
            )}
            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={o => !o && setToDelete(null)}
                title="Delete record?"
                description="This will permanently remove the record."
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
