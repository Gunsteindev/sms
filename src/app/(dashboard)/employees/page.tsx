'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Briefcase, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/Badge';
import {
  SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/Select';
import { employeesAPI } from '@/lib/api-client';
import { Pagination } from '@/components/ui/Pagination';
import { exportToCSV } from '@/lib/csv';
import type { Employee } from '@/lib/dataverse/employees';

const PAGE_SIZE = 10;

const schema = z.object({
  firstname:              z.string().min(2, 'Required'),
  lastname:               z.string().min(2, 'Required'),
  emailaddress1:          z.string().email('Invalid email'),
  telephone1:             z.string().optional(),
  employeecode:           z.string().min(1, 'Required'),
  department:             z.string().min(1, 'Required'),
  designation:            z.string().min(1, 'Required'),
  employeetype:           z.string().min(1, 'Required'),
  hiredate:               z.string().min(1, 'Required'),
  dateofbirth:            z.string().min(1, 'Required'),
  gender:                 z.string().min(1, 'Required'),
  address1_line1:         z.string().optional(),
  salary:                 z.coerce.number().optional(),
  emergencycontactname:   z.string().min(1, 'Required'),
  emergencycontactphone:  z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

const EMP_TYPE: Record<number, string> = { 1: 'Full-time', 2: 'Part-time', 3: 'Contract', 4: 'Intern' };
const STATUS: Record<number, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  1: { label: 'Active',      variant: 'success' },
  2: { label: 'On Leave',    variant: 'warning' },
  3: { label: 'Resigned',    variant: 'error' },
  4: { label: 'Terminated',  variant: 'default' },
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

function EmployeeForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { gender: 'Male', employeetype: 'Full-time', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <F id="firstname" label="First Name *" error={errors.firstname?.message}>
          <Input id="firstname" {...register('firstname')} />
        </F>
        <F id="lastname" label="Last Name *" error={errors.lastname?.message}>
          <Input id="lastname" {...register('lastname')} />
        </F>

        <F id="dateofbirth" label="Date of Birth *">
          <Controller control={control} name="dateofbirth" render={({ field }) => (
            <DatePicker id="dateofbirth" value={field.value} onChange={field.onChange} />
          )} />
        </F>

        <F id="gender" label="Gender *">
          <Controller control={control} name="gender" render={({ field }) => (
            <SelectRoot value={field.value ?? ''} onValueChange={(v) => field.onChange(v)}>
              <SelectTrigger id="gender" className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </SelectRoot>
          )} />
        </F>

        <F id="emailaddress1" label="Email *" error={errors.emailaddress1?.message}>
          <Input id="emailaddress1" {...register('emailaddress1')} type="email" />
        </F>
        <F id="telephone1" label="Phone">
          <Input id="telephone1" {...register('telephone1')} type="tel" />
        </F>
        <F id="employeecode" label="Employee Code *" error={errors.employeecode?.message}>
          <Input id="employeecode" {...register('employeecode')} />
        </F>
        <F id="department" label="Department *" error={errors.department?.message}>
          <Input id="department" {...register('department')} />
        </F>
        <F id="designation" label="Designation *" error={errors.designation?.message}>
          <Input id="designation" {...register('designation')} />
        </F>

        <F id="employeetype" label="Type *">
          <Controller control={control} name="employeetype" render={({ field }) => (
            <SelectRoot value={field.value ?? ''} onValueChange={(v) => field.onChange(v)}>
              <SelectTrigger id="employeetype" className="w-full"><SelectValue>{(v: string) => EMP_TYPE[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
              <SelectContent>
                {Object.entries(EMP_TYPE).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          )} />
        </F>

        <F id="hiredate" label="Hire Date *">
          <Controller control={control} name="hiredate" render={({ field }) => (
            <DatePicker id="hiredate" value={field.value} onChange={field.onChange} />
          )} />
        </F>

        <F id="salary" label="Salary">
          <Input id="salary" {...register('salary')} type="number" />
        </F>
        <F id="emergencycontactname" label="Emergency Contact *" error={errors.emergencycontactname?.message}>
          <Input id="emergencycontactname" {...register('emergencycontactname')} />
        </F>
        <F id="emergencycontactphone" label="Emergency Phone *" error={errors.emergencycontactphone?.message}>
          <Input id="emergencycontactphone" {...register('emergencycontactphone')} type="tel" />
        </F>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Employee'}</Button>
      </div>
    </form>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Employee | null>(null);
  const [toDelete, setToDelete]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await employeesAPI.getAll();
      setEmployees(res.data ?? []);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? employees.filter((e) => `${e.firstname} ${e.lastname} ${e.department} ${e.designation}`.toLowerCase().includes(q)) : employees;
  }, [search, employees]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      if (editing) { await employeesAPI.update(editing.employeeid, { ...data, gender: ({ Male:1, Female:2 } as Record<string,number>)[data.gender] ?? 1, employeetype: Object.entries(EMP_TYPE).find(([,l])=>l===data.employeetype)?.[0] ? Number(Object.entries(EMP_TYPE).find(([,l])=>l===data.employeetype)![0]) : 1 }); toast.success('Employee updated'); }
      else          { await employeesAPI.create({ ...data, gender: ({ Male:1, Female:2 } as Record<string,number>)[data.gender] ?? 1, employeetype: Object.entries(EMP_TYPE).find(([,l])=>l===data.employeetype)?.[0] ? Number(Object.entries(EMP_TYPE).find(([,l])=>l===data.employeetype)![0]) : 1 });                    toast.success('Employee added'); }
      setModalOpen(false); setEditing(null); load();
    } catch { toast.error('Failed to save employee'); }
  };

  const handleDelete = async (id: string) => {
    try { await employeesAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            exportToCSV(`employees_${new Date().toISOString().slice(0,10)}`, [
              'Code', 'First Name', 'Last Name', 'Gender', 'Department', 'Designation',
              'Type', 'Email', 'Phone', 'Hire Date', 'Status', 'Salary',
            ], employees.map(e => [
              e.employeecode, e.firstname, e.lastname,
              e.gender === 1 ? 'Male' : e.gender === 2 ? 'Female' : '',
              e.department, e.designation,
              ['','Full-time','Part-time','Contract','Intern'][e.employeetype] ?? '',
              e.emailaddress1, e.telephone1, e.hiredate?.slice(0,10),
              ['','Active','On Leave','Resigned','Terminated'][e.statuscode] ?? '',
              e.salary ?? '',
            ]));
          }}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <Input placeholder="Search employees…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
          <Briefcase className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No employees found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/60">
                {['Employee','Code','Department','Designation','Type','Status',''].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {paginated.map((e) => {
                const status = STATUS[e.statuscode] ?? { label: 'Unknown', variant: 'default' as const };
                return (
                  <TableRow key={e.employeeid} className="hover:bg-blue-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-700">
                          {e.firstname[0]}{e.lastname[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{e.firstname} {e.lastname}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{e.emailaddress1}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{e.employeecode}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.department}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.designation}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{EMP_TYPE[e.employeetype] ?? '—'}</TableCell>
                    <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(e); setModalOpen(true); }}>
                          <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setToDelete(e.employeeid)}>
                          <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="employee" onChange={setPage} />
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
        <EmployeeForm defaultValues={editing as any ?? undefined} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
              </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete employee?"
        description="This will permanently remove the employee record."
        onConfirm={() => { if (toDelete) handleDelete(toDelete); setToDelete(null); }}
      />
    </div>
  );
}
