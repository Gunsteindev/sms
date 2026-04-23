'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, GraduationCap, Phone, Mail, BookOpen } from 'lucide-react';
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
import { teachersAPI } from '@/lib/api-client';
import { AISummary } from '@/components/ui/AISummary';
import type { Teacher } from '@/lib/dataverse/teachers';

const schema = z.object({
  firstname:      z.string().min(2, 'Required'),
  lastname:       z.string().min(2, 'Required'),
  email:          z.string().email('Invalid email'),
  phone:          z.string().optional(),
  qualification:  z.string().min(1, 'Required'),
  specialization: z.string().min(1, 'Required'),
  employeeid:     z.string().optional(),
  hiredate:       z.string().min(1, 'Required'),
  dateofbirth:    z.string().min(1, 'Required'),
  gender:         z.coerce.number().min(1),
  address:        z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STATUS: Record<number, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  1: { label: 'Active',   variant: 'success' },
  2: { label: 'On Leave', variant: 'warning' },
  3: { label: 'Resigned', variant: 'error' },
};

const GENDER: Record<number, string> = { 1: 'Male', 2: 'Female' };

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

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function TeacherForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { gender: 1, ...defaultValues },
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

        <F id="dateofbirth" label="Date of Birth *" error={errors.dateofbirth?.message}>
          <Controller control={control} name="dateofbirth" render={({ field }) => (
            <DatePicker id="dateofbirth" value={field.value} onChange={field.onChange} />
          )} />
        </F>

        <F id="gender" label="Gender *">
          <Controller control={control} name="gender" render={({ field }) => (
            <SelectRoot value={String(field.value ?? '')} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger id="gender" className="w-full"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Male</SelectItem>
                <SelectItem value="2">Female</SelectItem>
              </SelectContent>
            </SelectRoot>
          )} />
        </F>

        <F id="email" label="Email *" error={errors.email?.message}>
          <Input id="email" {...register('email')} type="email" />
        </F>
        <F id="phone" label="Phone">
          <Input id="phone" {...register('phone')} type="tel" />
        </F>

        <F id="employeeid" label="Employee ID">
          <Input id="employeeid" {...register('employeeid')} />
        </F>

        <F id="hiredate" label="Hire Date *" error={errors.hiredate?.message}>
          <Controller control={control} name="hiredate" render={({ field }) => (
            <DatePicker id="hiredate" value={field.value} onChange={field.onChange} />
          )} />
        </F>

        <F id="qualification" label="Qualification *" error={errors.qualification?.message}>
          <Input id="qualification" {...register('qualification')} placeholder="e.g. M.Ed" />
        </F>
        <F id="specialization" label="Specialization *" error={errors.specialization?.message}>
          <Input id="specialization" {...register('specialization')} placeholder="e.g. Mathematics" />
        </F>

        <div className="col-span-2">
          <F id="address" label="Address">
            <Input id="address" {...register('address')} />
          </F>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Teacher'}</Button>
      </div>
    </form>
  );
}

export default function TeachersPage() {
  const [teachers, setTeachers]   = useState<Teacher[]>([]);
  const [filtered, setFiltered]   = useState<Teacher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Teacher | null>(null);
  const [toDelete, setToDelete]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await teachersAPI.getAll();
      const items = res.data ?? [];
      setTeachers(items);
      setFiltered(items);
    } catch {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? teachers.filter((t) =>
            `${t.firstname} ${t.lastname} ${t.specialization} ${t.email} ${t.employeeid}`
              .toLowerCase()
              .includes(q)
          )
        : teachers
    );
  }, [search, teachers]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      if (editing) {
        await teachersAPI.update(editing.teacherid, data);
        toast.success('Teacher updated');
      } else {
        await teachersAPI.create(data);
        toast.success('Teacher added');
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch {
      toast.error('Failed to save teacher');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await teachersAPI.delete(id);
      toast.success('Teacher deleted');
      load();
    } catch {
      toast.error('Failed to delete teacher');
    }
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Teachers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${teachers.length} teacher${teachers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Teacher
        </Button>
      </div>

      <AISummary type="teachers" getData={() => ({ total: teachers.length, teachers })} />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name, specialization…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600">
          <GraduationCap className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">
            {search ? `No teachers match "${search}"` : 'No teachers found'}
          </p>
          {!search && <p className="text-xs mt-1">Add a teacher to get started</p>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                {['Teacher', 'Specialization', 'Class', 'Hired', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((t) => {
                const fullName = `${t.firstname} ${t.lastname}`;
                const status = STATUS[t.statuscode] ?? { label: 'Unknown', variant: 'default' as const };
                return (
                  <tr key={t.teacherid} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Teacher */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(fullName)}`}>
                          {t.firstname?.[0]}{t.lastname?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{fullName}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {t.email && (
                              <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                <Mail className="h-3 w-3" />{t.email}
                              </span>
                            )}
                            {t.phone && (
                              <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                <Phone className="h-3 w-3" />{t.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Specialization + Qualification */}
                    <td className="px-4 py-3">
                      <p className="text-slate-700 dark:text-slate-300">{t.specialization || '—'}</p>
                      {t.qualification && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t.qualification}</p>
                      )}
                    </td>
                    {/* Assigned class */}
                    <td className="px-4 py-3">
                      {t.classname ? (
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400" />{t.classname}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                    {/* Hire date */}
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {t.hiredate || '—'}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setToDelete(t.teacherid)}>
                          <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
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

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? `Edit — ${editing.firstname} ${editing.lastname}` : 'Add Teacher'}
      >
        <TeacherForm
          defaultValues={editing ? {
            firstname:      editing.firstname,
            lastname:       editing.lastname,
            email:          editing.email,
            phone:          editing.phone,
            qualification:  editing.qualification,
            specialization: editing.specialization,
            employeeid:     editing.employeeid,
            hiredate:       editing.hiredate,
            dateofbirth:    editing.dateofbirth,
            gender:         editing.gender,
            address:        editing.address,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete teacher?"
        description="This will permanently remove the teacher record from Dataverse."
        onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
      />
    </div>
  );
}
