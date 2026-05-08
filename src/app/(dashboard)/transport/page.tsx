'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Bus, RefreshCw, Download, CheckCircle2, Wrench, XCircle } from 'lucide-react';
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
import { transportAPI } from '@/lib/api-client';
import type { Vehicle } from '@/lib/dataverse/transport';

const PAGE_SIZE = 10;
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const TYPES:   Record<number, string> = { 1: 'Bus', 2: 'Minibus', 3: 'Van', 4: 'Motorcycle', 5: 'Car' };
const STATUSES: Record<number, string> = { 1: 'Active', 2: 'Maintenance', 3: 'Retired' };
const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'default'> = { 1: 'success', 2: 'warning', 3: 'default' };

const schema = z.object({
    name:        z.string().min(1, 'Required'),
    plate:       z.string().optional(),
    vehicletype: z.string().default('1'),
    capacity:    z.coerce.number().min(0).default(0),
    driver:      z.string().optional(),
    driverphone: z.string().optional(),
    year:        z.coerce.number().optional(),
    color:       z.string().optional(),
    status:      z.string().default('1'),
    notes:       z.string().optional(),
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

function VehicleForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: { vehicletype: '1', status: '1', capacity: 0, ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <F id="name" label="Vehicle Name / Registration *" error={errors.name?.message}>
                        <Input id="name" {...register('name')} placeholder="e.g. School Bus 01" />
                    </F>
                </div>
                <F id="plate" label="Plate Number">
                    <Input id="plate" {...register('plate')} placeholder="e.g. GR-1234-24" />
                </F>
                <F id="vehicletype" label="Type">
                    <Controller name="vehicletype" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '1'} onValueChange={v => field.onChange(v ?? '1')}>
                            <SelectTrigger id="vehicletype" className={ST}><SelectValue>{(v: string) => TYPES[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="capacity" label="Capacity (seats)">
                    <Input id="capacity" type="number" {...register('capacity')} />
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
                <F id="year" label="Year of Manufacture">
                    <Input id="year" type="number" {...register('year')} placeholder="e.g. 2019" />
                </F>
                <F id="color" label="Colour">
                    <Input id="color" {...register('color')} placeholder="e.g. Yellow" />
                </F>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Driver</p>
                <div className="grid grid-cols-2 gap-4">
                    <F id="driver" label="Driver Name">
                        <Input id="driver" {...register('driver')} />
                    </F>
                    <F id="driverphone" label="Driver Phone">
                        <Input id="driverphone" {...register('driverphone')} type="tel" />
                    </F>
                </div>
            </div>
            <F id="notes" label="Notes">
                <Textarea id="notes" {...register('notes')} rows={2} />
            </F>
            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Vehicle'}</Button>
            </div>
        </form>
    );
}

export default function TransportPage() {
    const [rows, setRows]           = useState<Vehicle[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [page, setPage]           = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Vehicle | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await transportAPI.getAll();
            setRows(res.data ?? []);
        } catch { toast.error('Failed to load vehicles'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search]);

    const filtered   = useMemo(() => { const q = search.toLowerCase(); return q ? rows.filter(r => `${r.name} ${r.plate} ${r.driver}`.toLowerCase().includes(q)) : rows; }, [search, rows]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const active      = rows.filter(r => r.status === 1);
    const maintenance = rows.filter(r => r.status === 2);
    const totalSeats  = active.reduce((s, r) => s + r.capacity, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        const payload = { ...data, vehicletype: Number(data.vehicletype), status: Number(data.status) };
        try {
            if (editing) { await transportAPI.update(editing.vehicleid, payload); toast.success('Updated'); }
            else         { await transportAPI.create(payload);                    toast.success('Vehicle added'); }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const handleDelete = async (id: string) => {
        try { await transportAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Transport & Fleet</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{rows.length} vehicle{rows.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(`fleet_${new Date().toISOString().slice(0, 10)}`, ['Name', 'Plate', 'Type', 'Capacity', 'Driver', 'Phone', 'Year', 'Colour', 'Status'],
                        filtered.map(r => [r.name, r.plate, TYPES[r.vehicletype] ?? '', r.capacity, r.driver, r.driverphone, r.year, r.color, STATUSES[r.status] ?? '']))}>
                        <Download className="h-4 w-4 mr-1.5" /> Export CSV
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Vehicle
                    </Button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: 'Active Vehicles', value: active.length,      icon: CheckCircle2, accent: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', icon_c: 'text-emerald-600', border: 'border-emerald-100 dark:border-emerald-800', sub: `${totalSeats} total seats` },
                    { label: 'In Maintenance',  value: maintenance.length,  icon: Wrench,       accent: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-900/20',     icon_c: 'text-amber-600',   border: 'border-amber-100 dark:border-amber-800',   sub: 'awaiting service' },
                    { label: 'Total Fleet',     value: rows.length,         icon: Bus,          accent: 'bg-blue-500',    light: 'bg-blue-50 dark:bg-blue-900/20',        icon_c: 'text-blue-600',    border: 'border-blue-100 dark:border-blue-800',     sub: `${rows.filter(r => r.status === 3).length} retired` },
                ].map(({ label, value, icon: Icon, accent, light, icon_c, border, sub }) => (
                    <div key={label} className={`relative rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-sm overflow-hidden ${border}`}>
                        <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
                        <div className="flex items-start justify-between gap-4 mt-1">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
                                <p className="mt-1 text-xs text-slate-400">{sub}</p>
                            </div>
                            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${light}`}>
                                <Icon className={`h-5 w-5 ${icon_c}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input placeholder="Search by name, plate, driver…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                    <Bus className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No vehicles found</p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow>
                                {['Vehicle', 'Plate', 'Type', 'Capacity', 'Driver', 'Year / Colour', 'Status', ''].map(h => (
                                    <TableHead key={h}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(r => (
                                <TableRow key={r.vehicleid}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Bus className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{r.plate || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{TYPES[r.vehicletype] ?? '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-900 dark:text-slate-100 font-semibold text-center">{r.capacity || '—'}</TableCell>
                                    <TableCell>
                                        <p className="text-sm text-slate-900 dark:text-slate-100">{r.driver || '—'}</p>
                                        {r.driverphone && <p className="text-xs text-slate-400 dark:text-slate-500">{r.driverphone}</p>}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                                        {r.year ? `${r.year}` : '—'}{r.color ? ` · ${r.color}` : ''}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[r.status] ?? 'default'}>{STATUSES[r.status] ?? 'Unknown'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}>
                                                <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(r.vehicleid)}>
                                                <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="vehicle" onChange={setPage} />
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle></DialogHeader>
                    <VehicleForm
                        defaultValues={editing ? { name: editing.name, plate: editing.plate, vehicletype: String(editing.vehicletype), capacity: editing.capacity, driver: editing.driver, driverphone: editing.driverphone, year: editing.year, color: editing.color, status: String(editing.status), notes: editing.notes } : undefined}
                        onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)} title="Delete vehicle?" description="This will permanently remove the vehicle record."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }} />
        </div>
    );
}
