'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Package, RefreshCw, Download, AlertTriangle } from 'lucide-react';
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
import { inventoryAPI } from '@/lib/api-client';
import type { InventoryItem } from '@/lib/dataverse/inventory';

const PAGE_SIZE = 10;
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const CATEGORIES = ['Stationery', 'Furniture', 'Electronics', 'Cleaning', 'Sports', 'Lab Equipment', 'Books', 'Medical', 'Other'];

const schema = z.object({
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

function ItemForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
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

export default function InventoryPage() {
    const [items, setItems]         = useState<InventoryItem[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [page, setPage]           = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<InventoryItem | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await inventoryAPI.getAll();
            setItems(res.data ?? []);
        } catch { toast.error('Failed to load inventory'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search, catFilter]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return items.filter(i =>
            (!catFilter || i.category === catFilter) &&
            (!q || `${i.name} ${i.category} ${i.supplier} ${i.location}`.toLowerCase().includes(q))
        );
    }, [search, catFilter, items]);

    const lowStock = items.filter(i => i.reorderlevel > 0 && i.quantity <= i.reorderlevel);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) { await inventoryAPI.update(editing.itemid, data); toast.success('Item updated'); }
            else         { await inventoryAPI.create(data);                 toast.success('Item added'); }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const handleDelete = async (id: string) => {
        try { await inventoryAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        exportToCSV(`inventory_${new Date().toISOString().slice(0, 10)}`, [
                            'Name', 'Category', 'Quantity', 'Unit', 'Unit Price', 'Reorder Level', 'Supplier', 'Location',
                        ], filtered.map(i => [
                            i.name, i.category, i.quantity, i.unit, i.unitprice, i.reorderlevel, i.supplier, i.location,
                        ]));
                    }}>
                        <Download className="h-4 w-4 mr-1.5" /> Export CSV
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                </div>
            </div>

            {lowStock.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                        <span className="font-semibold">{lowStock.length} item{lowStock.length !== 1 ? 's' : ''} low on stock:</span>{' '}
                        {lowStock.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="Search items…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <SelectRoot value={catFilter} onValueChange={v => setCatFilter(v ?? '')}>
                    <SelectTrigger className="w-44 h-10"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </SelectRoot>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <Package className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No inventory items found</p>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800">
                                {['Item', 'Category', 'Qty', 'Unit Price', 'Reorder', 'Supplier', 'Location', 'Status', ''].map(h => (
                                    <TableHead key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {paginated.map(i => {
                                const isLow = i.reorderlevel > 0 && i.quantity <= i.reorderlevel;
                                return (
                                    <TableRow key={i.itemid} className="hover:bg-blue-50/30 dark:hover:bg-gray-800/50 transition-colors">
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{i.name}</span>
                                            </div>
                                            {i.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{i.description}</p>}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500">{i.category || '—'}</TableCell>
                                        <TableCell className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                                            {i.quantity} <span className="font-normal text-gray-400 text-xs">{i.unit}</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 font-mono text-xs">
                                            {i.unitprice > 0 ? `$${i.unitprice.toFixed(2)}` : '—'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-xs">{i.reorderlevel || '—'}</TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-xs">
                                            <div>{i.supplier || '—'}</div>
                                            {i.suppliercontact && <div className="text-gray-400">{i.suppliercontact}</div>}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-xs">{i.location || '—'}</TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge variant={isLow ? 'warning' : 'success'}>
                                                {isLow ? 'Low Stock' : 'In Stock'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditing(i); setModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setToDelete(i.itemid)}>
                                                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
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
                        onSubmit={handleSubmit}
                        onCancel={() => { setModalOpen(false); setEditing(null); }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete item?" description="This will permanently remove the inventory item."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
