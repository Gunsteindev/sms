'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/Select';
import { employeesAPI } from '@/lib/api-client';
import type { Employee } from '@/lib/dataverse/employees';

const schema = z.object({
  firstname:              z.string().min(2, 'Required'),
  lastname:               z.string().min(2, 'Required'),
  emailaddress1:          z.string().email('Invalid email'),
  telephone1:             z.string().optional(),
  employeecode:           z.string().min(1, 'Required'),
  department:             z.string().min(1, 'Required'),
  designation:            z.string().min(1, 'Required'),
  employeetype:           z.coerce.number().min(1),
  hiredate:               z.string().min(1, 'Required'),
  dateofbirth:            z.string().min(1, 'Required'),
  gender:                 z.coerce.number().min(1),
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
    defaultValues: { gender: 1, employeetype: 1, ...defaultValues },
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
            <SelectRoot value={String(field.value ?? '')} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger id="gender" className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Male</SelectItem>
                <SelectItem value="2">Female</SelectItem>
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
            <SelectRoot value={String(field.value ?? '')} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger id="employeetype" className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
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
  const [filtered, setFiltered]   = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Employee | null>(null);
  const [toDelete, setToDelete]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await employeesAPI.getAll();
      setEmployees(res.data ?? []); setFiltered(res.data ?? []);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? employees.filter((e) => `${e.firstname} ${e.lastname} ${e.department} ${e.designation}`.toLowerCase().includes(q)) : employees);
  }, [search, employees]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      if (editing) { await employeesAPI.update(editing.employeeid, data); toast.success('Employee updated'); }
      else          { await employeesAPI.create(data);                    toast.success('Employee added'); }
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
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">{employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search employees…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Briefcase className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No employees found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Employee','Code','Department','Designation','Type','Status',''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((e) => {
                const status = STATUS[e.statuscode] ?? { label: 'Unknown', variant: 'default' as const };
                return (
                  <tr key={e.employeeid} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-700">
                          {e.firstname[0]}{e.lastname[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{e.firstname} {e.lastname}</p>
                          <p className="text-xs text-gray-400">{e.emailaddress1}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.employeecode}</td>
                    <td className="px-4 py-3 text-gray-500">{e.department}</td>
                    <td className="px-4 py-3 text-gray-500">{e.designation}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{EMP_TYPE[e.employeetype] ?? '—'}</td>
                    <td className="px-4 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(e); setModalOpen(true); }}>
                          <Pencil className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setToDelete(e.employeeid)}>
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <EmployeeForm defaultValues={editing as any ?? undefined} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>

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
