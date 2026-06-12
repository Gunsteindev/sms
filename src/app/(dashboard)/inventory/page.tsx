'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';

import { useEffect, useState, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import {
    Plus, Search, Pencil, Trash2, Package, RefreshCw, Download, Upload,
    AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, TrendingDown, DollarSign, Layers, Info,
} from 'lucide-react';
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
import { inventoryAPI, inventoryMovementsAPI } from '@/lib/api-client';
import { ImportModal, batchImport } from '@/components/ui/ImportModal';
import { INVENTORY_FIELDS, mapInventoryRow } from '@/lib/csv-import';
import type { InventoryItem } from '@/lib/dataverse/inventory';
import type { InventoryMovement } from '@/lib/dataverse/inventoryMovements';

const PAGE_SIZE = 10;
// h-10! overrides the component's internal data-[size=default]:h-8 (Tailwind v4 important suffix)
const ST = 'w-full h-10! bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';
const SF = 'h-10! bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const CATEGORIES = ['Stationery', 'Furniture', 'Electronics', 'Cleaning', 'Sports', 'Lab Equipment', 'Books', 'Medical', 'Other'];

const MOV_TYPES: Record<number, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'secondary' }> = {
    1: { label: 'Stock In',    variant: 'success'   },
    2: { label: 'Stock Out',   variant: 'warning'   },
    3: { label: 'Adjustment',  variant: 'info'      },
    4: { label: 'Loss/Damage', variant: 'error'     },
    5: { label: 'Return',      variant: 'secondary' },
};

// ── Item form ────────────────────────────────────────────────────────────────

const itemSchema = z.object({
    name:            z.string().min(1, 'Required'),
    category:        z.string().optional(),
    quantity:        z.coerce.number().min(0).default(0),
    unit:            z.string().optional(),
    unitprice:       z.coerce.number().min(0).default(0),
    reorderlevel:    z.coerce.number().min(0).default(0),
    supplier:        z.string().optional(),
    suppliercontact: z.string().optional(),
    location:        z.string().optional(),
    description:     z.string().optional(),
});
type ItemFormData = z.infer<typeof itemSchema>;

// ── Movement form ────────────────────────────────────────────────────────────

const movSchema = z.object({
    itemid:       z.string().min(1, 'Required'),
    movementtype: z.coerce.number().int().min(1).max(5),
    quantity:     z.coerce.number().min(0, 'Must be ≥ 0'),
    reason:       z.string().optional(),
    notes:        z.string().optional(),
});
type MovFormData = z.infer<typeof movSchema>;

// ── Shared field wrapper ─────────────────────────────────────────────────────

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; accent: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex items-center gap-4">
            <div className={`rounded-lg p-2.5 ${accent}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{value}</p>
                {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
            </div>
        </div>
    );
}

// ── ItemForm component ───────────────────────────────────────────────────────

function ItemForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<ItemFormData>;
    onSubmit: (d: ItemFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ItemFormData>({
        resolver: zodResolver(itemSchema) as never,
        defaultValues: { quantity: 0, unitprice: 0, reorderlevel: 0, ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <F id="name" label="Item Name *" error={errors.name?.message}>
                        <Input id="name" {...register('name')} />
                    </F>
                </div>

                <F id="category" label="Category">
                    <Controller name="category" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={v => field.onChange(v)}>
                            <SelectTrigger id="category" className={ST}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>

                <F id="unit" label="Unit (pcs, kg, box…)">
                    <Input id="unit" {...register('unit')} placeholder="e.g. pcs" />
                </F>

                <F id="quantity" label="Quantity" error={errors.quantity?.message}>
                    <Input id="quantity" type="number" {...register('quantity')} />
                </F>

                <F id="reorderlevel" label="Reorder Level">
                    <Input id="reorderlevel" type="number" {...register('reorderlevel')} />
                </F>

                <F id="unitprice" label="Unit Price">
                    <Input id="unitprice" type="number" step="0.01" {...register('unitprice')} />
                </F>

                <F id="location" label="Storage Location">
                    <Input id="location" {...register('location')} placeholder="e.g. Store Room A" />
                </F>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier</p>
                <div className="grid grid-cols-2 gap-4">
                    <F id="supplier" label="Supplier Name">
                        <Input id="supplier" {...register('supplier')} />
                    </F>
                    <F id="suppliercontact" label="Contact">
                        <Input id="suppliercontact" {...register('suppliercontact')} />
                    </F>
                </div>
            </div>

            <F id="description" label="Description">
                <Textarea id="description" {...register('description')} rows={2} />
            </F>

            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Item'}</Button>
            </div>
        </form>
    );
}

// ── MovementForm component ───────────────────────────────────────────────────

function MovementForm({ items, defaultItemId, onSubmit, onCancel }: {
    items: InventoryItem[];
    defaultItemId?: string;
    onSubmit: (d: MovFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<MovFormData>({
        resolver: zodResolver(movSchema) as never,
        defaultValues: { itemid: defaultItemId ?? '', movementtype: 1, quantity: 0 },
    });

    const movementtype = useWatch({ control, name: 'movementtype' });
    const isAdjustment = Number(movementtype) === 3;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <F id="itemid" label="Item *" error={errors.itemid?.message}>
                <Controller name="itemid" control={control} render={({ field }) => (
                    <SelectRoot value={field.value} onValueChange={v => field.onChange(v)}>
                        <SelectTrigger id="itemid" className={ST}>
                            <SelectValue placeholder="Select item">
                                {(v: string | null) => v ? (items.find(i => i.itemid === v)?.name ?? v) : null}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {items.map(i => (
                                <SelectItem key={i.itemid} value={i.itemid} label={i.name}>
                                    {i.name}{i.unit ? ` (${i.quantity} ${i.unit})` : ` (${i.quantity})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                )} />
            </F>

            <div className="grid grid-cols-2 gap-4">
                <F id="movementtype" label="Movement Type *" error={errors.movementtype?.message}>
                    <Controller name="movementtype" control={control} render={({ field }) => (
                        <SelectRoot value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                            <SelectTrigger id="movementtype" className={ST}>
                                <SelectValue placeholder="Select type">
                                    {(v: string | null) => v ? (MOV_TYPES[Number(v)]?.label ?? v) : null}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(MOV_TYPES).map(([v, t]) => (
                                    <SelectItem key={v} value={v} label={t.label}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>

                <F id="quantity" label={isAdjustment ? 'New Quantity *' : 'Quantity *'} error={errors.quantity?.message}>
                    <Input id="quantity" type="number" min="0" step="1" {...register('quantity')} />
                </F>
            </div>

            {isAdjustment && (
                <p className="text-xs text-slate-500 -mt-2">
                    Sets the stock level to this exact quantity regardless of current stock.
                </p>
            )}

            <F id="reason" label="Reason">
                <Input id="reason" {...register('reason')} placeholder="e.g. Purchased from supplier" />
            </F>

            <F id="notes" label="Notes">
                <Textarea id="notes" {...register('notes')} rows={2} placeholder="Optional additional notes" />
            </F>

            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging…' : 'Log Movement'}</Button>
            </div>
        </form>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
    // Items state
    const [items, setItems]         = useState<InventoryItem[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [page, setPage]           = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<InventoryItem | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);
    const [importOpen, setImportOpen] = useState(false);

    // Movement log state
    const [tab, setTab]                         = useState('items');
    const [movements, setMovements]             = useState<InventoryMovement[]>([]);
    const [movLoading, setMovLoading]           = useState(false);
    const [movSetupRequired, setMovSetupRequired] = useState(false);
    const [movSearch, setMovSearch]             = useState('');
    const [movItemFilter, setMovItemFilter]     = useState('');
    const [movTypeFilter, setMovTypeFilter]     = useState('');
    const [movPage, setMovPage]                 = useState(1);
    const [movModalOpen, setMovModalOpen]       = useState(false);
    const [movDefaultItem, setMovDefaultItem]   = useState<string | undefined>();
    const [toDeleteMov, setToDeleteMov]         = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await inventoryAPI.getAll();
            setItems(res.data ?? []);
        } catch { toast.error('Failed to load inventory'); }
        finally { setLoading(false); }
    };

    const loadMovements = async () => {
        setMovLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await inventoryMovementsAPI.getAll({
                itemid:       movItemFilter || undefined,
                movementtype: movTypeFilter || undefined,
            });
            if (res.setup_required) { setMovSetupRequired(true); setMovements([]); }
            else                    { setMovSetupRequired(false); setMovements(res.data ?? []); }
        } catch { toast.error('Failed to load movement log'); }
        finally { setMovLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search, catFilter]);
    useEffect(() => {
        if (tab === 'movements') loadMovements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);
    useEffect(() => {
        if (tab === 'movements') { setMovPage(1); loadMovements(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movItemFilter, movTypeFilter]);
    useEffect(() => { setMovPage(1); }, [movSearch]);

    // ── Computed values ──────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return items.filter(i =>
            (!catFilter || i.category === catFilter) &&
            (!q || `${i.name} ${i.category} ${i.supplier} ${i.location}`.toLowerCase().includes(q))
        );
    }, [search, catFilter, items]);

    const lowStock     = useMemo(() => items.filter(i => i.reorderlevel > 0 && i.quantity <= i.reorderlevel), [items]);
    const totalValue   = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unitprice, 0), [items]);
    const categoryCount = useMemo(() => new Set(items.map(i => i.category).filter(Boolean)).size, [items]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const filteredMovements = useMemo(() => {
        const q = movSearch.toLowerCase();
        if (!q) return movements;
        return movements.filter(m =>
            m.itemname.toLowerCase().includes(q) ||
            m.reason.toLowerCase().includes(q) ||
            m.movedby.toLowerCase().includes(q)
        );
    }, [movSearch, movements]);

    const movTotalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
    const movPaginated  = filteredMovements.slice((movPage - 1) * PAGE_SIZE, movPage * PAGE_SIZE);

    // ── Handlers ─────────────────────────────────────────────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleItemSubmit = async (data: any) => {
        try {
            if (editing) { await inventoryAPI.update(editing.itemid, data); toast.success('Item updated'); }
            else         { await inventoryAPI.create(data);                 toast.success('Item added'); }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const handleItemDelete = async (id: string) => {
        try { await inventoryAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    const handleMovSubmit = async (data: MovFormData) => {
        try {
            await inventoryMovementsAPI.create(data);
            toast.success('Movement logged');
            setMovModalOpen(false);
            setMovDefaultItem(undefined);
            load();
            if (tab === 'movements') loadMovements();
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const e = err as any;
            if (e?.setup_required) {
                setMovSetupRequired(true);
                setMovModalOpen(false);
                setTab('movements');
                toast.error('Dataverse table not set up yet — see instructions below');
            } else {
                toast.error('Failed to log movement');
            }
        }
    };

    const handleMovDelete = async (id: string) => {
        try { await inventoryMovementsAPI.delete(id); toast.success('Deleted'); loadMovements(); }
        catch { toast.error('Failed to delete'); }
    };

    const openLogMovement = (itemId?: string) => {
        setMovDefaultItem(itemId);
        setMovModalOpen(true);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Inventory</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''} tracked`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { load(); if (tab === 'movements') loadMovements(); }} disabled={loading || movLoading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${(loading || movLoading) ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openLogMovement()}>
                        <ArrowUpDown className="h-4 w-4 mr-1.5" /> Log Movement
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                        <Upload className="h-4 w-4 mr-1.5" /> Import CSV
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                </div>
            </div>

            {/* Summary cards */}
            {!loading && items.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Items"
                        value={items.length}
                        sub={`${categoryCount} categor${categoryCount !== 1 ? 'ies' : 'y'}`}
                        icon={Package}
                        accent="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    />
                    <StatCard
                        label="Stock Value"
                        value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        sub="at current prices"
                        icon={DollarSign}
                        accent="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                    />
                    <StatCard
                        label="Low Stock"
                        value={lowStock.length}
                        sub={lowStock.length > 0 ? 'need restocking' : 'all levels OK'}
                        icon={TrendingDown}
                        accent={lowStock.length > 0
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}
                    />
                    <StatCard
                        label="Categories"
                        value={categoryCount}
                        sub={`of ${CATEGORIES.length} defined`}
                        icon={Layers}
                        accent="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                    />
                </div>
            )}

            {/* Low stock alert */}
            {lowStock.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                        <span className="font-semibold">{lowStock.length} item{lowStock.length !== 1 ? 's' : ''} below reorder level:</span>{' '}
                        {lowStock.map(i => `${i.name} (${i.quantity}${i.unit ? ' ' + i.unit : ''})`).join(', ')}
                    </div>
                </div>
            )}

            {/* Tab switcher */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setTab('items')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        tab === 'items'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}>
                    Items
                </button>
                <button type="button" onClick={() => setTab('movements')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        tab === 'movements'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}>
                    Movement Log
                    {movements.length > 0 && (
                        <span className="ml-1.5 rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {movements.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Items tab ── */}
            {tab === 'items' && <div className="space-y-4 pt-3">
                        <div className="flex gap-3 items-center flex-wrap">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <Input placeholder="Search items…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <SelectRoot value={catFilter} onValueChange={v => setCatFilter(v ?? '')}>
                                <SelectTrigger className={`w-44 ${SF}`}><SelectValue placeholder="All Categories" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Categories</SelectItem>
                                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </SelectRoot>
                            <Button variant="outline" size="sm" className="ml-auto" onClick={() => {
                                exportToCSV(`inventory_${new Date().toISOString().slice(0, 10)}`, [
                                    'Name', 'Category', 'Quantity', 'Unit', 'Unit Price', 'Total Value', 'Reorder Level', 'Supplier', 'Location',
                                ], filtered.map(i => [
                                    i.name, i.category, i.quantity, i.unit,
                                    i.unitprice, (i.quantity * i.unitprice).toFixed(2),
                                    i.reorderlevel, i.supplier, i.location,
                                ]));
                            }}>
                                <Download className="h-4 w-4 mr-1.5" /> Export CSV
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                        ) : !filtered.length ? (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                                <Package className="h-10 w-10 mb-3 opacity-40" />
                                <p className="text-sm">{search || catFilter ? 'No items match your filters' : 'No inventory items yet'}</p>
                                {!search && !catFilter && (
                                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-1" /> Add first item
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                <Table className="w-full text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Reorder</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[100px]" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginated.map(i => {
                                            const isLow = i.reorderlevel > 0 && i.quantity <= i.reorderlevel;
                                            return (
                                                <TableRow key={i.itemid}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Package className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">{i.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {i.description
                                                            ? <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px] block">{i.description}</span>
                                                            : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{i.category || '—'}</TableCell>
                                                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {i.quantity}{i.unit && <span className="font-normal text-slate-400 dark:text-slate-500 text-xs ml-1">{i.unit}</span>}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                                                        {i.unitprice > 0 ? `$${(i.quantity * i.unitprice).toFixed(2)}` : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{i.reorderlevel || '—'}</TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                                                        <div>{i.supplier || '—'}</div>
                                                        {i.suppliercontact && <div className="text-slate-400 dark:text-slate-500">{i.suppliercontact}</div>}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{i.location || '—'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={isLow ? 'warning' : 'success'}>
                                                            {isLow ? 'Low Stock' : 'In Stock'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="icon" title="Log movement" onClick={() => openLogMovement(i.itemid)}>
                                                                <ArrowUpDown className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => { setEditing(i); setModalOpen(true); }}>
                                                                <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(i.itemid)}>
                                                                <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="item" onChange={setPage} />
                            </div>
                        )}
            </div>}

            {/* ── Movement Log tab ── */}
            {tab === 'movements' && <div className="space-y-4 pt-3">
                        <div className="flex gap-3 items-center flex-wrap">
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <Input placeholder="Search movements…" className="pl-9" value={movSearch} onChange={e => setMovSearch(e.target.value)} />
                            </div>

                            <SelectRoot value={movItemFilter} onValueChange={v => setMovItemFilter(v ?? '')}>
                                <SelectTrigger className={`w-48 ${SF}`}>
                                    <SelectValue placeholder="All Items">
                                        {(v: string) => v ? (items.find(i => i.itemid === v)?.name ?? v) : 'All Items'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Items</SelectItem>
                                    {items.map(i => <SelectItem key={i.itemid} value={i.itemid}>{i.name}</SelectItem>)}
                                </SelectContent>
                            </SelectRoot>

                            <SelectRoot value={movTypeFilter} onValueChange={v => setMovTypeFilter(v ?? '')}>
                                <SelectTrigger className={`w-40 ${SF}`}>
                                    <SelectValue placeholder="All Types">
                                        {(v: string) => v ? (MOV_TYPES[Number(v)]?.label ?? v) : 'All Types'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Types</SelectItem>
                                    {Object.entries(MOV_TYPES).map(([v, t]) => (
                                        <SelectItem key={v} value={v}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>

                            <Button variant="outline" size="sm" onClick={loadMovements} disabled={movLoading}>
                                <RefreshCw className={`h-4 w-4 mr-1.5${movLoading ? ' animate-spin' : ''}`} /> Refresh
                            </Button>

                            <Button variant="outline" size="sm" className="ml-auto" onClick={() => {
                                exportToCSV(`inventory_movements_${new Date().toISOString().slice(0, 10)}`, [
                                    'Date', 'Item', 'Type', 'Qty', 'Before', 'After', 'Reason', 'Logged By',
                                ], filteredMovements.map(m => [
                                    new Date(m.createdon).toLocaleString(),
                                    m.itemname,
                                    MOV_TYPES[m.movementtype]?.label ?? m.movementtype,
                                    m.quantity,
                                    m.quantitybefore,
                                    m.quantityafter,
                                    m.reason,
                                    m.movedby,
                                ]));
                            }}>
                                <Download className="h-4 w-4 mr-1.5" /> Export CSV
                            </Button>
                        </div>

                        {movSetupRequired ? (
                            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-200">Dataverse table setup required</h3>
                                </div>
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    The <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded font-mono text-xs">sms_inventorymovements</code> table
                                    does not exist in your Dataverse environment yet. Create it in Power Apps to enable movement tracking.
                                </p>
                                <div className="rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 p-4 space-y-3 text-sm">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">Steps to create the table</p>
                                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
                                        <li>Open <span className="font-medium">make.powerapps.com</span> → your environment → <strong>Tables</strong></li>
                                        <li>Click <strong>New table</strong> → set Display name: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono text-xs">Inventory Movement</code>, Name: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono text-xs">sms_inventorymovement</code></li>
                                        <li>Add the following columns (all <strong>Text</strong> unless noted):</li>
                                    </ol>
                                    <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700 mt-1">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-800">
                                                <tr>
                                                    <th className="px-3 py-2 font-semibold">Column name</th>
                                                    <th className="px-3 py-2 font-semibold">Schema name</th>
                                                    <th className="px-3 py-2 font-semibold">Type</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {[
                                                    ['Item ID',        'sms_itemid',         'Text'],
                                                    ['Item Name',      'sms_itemname',        'Text'],
                                                    ['Movement Type',  'sms_movementtype',    'Whole Number'],
                                                    ['Quantity',       'sms_quantity',        'Decimal'],
                                                    ['Qty Before',     'sms_quantitybefore',  'Decimal'],
                                                    ['Qty After',      'sms_quantityafter',   'Decimal'],
                                                    ['Reason',         'sms_reason',          'Text'],
                                                    ['Notes',          'sms_notes',           'Multiline Text'],
                                                    ['Moved By',       'sms_movedby',         'Text'],
                                                    ['School (lookup)','sms_school',          'Lookup → sms_school'],
                                                ].map(([n, s, t]) => (
                                                    <tr key={s} className="text-slate-600 dark:text-slate-400">
                                                        <td className="px-3 py-1.5">{n}</td>
                                                        <td className="px-3 py-1.5 font-mono text-xs">{s}</td>
                                                        <td className="px-3 py-1.5 text-slate-400">{t}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                                        After saving the table, click <strong>Refresh</strong> above — this banner will disappear automatically.
                                    </p>
                                </div>
                            </div>
                        ) : movLoading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                        ) : !filteredMovements.length ? (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                                <ArrowUpDown className="h-10 w-10 mb-3 opacity-40" />
                                <p className="text-sm">{movSearch || movItemFilter || movTypeFilter ? 'No movements match your filters' : 'No movements recorded yet'}</p>
                                {!movSearch && !movItemFilter && !movTypeFilter && (
                                    <Button variant="outline" size="sm" className="mt-3" onClick={() => openLogMovement()}>
                                        <ArrowUpDown className="h-4 w-4 mr-1" /> Log first movement
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                <Table className="w-full text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Before</TableHead>
                                            <TableHead>After</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>By</TableHead>
                                            <TableHead className="w-10" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movPaginated.map(m => {
                                            const mt   = MOV_TYPES[m.movementtype];
                                            const isIn  = m.movementtype === 1 || m.movementtype === 5;
                                            const isOut = m.movementtype === 2 || m.movementtype === 4;
                                            return (
                                                <TableRow key={m.movementid}>
                                                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                        {m.createdon ? new Date(m.createdon).toLocaleString() : '—'}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100 max-w-[140px] truncate">
                                                        {m.itemname || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {mt && <Badge variant={mt.variant}>{mt.label}</Badge>}
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                        <span className={`flex items-center gap-1 text-sm ${isIn ? 'text-green-600' : isOut ? 'text-red-600' : 'text-blue-600'}`}>
                                                            {isIn  && <ArrowUp   className="h-3 w-3" />}
                                                            {isOut && <ArrowDown className="h-3 w-3" />}
                                                            {m.quantity}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{m.quantitybefore}</TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{m.quantityafter}</TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs max-w-[140px] truncate">
                                                        {m.reason || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{m.movedby || '—'}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => setToDeleteMov(m.movementid)}>
                                                            <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                <Pagination page={movPage} totalPages={movTotalPages} total={filteredMovements.length} pageSize={PAGE_SIZE} label="movement" onChange={setMovPage} />
                            </div>
                        )}
            </div>}

            {/* Item add/edit dialog */}
            <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
                    </DialogHeader>
                    <ItemForm
                        defaultValues={editing ? {
                            name: editing.name, category: editing.category, quantity: editing.quantity,
                            unit: editing.unit, unitprice: editing.unitprice, reorderlevel: editing.reorderlevel,
                            supplier: editing.supplier, suppliercontact: editing.suppliercontact,
                            location: editing.location, description: editing.description,
                        } : undefined}
                        onSubmit={handleItemSubmit}
                        onCancel={() => { setModalOpen(false); setEditing(null); }}
                    />
                </DialogContent>
            </Dialog>

            {/* Log movement dialog */}
            <Dialog open={movModalOpen} onOpenChange={o => { if (!o) { setMovModalOpen(false); setMovDefaultItem(undefined); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Log Stock Movement</DialogTitle>
                    </DialogHeader>
                    <MovementForm
                        items={items}
                        defaultItemId={movDefaultItem}
                        onSubmit={handleMovSubmit}
                        onCancel={() => { setMovModalOpen(false); setMovDefaultItem(undefined); }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete item?" description="This will permanently remove the inventory item and all its data."
                onConfirm={() => { if (toDelete) { handleItemDelete(toDelete); setToDelete(null); } }}
            />

            <ConfirmDialog
                open={!!toDeleteMov} onOpenChange={o => !o && setToDeleteMov(null)}
                title="Delete movement record?" description="This removes the log entry but does not reverse the stock change."
                onConfirm={() => { if (toDeleteMov) { handleMovDelete(toDeleteMov); setToDeleteMov(null); } }}
            />

            <ImportModal
                open={importOpen}
                onOpenChange={setImportOpen}
                title="Import Inventory Items"
                fields={INVENTORY_FIELDS}
                templateFilename="inventory_template.csv"
                onDone={() => load()}
                onImport={async (rows) =>
                    batchImport(rows, async (r) => {
                        await inventoryAPI.create(mapInventoryRow(r.data));
                    })
                }
            />
        </div>
    );
}
