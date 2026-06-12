'use client';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useEffect, useState, useMemo } from 'react';
import {
    Plus, Search, Pencil, Trash2, Briefcase, Phone, Mail,
    RefreshCw, Download, Users, UserCheck, PlaneTakeoff, UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { DatePicker } from '@/components/ui/date-picker';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { exportToCSV } from '@/lib/csv';
import { employeesAPI } from '@/lib/api-client';
import type { Employee } from '@/lib/dataverse/employees';

// ── Constants ─────────────────────────────────────────────────────────────────

const EMP_TYPE: Record<number, { label: string; variant: string }> = {
    1: { label: 'Teaching',       variant: 'default' },
    2: { label: 'Non-Teaching',   variant: 'secondary' },
    3: { label: 'Administrative', variant: 'warning' },
    4: { label: 'Support',        variant: 'info' },
};

const STATUS: Record<number, { label: string; variant: string }> = {
    1: { label: 'Active',     variant: 'success' },
    2: { label: 'On Leave',   variant: 'warning' },
    3: { label: 'Resigned',   variant: 'error' },
    4: { label: 'Terminated', variant: 'secondary' },
};

const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
];
function avatarColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const PAGE_SIZE = 10;
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

// ── Form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
    employeecode:          z.string().min(1, 'Required'),
    firstname:             z.string().min(2, 'Required'),
    lastname:              z.string().min(2, 'Required'),
    gender:                z.string().min(1, 'Required'),
    dateofbirth:           z.string().min(1, 'Required'),
    emailaddress1:         z.string().email('Invalid email'),
    telephone1:            z.string().optional(),
    address1_line1:        z.string().optional(),
    department:            z.string().min(1, 'Required'),
    designation:           z.string().min(1, 'Required'),
    employeetype:          z.string().min(1, 'Required'),
    hiredate:              z.string().min(1, 'Required'),
    statuscode:            z.string().optional(),
    salary:                z.string().optional(),
    bankaccount:           z.string().optional(),
    emergencycontactname:  z.string().min(1, 'Required'),
    emergencycontactphone: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

function toFormDefaults(e?: Employee): FormData {
    if (!e) return {
        employeecode: '', firstname: '', lastname: '', gender: '1',
        dateofbirth: '', emailaddress1: '', telephone1: '', address1_line1: '',
        department: '', designation: '', employeetype: '1', hiredate: '',
        statuscode: '1', salary: '', bankaccount: '',
        emergencycontactname: '', emergencycontactphone: '',
    };
    return {
        employeecode:          e.employeecode,
        firstname:             e.firstname,
        lastname:              e.lastname,
        gender:                String(e.gender),
        dateofbirth:           e.dateofbirth?.slice(0, 10) ?? '',
        emailaddress1:         e.emailaddress1,
        telephone1:            e.telephone1 ?? '',
        address1_line1:        e.address1_line1 ?? '',
        department:            e.department,
        designation:           e.designation,
        employeetype:          String(e.employeetype),
        hiredate:              e.hiredate?.slice(0, 10) ?? '',
        statuscode:            String(e.statuscode ?? 1),
        salary:                e.salary != null ? String(e.salary) : '',
        bankaccount:           e.bankaccount ?? '',
        emergencycontactname:  e.emergencycontactname,
        emergencycontactphone: e.emergencycontactphone,
    };
}

// ── Employee form ─────────────────────────────────────────────────────────────

function EmployeeForm({ open, onClose, editing, onSaved }: {
    open: boolean; onClose: () => void; editing: Employee | null; onSaved: () => void;
}) {
    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => { reset(toFormDefaults(editing ?? undefined)); }, [editing, open, reset]);

    const onSubmit = async (data: FormData) => {
        const payload = {
            employeecode:          data.employeecode,
            firstname:             data.firstname,
            lastname:              data.lastname,
            gender:                Number(data.gender),
            dateofbirth:           data.dateofbirth,
            emailaddress1:         data.emailaddress1,
            telephone1:            data.telephone1 || undefined,
            address1_line1:        data.address1_line1 || undefined,
            department:            data.department,
            designation:           data.designation,
            employeetype:          Number(data.employeetype),
            hiredate:              data.hiredate,
            statuscode:            data.statuscode ? Number(data.statuscode) : 1,
            salary:                data.salary ? Number(data.salary) : undefined,
            bankaccount:           data.bankaccount || undefined,
            emergencycontactname:  data.emergencycontactname,
            emergencycontactphone: data.emergencycontactphone,
        };
        try {
            if (editing) {
                await employeesAPI.update(editing.employeeid, payload);
                toast.success('Employee updated');
            } else {
                await employeesAPI.create(payload);
                toast.success('Employee added');
            }
            onSaved();
            onClose();
        } catch { toast.error('Failed to save employee'); }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

                    {/* Personal */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>First Name *</Label>
                            <Input {...register('firstname')} placeholder="John" />
                            {errors.firstname && <p className="text-xs text-red-500">{errors.firstname.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Last Name *</Label>
                            <Input {...register('lastname')} placeholder="Doe" />
                            {errors.lastname && <p className="text-xs text-red-500">{errors.lastname.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Employee Code *</Label>
                            <Input {...register('employeecode')} placeholder="EMP-001" />
                            {errors.employeecode && <p className="text-xs text-red-500">{errors.employeecode.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Gender *</Label>
                            <Controller name="gender" control={control} render={({ field }) => (
                                <SelectRoot value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className={ST}><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Male</SelectItem>
                                        <SelectItem value="2">Female</SelectItem>
                                        <SelectItem value="3">Other</SelectItem>
                                    </SelectContent>
                                </SelectRoot>
                            )} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Date of Birth *</Label>
                            <Controller name="dateofbirth" control={control} render={({ field }) => (
                                <DatePicker value={field.value} onChange={field.onChange} placeholder="YYYY-MM-DD" />
                            )} />
                            {errors.dateofbirth && <p className="text-xs text-red-500">{errors.dateofbirth.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Hire Date *</Label>
                            <Controller name="hiredate" control={control} render={({ field }) => (
                                <DatePicker value={field.value} onChange={field.onChange} placeholder="YYYY-MM-DD" />
                            )} />
                            {errors.hiredate && <p className="text-xs text-red-500">{errors.hiredate.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Email *</Label>
                            <Input {...register('emailaddress1')} placeholder="john@school.com" type="email" />
                            {errors.emailaddress1 && <p className="text-xs text-red-500">{errors.emailaddress1.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Phone</Label>
                            <Input {...register('telephone1')} placeholder="+233 24 000 0000" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label>Address</Label>
                        <Input {...register('address1_line1')} placeholder="123 Main Street, Accra" />
                    </div>

                    {/* Employment */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employment Details</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Department *</Label>
                                <Input {...register('department')} placeholder="e.g. Administration" />
                                {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Designation *</Label>
                                <Input {...register('designation')} placeholder="e.g. Accountant" />
                                {errors.designation && <p className="text-xs text-red-500">{errors.designation.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Employment Type *</Label>
                                <Controller name="employeetype" control={control} render={({ field }) => (
                                    <SelectRoot value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={ST}><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Teaching</SelectItem>
                                            <SelectItem value="2">Non-Teaching</SelectItem>
                                            <SelectItem value="3">Administrative</SelectItem>
                                            <SelectItem value="4">Support</SelectItem>
                                        </SelectContent>
                                    </SelectRoot>
                                )} />
                            </div>
                            <div className="space-y-1">
                                <Label>Status</Label>
                                <Controller name="statuscode" control={control} render={({ field }) => (
                                    <SelectRoot value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={ST}><SelectValue placeholder="Select status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Active</SelectItem>
                                            <SelectItem value="2">On Leave</SelectItem>
                                            <SelectItem value="3">Resigned</SelectItem>
                                            <SelectItem value="4">Terminated</SelectItem>
                                        </SelectContent>
                                    </SelectRoot>
                                )} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Monthly Salary (GHS)</Label>
                                <Input {...register('salary')} type="number" placeholder="0.00" step="0.01" />
                            </div>
                            <div className="space-y-1">
                                <Label>Bank Account</Label>
                                <Input {...register('bankaccount')} placeholder="Account number" />
                            </div>
                        </div>
                    </div>

                    {/* Emergency */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emergency Contact</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Name *</Label>
                                <Input {...register('emergencycontactname')} placeholder="Contact person" />
                                {errors.emergencycontactname && <p className="text-xs text-red-500">{errors.emergencycontactname.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Phone *</Label>
                                <Input {...register('emergencycontactphone')} placeholder="+233 24 000 0000" />
                                {errors.emergencycontactphone && <p className="text-xs text-red-500">{errors.emergencycontactphone.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Employee'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
    const [employees, setEmployees]       = useState<Employee[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [typeFilter, setTypeFilter]     = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]                 = useState(1);
    const [modalOpen, setModalOpen]       = useState(false);
    const [editing, setEditing]           = useState<Employee | null>(null);
    const [deleting, setDeleting]         = useState<Employee | null>(null);
    const [stats, setStats]               = useState({ total: 0, active: 0, onLeave: 0, resigned: 0 });

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await employeesAPI.getAll() as any;
            setEmployees(res.data?.data ?? res.data ?? []);
        } catch { toast.error('Failed to load employees'); }
        finally { setLoading(false); }
    };

    const loadStats = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await employeesAPI.getStats() as any;
            const d = res.data?.data ?? res.data;
            if (d) setStats({ total: d.total ?? 0, active: d.active ?? 0, onLeave: d.onLeave ?? 0, resigned: d.resigned ?? 0 });
        } catch { /* silent */ }
    };

    useEffect(() => { load(); loadStats(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return employees.filter(e => {
            const txt = `${e.firstname} ${e.lastname} ${e.employeecode} ${e.department} ${e.designation}`.toLowerCase();
            if (q && !txt.includes(q)) return false;
            if (typeFilter   && String(e.employeetype) !== typeFilter)   return false;
            if (statusFilter && String(e.statuscode)   !== statusFilter) return false;
            return true;
        });
    }, [employees, search, typeFilter, statusFilter]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleDelete = async () => {
        if (!deleting) return;
        try {
            await employeesAPI.delete(deleting.employeeid);
            toast.success('Employee deleted');
            setDeleting(null);
            load(); loadStats();
        } catch { toast.error('Failed to delete'); }
    };

    const openAdd  = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (e: Employee) => { setEditing(e); setModalOpen(true); };

    const handleExport = () => {
        exportToCSV('employees.csv',
            ['Code', 'First Name', 'Last Name', 'Department', 'Designation', 'Type', 'Status', 'Email', 'Phone', 'Hire Date'],
            filtered.map(e => [
                e.employeecode, e.firstname, e.lastname, e.department, e.designation,
                EMP_TYPE[e.employeetype]?.label ?? '', STATUS[e.statuscode]?.label ?? '',
                e.emailaddress1, e.telephone1, e.hiredate?.slice(0, 10) ?? '',
            ])
        );
    };

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-slate-400" /> Employees
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : `${employees.length} employee${employees.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { load(); loadStats(); }} disabled={loading}>
                        <RefreshCw className={`h-3.5 w-3.5 mr-1${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                    </Button>
                    <Button size="sm" onClick={openAdd}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Employee
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Staff', value: stats.total,    icon: Users,        color: 'text-blue-600 dark:text-blue-400',      bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Active',      value: stats.active,   icon: UserCheck,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'On Leave',    value: stats.onLeave,  icon: PlaneTakeoff, color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Resigned',    value: stats.resigned, icon: UserX,        color: 'text-red-600 dark:text-red-400',        bg: 'bg-red-50 dark:bg-red-900/20' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${bg}`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        className="pl-9"
                        placeholder="Search name, code, department…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <SelectRoot value={typeFilter} onValueChange={v => { setTypeFilter(v ?? ''); setPage(1); }}>
                    <SelectTrigger className="w-44 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="All Types">
                            {(v: string) => v ? (EMP_TYPE[Number(v)]?.label ?? v) : 'All Types'}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="1">Teaching</SelectItem>
                        <SelectItem value="2">Non-Teaching</SelectItem>
                        <SelectItem value="3">Administrative</SelectItem>
                        <SelectItem value="4">Support</SelectItem>
                    </SelectContent>
                </SelectRoot>
                <SelectRoot value={statusFilter} onValueChange={v => { setStatusFilter(v ?? ''); setPage(1); }}>
                    <SelectTrigger className="w-40 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="All Statuses">
                            {(v: string) => v ? (STATUS[Number(v)]?.label ?? v) : 'All Statuses'}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="2">On Leave</SelectItem>
                        <SelectItem value="3">Resigned</SelectItem>
                        <SelectItem value="4">Terminated</SelectItem>
                    </SelectContent>
                </SelectRoot>
                {(search || typeFilter || statusFilter) && (
                    <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setPage(1); }}>
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600">
                    <Briefcase className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">
                        {search || typeFilter || statusFilter ? 'No employees match your filters' : 'No employees yet'}
                    </p>
                    {!search && !typeFilter && !statusFilter && (
                        <p className="text-xs mt-1">Add an employee to get started</p>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table className="w-full text-sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Hire Date</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.map((e) => {
                                    const name     = `${e.firstname} ${e.lastname}`.trim();
                                    const initials = `${e.firstname[0] ?? ''}${e.lastname[0] ?? ''}`.toUpperCase();
                                    const ac       = avatarColor(name);
                                    const st       = STATUS[e.statuscode];
                                    const et       = EMP_TYPE[e.employeetype];
                                    return (
                                        <TableRow key={e.employeeid}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ac}`}>
                                                        {initials}
                                                    </div>
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">{name}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {e.emailaddress1 ? (
                                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                        <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                        <span className="truncate max-w-[180px]">{e.emailaddress1}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {e.telephone1 ? (
                                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                        <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />{e.telephone1}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-slate-700 dark:text-slate-300">{e.department || '—'}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-slate-700 dark:text-slate-300">{e.designation || '—'}</p>
                                            </TableCell>
                                            <TableCell>
                                                {et && <Badge variant={et.variant as 'default'}>{et.label}</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                {st && <Badge variant={st.variant as 'success'}>{st.label}</Badge>}
                                            </TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                                                {e.hiredate ? e.hiredate.slice(0, 10) : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                                                        <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleting(e)}>
                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <Pagination
                        page={page}
                        totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
                        total={filtered.length}
                        pageSize={PAGE_SIZE}
                        label="employees"
                        onChange={setPage}
                    />
                </div>
            )}

            <EmployeeForm
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editing}
                onSaved={() => { load(); loadStats(); }}
            />
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={open => { if (!open) setDeleting(null); }}
                onConfirm={handleDelete}
                title="Delete Employee"
                description={`Remove ${deleting ? `${deleting.firstname} ${deleting.lastname}` : ''} from the system? This cannot be undone.`}
            />
        </div>
    );
}
