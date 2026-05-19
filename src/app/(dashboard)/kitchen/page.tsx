'use client';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw, Download, UtensilsCrossed, Users, DollarSign, CalendarDays, CheckCircle2, XCircle, Clock, UserPlus } from 'lucide-react';
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/Pagination';
import { kitchenMenusAPI, mealOrdersAPI, studentsAPI } from '@/lib/api-client';
import { exportToCSV } from '@/lib/csv';
import type { KitchenMenu } from '@/lib/dataverse/kitchen';
import type { MealOrder } from '@/lib/dataverse/mealOrders';

const PAGE_SIZE = 10;
const ST  = 'w-full h-10! bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';
const SF  = 'h-10! bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const MEAL: Record<number, string>  = { 1: 'Breakfast', 2: 'Lunch', 3: 'Dinner', 4: 'Snack' };
const MEAL_COLOR: Record<number, string> = {
    1: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    3: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    4: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};
const MSTATUS: Record<number, string>  = { 1: 'Planned', 2: 'Served', 3: 'Cancelled' };
const PSTATUS: Record<number, string>  = { 1: 'Paid', 2: 'Unpaid', 3: 'Free' };
const PSTATUS_COLOR: Record<number, string> = {
    1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    2: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    3: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
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

// ─── Menu Form ────────────────────────────────────────────────────────────────
const menuSchema = z.object({
    menudate:    z.string().min(1, 'Required'),
    mealtype:    z.string().default('2'),
    items:       z.string().optional(),
    price:       z.coerce.number().min(0).optional(),
    totalserved: z.coerce.number().min(0).optional(),
    status:      z.string().default('1'),
});
type MenuFormData = z.infer<typeof menuSchema>;

function MenuForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<MenuFormData>;
    onSubmit: (d: MenuFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<MenuFormData>({
        resolver: zodResolver(menuSchema) as never,
        defaultValues: { mealtype: '2', status: '1', ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <F id="menudate" label="Date *" error={errors.menudate?.message}>
                    <Controller name="menudate" control={control} render={({ field }) => (
                        <DatePicker id="menudate" value={field.value ?? ''} onChange={field.onChange} placeholder="Pick a date" className="h-10! w-full" />
                    )} />
                </F>
                <F id="mealtype" label="Meal Type *">
                    <Controller name="mealtype" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '2'} onValueChange={v => field.onChange(v ?? '2')}>
                            <SelectTrigger id="mealtype" className={ST}><SelectValue>{(v: string) => MEAL[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                            <SelectContent>{Object.entries(MEAL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </SelectRoot>
                    )} />
                </F>
            </div>
            <F id="items" label="Menu Items">
                <Textarea id="items" {...register('items')} rows={3} placeholder="e.g. Rice, Chicken stew, Salad, Water" />
            </F>
            <div className="grid grid-cols-3 gap-4">
                <F id="price" label="Price per Meal">
                    <Input id="price" type="number" min={0} step={0.01} {...register('price')} placeholder="0.00" />
                </F>
                <F id="totalserved" label="Portions Served">
                    <Input id="totalserved" type="number" min={0} {...register('totalserved')} placeholder="0" />
                </F>
                <F id="status" label="Status">
                    <Controller name="status" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '1'} onValueChange={v => field.onChange(v ?? '1')}>
                            <SelectTrigger id="status" className={ST}><SelectValue>{(v: string) => MSTATUS[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                            <SelectContent>{Object.entries(MSTATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
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

// ─── Order Form ───────────────────────────────────────────────────────────────
interface StudentOption { studentid: string; fullname: string; }

function OrderForm({ menus, onSubmit, onCancel }: {
    menus: KitchenMenu[];
    onSubmit: (d: { menuid: string; studentid: string; studentname: string; amount: number; paymentstatus: number }) => Promise<void>;
    onCancel: () => void;
}) {
    const [studentSearch, setStudentSearch] = useState('');
    const [suggestions, setSuggestions]     = useState<StudentOption[]>([]);
    const [selected, setSelected]           = useState<StudentOption | null>(null);
    const [menuid, setMenuid]               = useState(menus[0]?.menuid ?? '');
    const [amount, setAmount]               = useState('');
    const [paymentstatus, setPaymentstatus] = useState('1');
    const [submitting, setSubmitting]       = useState(false);

    useEffect(() => {
        if (!studentSearch.trim() || studentSearch.trim().length < 2) { setSuggestions([]); return; }
        const t = setTimeout(async () => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const res: any = await studentsAPI.getAll({ search: studentSearch.trim(), pageSize: 10 });
                const rows = res.data?.items ?? res.data ?? [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setSuggestions(rows.map((s: any) => ({ studentid: s.studentid, fullname: s.fullname || `${s.firstname} ${s.lastname}`.trim() })));
            } catch { setSuggestions([]); }
        }, 300);
        return () => clearTimeout(t);
    }, [studentSearch]);

    const selectedMenu = menus.find(m => m.menuid === menuid);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) { toast.error('Select a student'); return; }
        if (!menuid)   { toast.error('Select a menu'); return; }
        setSubmitting(true);
        try {
            await onSubmit({
                menuid,
                studentid:     selected.studentid,
                studentname:   selected.fullname,
                amount:        Number(amount) || selectedMenu?.price || 0,
                paymentstatus: Number(paymentstatus),
            });
        } finally { setSubmitting(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <F id="menuid" label="Menu *">
                <SelectRoot value={menuid} onValueChange={v => setMenuid(v ?? '')}>
                    <SelectTrigger id="menuid" className={ST}>
                        <SelectValue>{(v: string) => { const m = menus.find(x => x.menuid === v); return m ? `${m.menudate} – ${MEAL[m.mealtype]}` : 'Select menu'; }}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {menus.map(m => <SelectItem key={m.menuid} value={m.menuid}>{m.menudate} – {MEAL[m.mealtype]}</SelectItem>)}
                    </SelectContent>
                </SelectRoot>
            </F>
            <F id="student" label="Student *">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                        id="student"
                        className="pl-8"
                        placeholder="Search student…"
                        value={selected ? selected.fullname : studentSearch}
                        onChange={e => { setSelected(null); setStudentSearch(e.target.value); }}
                    />
                    {suggestions.length > 0 && !selected && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.map(s => (
                                <button key={s.studentid} type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                    onClick={() => { setSelected(s); setStudentSearch(s.fullname); setSuggestions([]); }}>
                                    {s.fullname}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </F>
            <div className="grid grid-cols-2 gap-4">
                <F id="amount" label="Amount">
                    <Input id="amount" type="number" min={0} step={0.01} value={amount} onChange={e => setAmount(e.target.value)}
                        placeholder={selectedMenu?.price ? String(selectedMenu.price) : '0.00'} />
                </F>
                <F id="paymentstatus" label="Payment">
                    <SelectRoot value={paymentstatus} onValueChange={v => setPaymentstatus(v ?? '1')}>
                        <SelectTrigger id="paymentstatus" className={ST}><SelectValue>{(v: string) => PSTATUS[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                        <SelectContent>{Object.entries(PSTATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </SelectRoot>
                </F>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={submitting || !selected}>{submitting ? 'Recording…' : 'Record Meal'}</Button>
            </div>
        </form>
    );
}

// ─── Setup Guide ─────────────────────────────────────────────────────────────
function SetupGuide({ table, columns }: { table: string; columns: string[] }) {
    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Dataverse table required: <code className="font-mono text-xs bg-amber-100 dark:bg-amber-800/40 rounded px-1">{table}</code></p>
            <ul className="mt-1 space-y-0.5 text-xs font-mono list-disc list-inside">
                {columns.map(c => <li key={c}>{c}</li>)}
            </ul>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KitchenPage() {
    const [tab, setTab] = useState('menus');

    // Menus state
    const [menus, setMenus]             = useState<KitchenMenu[]>([]);
    const [menusLoading, setMenusLoad]  = useState(true);
    const [menusSetup, setMenusSetup]   = useState(false);
    const [menuSearch, setMenuSearch]   = useState('');
    const [mealFilter, setMealFilter]   = useState('');
    const [dateFilter, setDateFilter]   = useState('');
    const [menuPage, setMenuPage]       = useState(1);
    const [menuModal, setMenuModal]     = useState(false);
    const [editingMenu, setEditingMenu] = useState<KitchenMenu | null>(null);
    const [deleteMenuId, setDeleteMenuId] = useState<string | null>(null);

    // Orders state
    const [orders, setOrders]           = useState<MealOrder[]>([]);
    const [ordersLoading, setOrdersLoad] = useState(true);
    const [ordersSetup, setOrdersSetup] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');
    const [orderDateFilter, setOrderDateFilter] = useState('');
    const [payFilter, setPayFilter]     = useState('');
    const [orderPage, setOrderPage]     = useState(1);
    const [orderModal, setOrderModal]   = useState(false);
    const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);

    const today = new Date().toISOString().slice(0, 10);

    const loadMenus = useCallback(async () => {
        setMenusLoad(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await kitchenMenusAPI.getAll();
            if (res.setup_required) { setMenusSetup(true); setMenus([]); }
            else { setMenus(res.data ?? []); }
        } catch { toast.error('Failed to load menus'); }
        finally { setMenusLoad(false); }
    }, []);

    const loadOrders = useCallback(async () => {
        setOrdersLoad(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await mealOrdersAPI.getAll();
            if (res.setup_required) { setOrdersSetup(true); setOrders([]); }
            else { setOrders(res.data ?? []); }
        } catch { toast.error('Failed to load orders'); }
        finally { setOrdersLoad(false); }
    }, []);

    useEffect(() => { loadMenus(); loadOrders(); }, [loadMenus, loadOrders]);
    useEffect(() => { setMenuPage(1); }, [menuSearch, mealFilter, dateFilter]);
    useEffect(() => { setOrderPage(1); }, [orderSearch, orderDateFilter, payFilter]);

    // ── Stats ────────────────────────────────────────────────────────────────
    const todayMenus   = menus.filter(m => m.menudate === today);
    const todayOrders  = orders.filter(o => o.orderdate === today);
    const todayRevenue = todayOrders.filter(o => o.paymentstatus === 1).reduce((s, o) => s + o.amount, 0);
    const totalServed  = menus.reduce((s, m) => s + m.totalserved, 0);

    // ── Filtered menus ───────────────────────────────────────────────────────
    const filteredMenus = useMemo(() => {
        const q = menuSearch.toLowerCase();
        return menus.filter(m =>
            (!mealFilter || String(m.mealtype) === mealFilter) &&
            (!dateFilter || m.menudate === dateFilter) &&
            (!q || m.items.toLowerCase().includes(q) || m.menudate.includes(q))
        );
    }, [menus, menuSearch, mealFilter, dateFilter]);

    const menuTotalPages = Math.max(1, Math.ceil(filteredMenus.length / PAGE_SIZE));
    const paginatedMenus = filteredMenus.slice((menuPage - 1) * PAGE_SIZE, menuPage * PAGE_SIZE);

    // ── Filtered orders ──────────────────────────────────────────────────────
    const filteredOrders = useMemo(() => {
        const q = orderSearch.toLowerCase();
        return orders.filter(o =>
            (!payFilter || String(o.paymentstatus) === payFilter) &&
            (!orderDateFilter || o.orderdate === orderDateFilter) &&
            (!q || o.studentname.toLowerCase().includes(q) || o.menuname.toLowerCase().includes(q))
        );
    }, [orders, orderSearch, orderDateFilter, payFilter]);

    const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const paginatedOrders = filteredOrders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleMenuSubmit = async (data: MenuFormData) => {
        const payload = { ...data, mealtype: Number(data.mealtype), status: Number(data.status) };
        try {
            if (editingMenu) { await kitchenMenusAPI.update(editingMenu.menuid, payload); toast.success('Menu updated'); }
            else             { await kitchenMenusAPI.create(payload);                     toast.success('Menu created'); }
            setMenuModal(false); setEditingMenu(null); loadMenus();
        } catch { toast.error('Failed to save menu'); }
    };

    const handleMenuDelete = async (id: string) => {
        try { await kitchenMenusAPI.delete(id); toast.success('Deleted'); loadMenus(); }
        catch { toast.error('Failed to delete'); }
    };

    const handleOrderSubmit = async (d: { menuid: string; studentid: string; studentname: string; amount: number; paymentstatus: number }) => {
        const menu = menus.find(m => m.menuid === d.menuid);
        try {
            await mealOrdersAPI.create({
                ...d,
                menuname:  menu?.name ?? '',
                mealtype:  menu?.mealtype ?? 2,
                orderdate: today,
            });
            toast.success(`Meal recorded for ${d.studentname}`);
            setOrderModal(false); loadOrders();
            // bump menu totalserved
            if (menu) { await kitchenMenusAPI.update(menu.menuid, { totalserved: menu.totalserved + 1 }); loadMenus(); }
        } catch { toast.error('Failed to record meal'); }
    };

    const handleOrderDelete = async (id: string) => {
        try { await mealOrdersAPI.delete(id); toast.success('Deleted'); loadOrders(); }
        catch { toast.error('Failed to delete'); }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const CARDS = [
        { label: "Today's Menus",  value: todayMenus.length,   sub: `${menus.length} total`,         accent: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-900/20',   icon_c: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-100 dark:border-amber-800',   Icon: CalendarDays },
        { label: 'Meals Served',   value: totalServed,          sub: `${todayOrders.length} orders today`, accent: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', icon_c: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-800', Icon: Users },
        { label: "Today's Revenue",value: `$${todayRevenue.toFixed(2)}`, sub: 'paid meals',          accent: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', icon_c: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800', Icon: DollarSign },
        { label: 'Planned Menus',  value: menus.filter(m => m.status === 1).length, sub: 'not yet served', accent: 'bg-violet-500', light: 'bg-violet-50 dark:bg-violet-900/20', icon_c: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-800', Icon: Clock },
    ];

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kitchen / Cafeteria</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{menus.length} menu{menus.length !== 1 ? 's' : ''} · {orders.length} meal record{orders.length !== 1 ? 's' : ''}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { loadMenus(); loadOrders(); }} disabled={menusLoading || ordersLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1.5${(menusLoading || ordersLoading) ? ' animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
                {CARDS.map(c => (
                    <div key={c.label} className={`relative rounded-xl border ${c.border} bg-white dark:bg-slate-900 p-4 shadow-sm overflow-hidden`}>
                        <div className={`absolute inset-x-0 top-0 h-1 ${c.accent}`} />
                        <div className="flex items-start gap-3 mt-1">
                            <div className={`rounded-lg p-2 ${c.light}`}><c.Icon className={`h-4 w-4 ${c.icon_c}`} /></div>
                            <div>
                                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{c.value}</p>
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{c.label}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{c.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div>
                {/* Tab switcher */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                    {(['menus', 'orders'] as const).map((t, i) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                tab === t
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            {i === 0 ? 'Menus' : 'Meal Orders'}
                        </button>
                    ))}
                </div>

                {/* ── Menus Tab ─────────────────────────────────────────── */}
                {tab === 'menus' && <div className="space-y-4">
                    {menusSetup ? (
                        <SetupGuide table="sms_kitchenmenus" columns={[
                            'sms_kitchenmenuId (PK)', 'sms_name (Text)', 'sms_menudate (Date Only)',
                            'sms_mealtype (Whole Number)', 'sms_items (Multiline Text)',
                            'sms_price (Decimal Number)', 'sms_totalserved (Whole Number)',
                            'sms_status (Whole Number)', '_sms_school_value (Lookup → sms_schools)',
                        ]} />
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input placeholder="Search menus…" className="pl-9" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
                                </div>
                                <DatePicker value={dateFilter} onChange={v => setDateFilter(v)} placeholder="Filter by date" className="w-44 h-10!" />
                                <SelectRoot value={mealFilter} onValueChange={v => setMealFilter(v ?? '')}>
                                    <SelectTrigger className={`w-36 ${SF}`}><SelectValue>{(v: string) => MEAL[Number(v)] ?? 'All Types'}</SelectValue></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Types</SelectItem>
                                        {Object.entries(MEAL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                    </SelectContent>
                                </SelectRoot>
                                <div className="flex-1" />
                                <Button variant="outline" size="sm" onClick={() => exportToCSV(
                                    `menus_${today}`,
                                    ['Date', 'Meal', 'Items', 'Price', 'Served', 'Status'],
                                    filteredMenus.map(m => [m.menudate, MEAL[m.mealtype] ?? '', m.items, m.price, m.totalserved, MSTATUS[m.status] ?? ''])
                                )}><Download className="h-4 w-4 mr-1.5" /> Export</Button>
                                <Button onClick={() => { setEditingMenu(null); setMenuModal(true); }}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Menu
                                </Button>
                            </div>

                            {menusLoading ? (
                                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
                            ) : !filteredMenus.length ? (
                                <div className="flex flex-col items-center py-24 text-slate-400 dark:text-slate-500">
                                    <UtensilsCrossed className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No menus found</p>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>{['Date', 'Type', 'Menu Items', 'Price', 'Served', 'Status', ''].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedMenus.map(m => (
                                                <TableRow key={m.menuid}>
                                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                                        {new Date(m.menudate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        {m.menudate === today && <span className="ml-1.5 text-xs text-amber-500 font-semibold">Today</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${MEAL_COLOR[m.mealtype]}`}>
                                                            {MEAL[m.mealtype] ?? '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs">
                                                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{m.items || '—'}</p>
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">
                                                        {m.price > 0 ? `$${m.price.toFixed(2)}` : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100">{m.totalserved}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={m.status === 2 ? 'default' : m.status === 3 ? 'destructive' : 'secondary'}>
                                                            {m.status === 2 ? <><CheckCircle2 className="h-3 w-3 mr-1" />Served</> : m.status === 3 ? <><XCircle className="h-3 w-3 mr-1" />Cancelled</> : <><Clock className="h-3 w-3 mr-1" />Planned</>}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <Button variant="ghost" size="icon" onClick={() => { setEditingMenu(m); setMenuModal(true); }}>
                                                                <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => setDeleteMenuId(m.menuid)}>
                                                                <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <Pagination page={menuPage} totalPages={menuTotalPages} total={filteredMenus.length} pageSize={PAGE_SIZE} label="menu" onChange={setMenuPage} />
                                </div>
                            )}
                        </>
                    )}
                </div>}

                {/* ── Orders Tab ────────────────────────────────────────── */}
                {tab === 'orders' && <div className="space-y-4">
                    {ordersSetup ? (
                        <SetupGuide table="sms_mealorders" columns={[
                            'sms_mealorderId (PK)', 'sms_name (Text)', 'sms_menuid (Text)',
                            'sms_menuname (Text)', 'sms_mealtype (Whole Number)',
                            'sms_student (Lookup → sms_students)', 'sms_orderdate (Date Only)',
                            'sms_amount (Decimal Number)', 'sms_paymentstatus (Whole Number)',
                            '_sms_school_value (Lookup → sms_schools)',
                        ]} />
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input placeholder="Search student or menu…" className="pl-9" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
                                </div>
                                <DatePicker value={orderDateFilter} onChange={v => setOrderDateFilter(v)} placeholder="Filter by date" className="w-44 h-10!" />
                                <SelectRoot value={payFilter} onValueChange={v => setPayFilter(v ?? '')}>
                                    <SelectTrigger className={`w-32 ${SF}`}><SelectValue>{(v: string) => PSTATUS[Number(v)] ?? 'All'}</SelectValue></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All</SelectItem>
                                        {Object.entries(PSTATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                    </SelectContent>
                                </SelectRoot>
                                <div className="flex-1" />
                                <Button variant="outline" size="sm" onClick={() => exportToCSV(
                                    `meal_orders_${today}`,
                                    ['Date', 'Student', 'Menu', 'Meal', 'Amount', 'Payment'],
                                    filteredOrders.map(o => [o.orderdate, o.studentname, o.menuname, MEAL[o.mealtype] ?? '', o.amount, PSTATUS[o.paymentstatus] ?? ''])
                                )}><Download className="h-4 w-4 mr-1.5" /> Export</Button>
                                <Button onClick={() => setOrderModal(true)} disabled={menus.length === 0}>
                                    <UserPlus className="h-4 w-4 mr-1" /> Record Meal
                                </Button>
                            </div>

                            {ordersLoading ? (
                                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
                            ) : !filteredOrders.length ? (
                                <div className="flex flex-col items-center py-24 text-slate-400 dark:text-slate-500">
                                    <Users className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No meal records found</p>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>{['Date', 'Student', 'Menu', 'Meal Type', 'Amount', 'Payment', ''].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedOrders.map(o => (
                                                <TableRow key={o.orderid}>
                                                    <TableCell className="text-slate-700 dark:text-slate-300 text-sm">
                                                        {new Date(o.orderdate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                        {o.orderdate === today && <span className="ml-1 text-xs text-blue-500 font-semibold">Today</span>}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{o.studentname || '—'}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300 text-sm max-w-[160px] truncate">{o.menuname || '—'}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${MEAL_COLOR[o.mealtype]}`}>
                                                            {MEAL[o.mealtype] ?? '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{o.amount > 0 ? `$${o.amount.toFixed(2)}` : '—'}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PSTATUS_COLOR[o.paymentstatus]}`}>
                                                            {PSTATUS[o.paymentstatus] ?? '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => setDeleteOrderId(o.orderid)}>
                                                            <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <Pagination page={orderPage} totalPages={orderTotalPages} total={filteredOrders.length} pageSize={PAGE_SIZE} label="record" onChange={setOrderPage} />
                                </div>
                            )}
                        </>
                    )}
                </div>}
            </div>

            {/* Menu modal */}
            <Dialog open={menuModal} onOpenChange={o => { if (!o) { setMenuModal(false); setEditingMenu(null); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editingMenu ? 'Edit Menu' : 'Add Menu'}</DialogTitle></DialogHeader>
                    <MenuForm
                        defaultValues={editingMenu ? {
                            menudate: editingMenu.menudate,
                            mealtype: String(editingMenu.mealtype),
                            items: editingMenu.items,
                            price: editingMenu.price,
                            totalserved: editingMenu.totalserved,
                            status: String(editingMenu.status),
                        } : { menudate: today }}
                        onSubmit={handleMenuSubmit}
                        onCancel={() => { setMenuModal(false); setEditingMenu(null); }}
                    />
                </DialogContent>
            </Dialog>

            {/* Order modal */}
            <Dialog open={orderModal} onOpenChange={o => { if (!o) setOrderModal(false); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Record Meal</DialogTitle></DialogHeader>
                    <OrderForm menus={menus.filter(m => m.status !== 3)} onSubmit={handleOrderSubmit} onCancel={() => setOrderModal(false)} />
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!deleteMenuId} onOpenChange={o => !o && setDeleteMenuId(null)}
                title="Delete menu?" description="This will permanently remove this menu entry."
                onConfirm={() => { if (deleteMenuId) { handleMenuDelete(deleteMenuId); setDeleteMenuId(null); } }} />

            <ConfirmDialog open={!!deleteOrderId} onOpenChange={o => !o && setDeleteOrderId(null)}
                title="Delete meal record?" description="This will permanently remove this meal order."
                onConfirm={() => { if (deleteOrderId) { handleOrderDelete(deleteOrderId); setDeleteOrderId(null); } }} />
        </div>
    );
}

