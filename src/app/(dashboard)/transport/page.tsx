'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Plus, Search, Pencil, Trash2, Bus, RefreshCw, Download,
    CheckCircle2, Wrench, XCircle, Users, Info, MapPin, Clock,
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
import { transportAPI, routeAssignmentsAPI, vehicleMaintenanceAPI } from '@/lib/api/facilities';
import type { Vehicle } from '@/lib/dataverse/transport';
import type { RouteAssignment } from '@/lib/dataverse/routeAssignments';
import type { VehicleMaintenance } from '@/lib/dataverse/vehicleMaintenance';
import { MAINT_TYPES, MAINT_STATUSES } from '@/lib/dataverse/vehicleMaintenance';

const PAGE_SIZE = 10;
const ST = 'w-full h-10! bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';
const SF = 'h-10! bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const VEH_TYPES:   Record<number, string> = { 1: 'Bus', 2: 'Minibus', 3: 'Van', 4: 'Motorcycle', 5: 'Car' };
const VEH_STATUSES: Record<number, string> = { 1: 'Active', 2: 'Maintenance', 3: 'Retired' };
const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'default'> = { 1: 'success', 2: 'warning', 3: 'default' };

const ASSIGN_STATUSES: Record<number, string>  = { 1: 'Active', 2: 'Suspended', 3: 'Ended' };
const ASSIGN_VARIANT:  Record<number, 'success' | 'warning' | 'default'> = { 1: 'success', 2: 'warning', 3: 'default' };

const MAINT_STATUS_VARIANT: Record<number, 'info' | 'warning' | 'success' | 'default'> = {
    1: 'info', 2: 'warning', 3: 'success', 4: 'default',
};

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

// ── Setup guide ──────────────────────────────────────────────────────────────

function SetupGuide({ tableName, columns }: {
    tableName: string;
    columns: [string, string, string][];
}) {
    return (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6 space-y-4">
            <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">Dataverse table setup required</h3>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-300">
                The <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded font-mono text-xs">{tableName}</code> table
                does not exist in your Dataverse environment yet.
            </p>
            <div className="rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 p-4 space-y-3 text-sm">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Steps to create the table</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
                    <li>Open <span className="font-medium">make.powerapps.com</span> → your environment → <strong>Tables</strong></li>
                    <li>Click <strong>New table</strong> → set Display name and Schema name as shown</li>
                    <li>Add the following columns:</li>
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
                            {columns.map(([n, s, t]) => (
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
                    After saving the table, click <strong>Refresh</strong> — this banner will disappear automatically.
                </p>
            </div>
        </div>
    );
}

// ── Vehicle form ─────────────────────────────────────────────────────────────

const vehicleSchema = z.object({
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
type VehicleFormData = z.infer<typeof vehicleSchema>;

function VehicleForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<VehicleFormData>;
    onSubmit: (d: VehicleFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<VehicleFormData>({
        resolver: zodResolver(vehicleSchema) as never,
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
                            <SelectTrigger id="vehicletype" className={ST}>
                                <SelectValue>{(v: string) => VEH_TYPES[Number(v)] ?? 'Select'}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(VEH_TYPES).map(([k, v]) => <SelectItem key={k} value={k} label={v}>{v}</SelectItem>)}
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
                            <SelectTrigger id="status" className={ST}>
                                <SelectValue>{(v: string) => VEH_STATUSES[Number(v)] ?? 'Select'}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(VEH_STATUSES).map(([k, v]) => <SelectItem key={k} value={k} label={v}>{v}</SelectItem>)}
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

// ── Assignment form ───────────────────────────────────────────────────────────

const assignSchema = z.object({
    vehicleid:   z.string().min(1, 'Required'),
    routename:   z.string().optional(),
    pickuppoint: z.string().optional(),
    pickuptime:  z.string().optional(),
    status:      z.string().default('1'),
});
type AssignFormData = z.infer<typeof assignSchema>;

function AssignmentForm({ vehicles, defaultValues, studentName, onSubmit, onCancel }: {
    vehicles:      Vehicle[];
    defaultValues?: Partial<AssignFormData>;
    studentName:   string;
    onSubmit: (d: AssignFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<AssignFormData>({
        resolver: zodResolver(assignSchema) as never,
        defaultValues: { status: '1', ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Student</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{studentName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <F id="vehicleid" label="Vehicle *" error={errors.vehicleid?.message}>
                        <Controller name="vehicleid" control={control} render={({ field }) => (
                            <SelectRoot value={field.value} onValueChange={v => field.onChange(v)}>
                                <SelectTrigger id="vehicleid" className={ST}>
                                    <SelectValue placeholder="Select vehicle">
                                        {(v: string | null) => v ? (vehicles.find(x => x.vehicleid === v)?.name ?? v) : null}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.filter(v => v.status === 1).map(v => (
                                        <SelectItem key={v.vehicleid} value={v.vehicleid} label={v.name}>
                                            {v.name}{v.plate ? ` (${v.plate})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                </div>
                <F id="routename" label="Route Name">
                    <Input id="routename" {...register('routename')} placeholder="e.g. North Route" />
                </F>
                <F id="pickuptime" label="Pickup Time">
                    <Input id="pickuptime" {...register('pickuptime')} placeholder="e.g. 07:30" />
                </F>
                <div className="col-span-2">
                    <F id="pickuppoint" label="Pickup Point">
                        <Input id="pickuppoint" {...register('pickuppoint')} placeholder="e.g. Accra Mall Junction" />
                    </F>
                </div>
                <div className="col-span-2">
                    <F id="status" label="Status">
                        <Controller name="status" control={control} render={({ field }) => (
                            <SelectRoot value={field.value ?? '1'} onValueChange={v => field.onChange(v ?? '1')}>
                                <SelectTrigger id="status" className={ST}>
                                    <SelectValue>{(v: string) => ASSIGN_STATUSES[Number(v)] ?? 'Select'}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ASSIGN_STATUSES).map(([k, v]) => (
                                        <SelectItem key={k} value={k} label={v}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Assignment'}</Button>
            </div>
        </form>
    );
}

// ── Maintenance form ──────────────────────────────────────────────────────────

const maintSchema = z.object({
    vehicleid:       z.string().min(1, 'Required'),
    maintenancetype: z.string().default('1'),
    description:     z.string().optional(),
    scheduleddate:   z.string().optional(),
    completeddate:   z.string().optional(),
    cost:            z.coerce.number().min(0).default(0),
    technicianname:  z.string().optional(),
    status:          z.string().default('1'),
    notes:           z.string().optional(),
});
type MaintFormData = z.infer<typeof maintSchema>;

function MaintenanceForm({ vehicles, defaultValues, onSubmit, onCancel }: {
    vehicles:       Vehicle[];
    defaultValues?: Partial<MaintFormData>;
    onSubmit: (d: MaintFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<MaintFormData>({
        resolver: zodResolver(maintSchema) as never,
        defaultValues: { maintenancetype: '1', status: '1', cost: 0, ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <F id="vehicleid" label="Vehicle *" error={errors.vehicleid?.message}>
                <Controller name="vehicleid" control={control} render={({ field }) => (
                    <SelectRoot value={field.value} onValueChange={v => field.onChange(v)}>
                        <SelectTrigger id="vehicleid" className={ST}>
                            <SelectValue placeholder="Select vehicle">
                                {(v: string | null) => v ? (vehicles.find(x => x.vehicleid === v)?.name ?? v) : null}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {vehicles.map(v => (
                                <SelectItem key={v.vehicleid} value={v.vehicleid} label={v.name}>
                                    {v.name}{v.plate ? ` (${v.plate})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                )} />
            </F>

            <div className="grid grid-cols-2 gap-4">
                <F id="maintenancetype" label="Type">
                    <Controller name="maintenancetype" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '1'} onValueChange={v => field.onChange(v ?? '1')}>
                            <SelectTrigger id="maintenancetype" className={ST}>
                                <SelectValue>{(v: string) => MAINT_TYPES[Number(v)] ?? 'Select'}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(MAINT_TYPES).map(([k, v]) => (
                                    <SelectItem key={k} value={k} label={v}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="status" label="Status">
                    <Controller name="status" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '1'} onValueChange={v => field.onChange(v ?? '1')}>
                            <SelectTrigger id="status" className={ST}>
                                <SelectValue>{(v: string) => MAINT_STATUSES[Number(v)] ?? 'Select'}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(MAINT_STATUSES).map(([k, v]) => (
                                    <SelectItem key={k} value={k} label={v}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="scheduleddate" label="Scheduled Date">
                    <Controller name="scheduleddate" control={control} render={({ field }) => (
                        <DatePicker id="scheduleddate" value={field.value ?? ''} onChange={field.onChange} placeholder="Pick date" />
                    )} />
                </F>
                <F id="completeddate" label="Completed Date">
                    <Controller name="completeddate" control={control} render={({ field }) => (
                        <DatePicker id="completeddate" value={field.value ?? ''} onChange={field.onChange} placeholder="Pick date" />
                    )} />
                </F>
                <F id="cost" label="Cost">
                    <Input id="cost" type="number" step="0.01" {...register('cost')} />
                </F>
                <F id="technicianname" label="Technician">
                    <Input id="technicianname" {...register('technicianname')} placeholder="Name / garage" />
                </F>
            </div>
            <F id="description" label="Description">
                <Textarea id="description" {...register('description')} rows={2} placeholder="Work to be done or completed" />
            </F>
            <F id="notes" label="Notes">
                <Textarea id="notes" {...register('notes')} rows={2} />
            </F>
            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Record'}</Button>
            </div>
        </form>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TransportPage() {
    const [tab, setTab] = useState<'fleet' | 'assignments' | 'maintenance'>('fleet');

    // Fleet state
    const [rows, setRows]           = useState<Vehicle[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [page, setPage]           = useState(1);
    const [vModalOpen, setVModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Vehicle | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);

    // Assignment state
    const [assignments, setAssignments]             = useState<RouteAssignment[]>([]);
    const [aLoading, setALoading]                   = useState(false);
    const [aSetupRequired, setASetupRequired]       = useState(false);
    const [aSearch, setASearch]                     = useState('');
    const [aVehicleFilter, setAVehicleFilter]       = useState('');
    const [aStatusFilter, setAStatusFilter]         = useState('');
    const [aPage, setAPage]                         = useState(1);
    const [aModalOpen, setAModalOpen]               = useState(false);
    const [editingAssign, setEditingAssign]         = useState<RouteAssignment | null>(null);
    const [toDeleteAssign, setToDeleteAssign]       = useState<string | null>(null);
    // Student search for new assignments
    const [stuSearch, setStuSearch]                 = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stuResults, setStuResults]               = useState<any[]>([]);
    const [stuSearching, setStuSearching]           = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedStudent, setSelectedStudent]     = useState<any | null>(null);

    // Maintenance state
    const [maintenances, setMaintenances]           = useState<VehicleMaintenance[]>([]);
    const [mLoading, setMLoading]                   = useState(false);
    const [mSetupRequired, setMSetupRequired]       = useState(false);
    const [mSearch, setMSearch]                     = useState('');
    const [mVehicleFilter, setMVehicleFilter]       = useState('');
    const [mStatusFilter, setMStatusFilter]         = useState('');
    const [mPage, setMPage]                         = useState(1);
    const [mModalOpen, setMModalOpen]               = useState(false);
    const [editingMaint, setEditingMaint]           = useState<VehicleMaintenance | null>(null);
    const [toDeleteMaint, setToDeleteMaint]         = useState<string | null>(null);

    // ── Loaders ───────────────────────────────────────────────────────────────

    const loadVehicles = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await transportAPI.getAll();
            setRows(res.data ?? []);
        } catch { toast.error('Failed to load vehicles'); }
        finally { setLoading(false); }
    };

    const loadAssignments = useCallback(async () => {
        setALoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await routeAssignmentsAPI.getAll(aVehicleFilter ? { vehicleid: aVehicleFilter } : undefined);
            if (res.setup_required) { setASetupRequired(true); setAssignments([]); }
            else                    { setASetupRequired(false); setAssignments(res.data ?? []); }
        } catch { toast.error('Failed to load assignments'); }
        finally { setALoading(false); }
    }, [aVehicleFilter]);

    const loadMaintenance = useCallback(async () => {
        setMLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await vehicleMaintenanceAPI.getAll(mVehicleFilter ? { vehicleid: mVehicleFilter } : undefined);
            if (res.setup_required) { setMSetupRequired(true); setMaintenances([]); }
            else                    { setMSetupRequired(false); setMaintenances(res.data ?? []); }
        } catch { toast.error('Failed to load maintenance records'); }
        finally { setMLoading(false); }
    }, [mVehicleFilter]);

    useEffect(() => { loadVehicles(); }, []);
    useEffect(() => { if (tab === 'assignments') loadAssignments(); }, [tab, loadAssignments]);
    useEffect(() => { if (tab === 'maintenance') loadMaintenance(); }, [tab, loadMaintenance]);
    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { setAPage(1); }, [aSearch, aStatusFilter]);
    useEffect(() => { setMPage(1); }, [mSearch, mStatusFilter]);

    // Student search
    const searchStudents = useCallback(async (q: string) => {
        if (!q.trim()) { setStuResults([]); return; }
        setStuSearching(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await fetch(`/api/students?search=${encodeURIComponent(q)}&pageSize=10`).then(r => r.json());
            setStuResults(res.data ?? []);
        } catch { setStuResults([]); }
        finally { setStuSearching(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => searchStudents(stuSearch), 300);
        return () => clearTimeout(t);
    }, [stuSearch, searchStudents]);

    // ── Computed ──────────────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return q ? rows.filter(r => `${r.name} ${r.plate} ${r.driver}`.toLowerCase().includes(q)) : rows;
    }, [search, rows]);

    const filteredAssignments = useMemo(() => {
        const q = aSearch.toLowerCase();
        return assignments.filter(a =>
            (!aStatusFilter || String(a.status) === aStatusFilter) &&
            (!q || `${a.studentname} ${a.vehiclename} ${a.routename} ${a.pickuppoint}`.toLowerCase().includes(q))
        );
    }, [aSearch, aStatusFilter, assignments]);

    const filteredMaintenance = useMemo(() => {
        const q = mSearch.toLowerCase();
        return maintenances.filter(m =>
            (!mStatusFilter || String(m.status) === mStatusFilter) &&
            (!q || `${m.vehiclename} ${m.description} ${m.technicianname}`.toLowerCase().includes(q))
        );
    }, [mSearch, mStatusFilter, maintenances]);

    const active      = rows.filter(r => r.status === 1);
    const maintenance = rows.filter(r => r.status === 2);
    const totalSeats  = active.reduce((s, r) => s + r.capacity, 0);

    const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const aTotalPages = Math.max(1, Math.ceil(filteredAssignments.length / PAGE_SIZE));
    const aPaginated  = filteredAssignments.slice((aPage - 1) * PAGE_SIZE, aPage * PAGE_SIZE);
    const mTotalPages = Math.max(1, Math.ceil(filteredMaintenance.length / PAGE_SIZE));
    const mPaginated  = filteredMaintenance.slice((mPage - 1) * PAGE_SIZE, mPage * PAGE_SIZE);

    // ── Handlers ─────────────────────────────────────────────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleVehicleSubmit = async (data: any) => {
        const payload = { ...data, vehicletype: Number(data.vehicletype), status: Number(data.status) };
        try {
            if (editing) { await transportAPI.update(editing.vehicleid, payload); toast.success('Updated'); }
            else         { await transportAPI.create(payload);                    toast.success('Vehicle added'); }
            setVModalOpen(false); setEditing(null); loadVehicles();
        } catch { toast.error('Failed to save'); }
    };

    const handleVehicleDelete = async (id: string) => {
        try { await transportAPI.delete(id); toast.success('Deleted'); loadVehicles(); }
        catch { toast.error('Failed to delete'); }
    };

    const handleAssignSubmit = async (data: AssignFormData) => {
        if (!selectedStudent) { toast.error('Select a student first'); return; }
        const vehicle = rows.find(v => v.vehicleid === data.vehicleid);
        try {
            const payload = {
                studentid:   selectedStudent.studentid ?? selectedStudent.id,
                studentname: selectedStudent.fullname  || `${selectedStudent.firstname ?? ''} ${selectedStudent.lastname ?? ''}`.trim(),
                vehicleid:   data.vehicleid,
                vehiclename: vehicle?.name ?? '',
                routename:   data.routename,
                pickuppoint: data.pickuppoint,
                pickuptime:  data.pickuptime,
                status:      Number(data.status),
            };
            if (editingAssign) {
                await routeAssignmentsAPI.update(editingAssign.assignmentid, { ...payload, status: Number(data.status) });
                toast.success('Assignment updated');
            } else {
                await routeAssignmentsAPI.create(payload);
                toast.success('Student assigned');
            }
            setAModalOpen(false); setEditingAssign(null); setSelectedStudent(null); setStuSearch(''); setStuResults([]);
            loadAssignments();
        } catch { toast.error('Failed to save assignment'); }
    };

    const handleAssignDelete = async (id: string) => {
        try { await routeAssignmentsAPI.delete(id); toast.success('Removed'); loadAssignments(); }
        catch { toast.error('Failed to delete'); }
    };

    const handleMaintSubmit = async (data: MaintFormData) => {
        const vehicle = rows.find(v => v.vehicleid === data.vehicleid);
        const payload = {
            vehicleid:       data.vehicleid,
            vehiclename:     vehicle?.name ?? '',
            maintenancetype: Number(data.maintenancetype),
            description:     data.description,
            scheduleddate:   data.scheduleddate,
            completeddate:   data.completeddate || undefined,
            cost:            data.cost,
            technicianname:  data.technicianname,
            status:          Number(data.status),
            notes:           data.notes,
        };
        try {
            if (editingMaint) { await vehicleMaintenanceAPI.update(editingMaint.maintenanceid, payload); toast.success('Record updated'); }
            else              { await vehicleMaintenanceAPI.create(payload);                             toast.success('Record added'); }
            setMModalOpen(false); setEditingMaint(null); loadMaintenance();
        } catch { toast.error('Failed to save record'); }
    };

    const handleMaintDelete = async (id: string) => {
        try { await vehicleMaintenanceAPI.delete(id); toast.success('Deleted'); loadMaintenance(); }
        catch { toast.error('Failed to delete'); }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Transport & Fleet</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{rows.length} vehicle{rows.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { loadVehicles(); if (tab === 'assignments') loadAssignments(); if (tab === 'maintenance') loadMaintenance(); }} disabled={loading || aLoading || mLoading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${(loading || aLoading || mLoading) ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    {tab === 'fleet' && <>
                        <Button variant="outline" size="sm" onClick={() => exportToCSV(`fleet_${new Date().toISOString().slice(0, 10)}`,
                            ['Name', 'Plate', 'Type', 'Capacity', 'Driver', 'Phone', 'Year', 'Colour', 'Status'],
                            filtered.map(r => [r.name, r.plate, VEH_TYPES[r.vehicletype] ?? '', r.capacity, r.driver, r.driverphone, r.year, r.color, VEH_STATUSES[r.status] ?? '']))}>
                            <Download className="h-4 w-4 mr-1.5" /> Export CSV
                        </Button>
                        <Button onClick={() => { setEditing(null); setVModalOpen(true); }}>
                            <Plus className="h-4 w-4 mr-1" /> Add Vehicle
                        </Button>
                    </>}
                    {tab === 'assignments' && !aSetupRequired && (
                        <Button onClick={() => { setEditingAssign(null); setSelectedStudent(null); setStuSearch(''); setStuResults([]); setAModalOpen(true); }}>
                            <Plus className="h-4 w-4 mr-1" /> Assign Student
                        </Button>
                    )}
                    {tab === 'maintenance' && !mSetupRequired && (
                        <Button onClick={() => { setEditingMaint(null); setMModalOpen(true); }}>
                            <Plus className="h-4 w-4 mr-1" /> Add Record
                        </Button>
                    )}
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

            {/* Tab switcher */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                {(['fleet', 'assignments', 'maintenance'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            tab === t
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}>
                        {t === 'fleet' ? 'Fleet' : t === 'assignments' ? `Assignments${assignments.length > 0 ? ` (${assignments.length})` : ''}` : `Maintenance${maintenances.length > 0 ? ` (${maintenances.length})` : ''}`}
                    </button>
                ))}
            </div>

            {/* ── Fleet tab ── */}
            {tab === 'fleet' && <div className="space-y-4 pt-1">
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
                                        <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{r.plate || '—'}</TableCell>
                                        <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{VEH_TYPES[r.vehicletype] ?? '—'}</TableCell>
                                        <TableCell className="text-slate-900 dark:text-slate-100 font-semibold text-center">{r.capacity || '—'}</TableCell>
                                        <TableCell>
                                            <p className="text-sm text-slate-900 dark:text-slate-100">{r.driver || '—'}</p>
                                            {r.driverphone && <p className="text-xs text-slate-400 dark:text-slate-500">{r.driverphone}</p>}
                                        </TableCell>
                                        <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                                            {r.year ? `${r.year}` : '—'}{r.color ? ` · ${r.color}` : ''}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={STATUS_VARIANT[r.status] ?? 'default'}>{VEH_STATUSES[r.status] ?? 'Unknown'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setVModalOpen(true); }}>
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
            </div>}

            {/* ── Assignments tab ── */}
            {tab === 'assignments' && <div className="space-y-4 pt-1">
                {aSetupRequired ? (
                    <SetupGuide tableName="sms_routeassignment" columns={[
                        ['Student ID',    'sms_studentid',   'Text'],
                        ['Student Name',  'sms_studentname', 'Text'],
                        ['Vehicle ID',    'sms_vehicleid',   'Text'],
                        ['Vehicle Name',  'sms_vehiclename', 'Text'],
                        ['Route Name',    'sms_routename',   'Text'],
                        ['Pickup Point',  'sms_pickuppoint', 'Text'],
                        ['Pickup Time',   'sms_pickuptime',  'Text'],
                        ['Status',        'sms_status',      'Whole Number (1=Active, 2=Suspended, 3=Ended)'],
                        ['School',        'sms_school',      'Lookup → sms_school'],
                    ]} />
                ) : <>
                    <div className="flex gap-3 items-center flex-wrap">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <Input placeholder="Search students, routes…" className="pl-9" value={aSearch} onChange={e => setASearch(e.target.value)} />
                        </div>
                        <SelectRoot value={aVehicleFilter} onValueChange={v => setAVehicleFilter(v ?? '')}>
                            <SelectTrigger className={`w-44 ${SF}`}>
                                <SelectValue placeholder="All Vehicles">
                                    {(v: string | null) => v ? (rows.find(r => r.vehicleid === v)?.name ?? 'All Vehicles') : null}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="" label="All Vehicles">All Vehicles</SelectItem>
                                {rows.map(r => <SelectItem key={r.vehicleid} value={r.vehicleid} label={r.name}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                        <SelectRoot value={aStatusFilter} onValueChange={v => setAStatusFilter(v ?? '')}>
                            <SelectTrigger className={`w-36 ${SF}`}>
                                <SelectValue placeholder="All Statuses">
                                    {(v: string | null) => v ? (ASSIGN_STATUSES[Number(v)] ?? 'All Statuses') : null}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="" label="All Statuses">All Statuses</SelectItem>
                                {Object.entries(ASSIGN_STATUSES).map(([k, v]) => (
                                    <SelectItem key={k} value={k} label={v}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={() => exportToCSV(`assignments_${new Date().toISOString().slice(0, 10)}`,
                            ['Student', 'Vehicle', 'Route', 'Pickup Point', 'Pickup Time', 'Status'],
                            filteredAssignments.map(a => [a.studentname, a.vehiclename, a.routename, a.pickuppoint, a.pickuptime, ASSIGN_STATUSES[a.status] ?? '']))}>
                            <Download className="h-4 w-4 mr-1.5" /> Export CSV
                        </Button>
                    </div>
                    {aLoading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                    ) : !filteredAssignments.length ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                            <Users className="h-10 w-10 mb-3 opacity-40" />
                            <p className="text-sm">{aSearch || aVehicleFilter || aStatusFilter ? 'No assignments match your filters' : 'No student assignments yet'}</p>
                            {!aSearch && !aVehicleFilter && !aStatusFilter && (
                                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setEditingAssign(null); setSelectedStudent(null); setStuSearch(''); setStuResults([]); setAModalOpen(true); }}>
                                    <Plus className="h-4 w-4 mr-1" /> Assign first student
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <Table className="w-full text-sm">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Route</TableHead>
                                        <TableHead>Pickup Point</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aPaginated.map(a => (
                                        <TableRow key={a.assignmentid}>
                                            <TableCell className="font-medium text-slate-900 dark:text-slate-100">{a.studentname || '—'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                    <Bus className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                                                    <span className="text-sm">{a.vehiclename || '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{a.routename || '—'}</TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                                                {a.pickuppoint ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3 flex-shrink-0" />{a.pickuppoint}</span> : '—'}
                                            </TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                                                {a.pickuptime ? <span className="flex items-center gap-1"><Clock className="h-3 w-3 flex-shrink-0" />{a.pickuptime}</span> : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={ASSIGN_VARIANT[a.status] ?? 'default'}>{ASSIGN_STATUSES[a.status] ?? '—'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        setEditingAssign(a);
                                                        setSelectedStudent({ studentid: a.studentid, fullname: a.studentname });
                                                        setAModalOpen(true);
                                                    }}>
                                                        <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setToDeleteAssign(a.assignmentid)}>
                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination page={aPage} totalPages={aTotalPages} total={filteredAssignments.length} pageSize={PAGE_SIZE} label="assignment" onChange={setAPage} />
                        </div>
                    )}
                </>}
            </div>}

            {/* ── Maintenance tab ── */}
            {tab === 'maintenance' && <div className="space-y-4 pt-1">
                {mSetupRequired ? (
                    <SetupGuide tableName="sms_vehiclemaintenance" columns={[
                        ['Vehicle ID',       'sms_vehicleid',       'Text'],
                        ['Vehicle Name',     'sms_vehiclename',     'Text'],
                        ['Maintenance Type', 'sms_maintenancetype', 'Whole Number (1=Routine Service, 2=Repair, 3=Inspection, 4=Tyre Change, 5=Other)'],
                        ['Description',      'sms_description',     'Multiline Text'],
                        ['Scheduled Date',   'sms_scheduleddate',   'Date Only'],
                        ['Completed Date',   'sms_completeddate',   'Date Only'],
                        ['Cost',             'sms_cost',            'Decimal'],
                        ['Technician Name',  'sms_technicianname',  'Text'],
                        ['Status',           'sms_status',          'Whole Number (1=Scheduled, 2=In Progress, 3=Completed, 4=Cancelled)'],
                        ['Notes',            'sms_notes',           'Multiline Text'],
                        ['School',           'sms_school',          'Lookup → sms_school'],
                    ]} />
                ) : <>
                    <div className="flex gap-3 items-center flex-wrap">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <Input placeholder="Search records…" className="pl-9" value={mSearch} onChange={e => setMSearch(e.target.value)} />
                        </div>
                        <SelectRoot value={mVehicleFilter} onValueChange={v => setMVehicleFilter(v ?? '')}>
                            <SelectTrigger className={`w-44 ${SF}`}>
                                <SelectValue placeholder="All Vehicles">
                                    {(v: string | null) => v ? (rows.find(r => r.vehicleid === v)?.name ?? 'All Vehicles') : null}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="" label="All Vehicles">All Vehicles</SelectItem>
                                {rows.map(r => <SelectItem key={r.vehicleid} value={r.vehicleid} label={r.name}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                        <SelectRoot value={mStatusFilter} onValueChange={v => setMStatusFilter(v ?? '')}>
                            <SelectTrigger className={`w-36 ${SF}`}>
                                <SelectValue placeholder="All Statuses">
                                    {(v: string | null) => v ? (MAINT_STATUSES[Number(v)] ?? 'All Statuses') : null}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="" label="All Statuses">All Statuses</SelectItem>
                                {Object.entries(MAINT_STATUSES).map(([k, v]) => (
                                    <SelectItem key={k} value={k} label={v}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={() => exportToCSV(`maintenance_${new Date().toISOString().slice(0, 10)}`,
                            ['Vehicle', 'Type', 'Description', 'Scheduled', 'Completed', 'Cost', 'Technician', 'Status'],
                            filteredMaintenance.map(m => [m.vehiclename, MAINT_TYPES[m.maintenancetype] ?? '', m.description, m.scheduleddate, m.completeddate, m.cost, m.technicianname, MAINT_STATUSES[m.status] ?? '']))}>
                            <Download className="h-4 w-4 mr-1.5" /> Export CSV
                        </Button>
                    </div>
                    {mLoading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                    ) : !filteredMaintenance.length ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                            <Wrench className="h-10 w-10 mb-3 opacity-40" />
                            <p className="text-sm">{mSearch || mVehicleFilter || mStatusFilter ? 'No records match your filters' : 'No maintenance records yet'}</p>
                            {!mSearch && !mVehicleFilter && !mStatusFilter && (
                                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setEditingMaint(null); setMModalOpen(true); }}>
                                    <Plus className="h-4 w-4 mr-1" /> Add first record
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <Table className="w-full text-sm">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Scheduled</TableHead>
                                        <TableHead>Completed</TableHead>
                                        <TableHead>Cost</TableHead>
                                        <TableHead>Technician</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mPaginated.map(m => (
                                        <TableRow key={m.maintenanceid}>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Bus className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{m.vehiclename || '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                                                {MAINT_TYPES[m.maintenancetype] ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs max-w-[160px] truncate">
                                                {m.description || '—'}
                                            </TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{m.scheduleddate || '—'}</TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{m.completeddate || '—'}</TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                                                {m.cost > 0 ? `$${m.cost.toFixed(2)}` : '—'}
                                            </TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{m.technicianname || '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={MAINT_STATUS_VARIANT[m.status] ?? 'default'}>{MAINT_STATUSES[m.status] ?? '—'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingMaint(m); setMModalOpen(true); }}>
                                                        <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setToDeleteMaint(m.maintenanceid)}>
                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination page={mPage} totalPages={mTotalPages} total={filteredMaintenance.length} pageSize={PAGE_SIZE} label="record" onChange={setMPage} />
                        </div>
                    )}
                </>}
            </div>}

            {/* ── Vehicle dialog ── */}
            <Dialog open={vModalOpen} onOpenChange={o => { if (!o) { setVModalOpen(false); setEditing(null); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle></DialogHeader>
                    <VehicleForm
                        defaultValues={editing ? { name: editing.name, plate: editing.plate, vehicletype: String(editing.vehicletype), capacity: editing.capacity, driver: editing.driver, driverphone: editing.driverphone, year: editing.year, color: editing.color, status: String(editing.status), notes: editing.notes } : undefined}
                        onSubmit={handleVehicleSubmit} onCancel={() => { setVModalOpen(false); setEditing(null); }}
                    />
                </DialogContent>
            </Dialog>

            {/* ── Assignment dialog ── */}
            <Dialog open={aModalOpen} onOpenChange={o => { if (!o) { setAModalOpen(false); setEditingAssign(null); setSelectedStudent(null); setStuSearch(''); setStuResults([]); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editingAssign ? 'Edit Assignment' : 'Assign Student to Vehicle'}</DialogTitle></DialogHeader>
                    {/* Student search (only for new assignments) */}
                    {!editingAssign && (
                        <div className="space-y-2">
                            <Label>Search Student *</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Type student name…"
                                    value={stuSearch}
                                    onChange={e => { setStuSearch(e.target.value); setSelectedStudent(null); }}
                                />
                            </div>
                            {stuSearching && <p className="text-xs text-slate-400 pl-1">Searching…</p>}
                            {stuResults.length > 0 && !selectedStudent && (
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                                    {stuResults.map((s: any) => (
                                        <button key={s.studentid ?? s.id} type="button"
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                            onClick={() => { setSelectedStudent(s); setStuSearch(s.fullname || `${s.firstname ?? ''} ${s.lastname ?? ''}`.trim()); setStuResults([]); }}>
                                            {s.fullname || `${s.firstname ?? ''} ${s.lastname ?? ''}`.trim()}
                                            {s.admissionnumber && <span className="ml-2 text-xs text-slate-400">{s.admissionnumber}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {selectedStudent && (
                                <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                        {selectedStudent.fullname || `${selectedStudent.firstname ?? ''} ${selectedStudent.lastname ?? ''}`.trim()}
                                    </span>
                                    <button type="button" onClick={() => { setSelectedStudent(null); setStuSearch(''); }} className="text-emerald-600 hover:text-emerald-800">
                                        <XCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {(selectedStudent || editingAssign) && (
                        <AssignmentForm
                            vehicles={rows}
                            studentName={editingAssign ? editingAssign.studentname : (selectedStudent?.fullname || `${selectedStudent?.firstname ?? ''} ${selectedStudent?.lastname ?? ''}`.trim())}
                            defaultValues={editingAssign ? {
                                vehicleid:   editingAssign.vehicleid,
                                routename:   editingAssign.routename,
                                pickuppoint: editingAssign.pickuppoint,
                                pickuptime:  editingAssign.pickuptime,
                                status:      String(editingAssign.status),
                            } : undefined}
                            onSubmit={handleAssignSubmit}
                            onCancel={() => { setAModalOpen(false); setEditingAssign(null); setSelectedStudent(null); setStuSearch(''); setStuResults([]); }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Maintenance dialog ── */}
            <Dialog open={mModalOpen} onOpenChange={o => { if (!o) { setMModalOpen(false); setEditingMaint(null); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editingMaint ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</DialogTitle></DialogHeader>
                    <MaintenanceForm
                        vehicles={rows}
                        defaultValues={editingMaint ? {
                            vehicleid:       editingMaint.vehicleid,
                            maintenancetype: String(editingMaint.maintenancetype),
                            description:     editingMaint.description,
                            scheduleddate:   editingMaint.scheduleddate,
                            completeddate:   editingMaint.completeddate,
                            cost:            editingMaint.cost,
                            technicianname:  editingMaint.technicianname,
                            status:          String(editingMaint.status),
                            notes:           editingMaint.notes,
                        } : undefined}
                        onSubmit={handleMaintSubmit}
                        onCancel={() => { setMModalOpen(false); setEditingMaint(null); }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)} title="Delete vehicle?" description="This will permanently remove the vehicle record."
                onConfirm={() => { if (toDelete) { handleVehicleDelete(toDelete); setToDelete(null); } }} />

            <ConfirmDialog open={!!toDeleteAssign} onOpenChange={o => !o && setToDeleteAssign(null)} title="Remove assignment?" description="This will remove the student's transport assignment."
                onConfirm={() => { if (toDeleteAssign) { handleAssignDelete(toDeleteAssign); setToDeleteAssign(null); } }} />

            <ConfirmDialog open={!!toDeleteMaint} onOpenChange={o => !o && setToDeleteMaint(null)} title="Delete maintenance record?" description="This will permanently remove the maintenance log entry."
                onConfirm={() => { if (toDeleteMaint) { handleMaintDelete(toDeleteMaint); setToDeleteMaint(null); } }} />
        </div>
    );
}
