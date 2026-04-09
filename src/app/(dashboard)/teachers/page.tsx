'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, GraduationCap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { teachersAPI } from '@/lib/api-client';
import type { Teacher } from '@/lib/dataverse/teachers';

const schema = z.object({
  firstname:      z.string().min(2, 'Required'),
  lastname:       z.string().min(2, 'Required'),
  emailaddress1:  z.string().email('Invalid email'),
  telephone1:     z.string().optional(),
  qualification:  z.string().min(1, 'Required'),
  specialization: z.string().min(1, 'Required'),
  employeecode:   z.string().min(1, 'Required'),
  department:     z.string().optional(),
  hiredate:       z.string().min(1, 'Required'),
  dateofbirth:    z.string().min(1, 'Required'),
  gender:         z.coerce.number().min(1),
  address1_line1: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STATUS: Record<number, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  1: { label: 'Active',    variant: 'success' },
  2: { label: 'On Leave',  variant: 'warning' },
  3: { label: 'Resigned',  variant: 'error' },
};

function TeacherForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 1, ...defaultValues },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        {[['firstname','First Name *'], ['lastname','Last Name *']].map(([name, label]) => (
          <div key={name}>
            <label className="text-xs font-medium text-gray-700 mb-1 block">{label}</label>
            <Input {...register(name as keyof FormData)} />
            {errors[name as keyof FormData] && <p className="text-xs text-red-500 mt-1">{errors[name as keyof FormData]?.message as string}</p>}
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Date of Birth *</label>
          <Input {...register('dateofbirth')} type="date" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Gender *</label>
          <Select {...register('gender')}><option value={1}>Male</option><option value={2}>Female</option></Select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Email *</label>
          <Input {...register('emailaddress1')} type="email" />
          {errors.emailaddress1 && <p className="text-xs text-red-500 mt-1">{errors.emailaddress1.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Phone</label>
          <Input {...register('telephone1')} type="tel" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Employee Code *</label>
          <Input {...register('employeecode')} />
          {errors.employeecode && <p className="text-xs text-red-500 mt-1">{errors.employeecode.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Hire Date *</label>
          <Input {...register('hiredate')} type="date" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Qualification *</label>
          <Input {...register('qualification')} placeholder="e.g. M.Ed" />
          {errors.qualification && <p className="text-xs text-red-500 mt-1">{errors.qualification.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Specialization *</label>
          <Input {...register('specialization')} placeholder="e.g. Mathematics" />
          {errors.specialization && <p className="text-xs text-red-500 mt-1">{errors.specialization.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Department</label>
          <Input {...register('department')} placeholder="e.g. Science" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Teacher'}</Button>
      </div>
    </form>
  );
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filtered, setFiltered]   = useState<Teacher[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<Teacher | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await teachersAPI.getAll();
      setTeachers(res.data ?? []);
      setFiltered(res.data ?? []);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? teachers.filter((t) => `${t.firstname} ${t.lastname} ${t.specialization}`.toLowerCase().includes(q)) : teachers);
  }, [search, teachers]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      if (editing) { await teachersAPI.update(editing.teacherid, data); toast.success('Teacher updated'); }
      else          { await teachersAPI.create(data);                   toast.success('Teacher added'); }
      setModalOpen(false); setEditing(null); load();
    } catch { toast.error('Failed to save teacher'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this teacher?')) return;
    try { await teachersAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Teacher
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search teachers…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <GraduationCap className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No teachers found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Teacher','Employee Code','Qualification','Specialization','Department','Status',''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((t) => {
                const status = STATUS[t.statuscode] ?? { label: 'Unknown', variant: 'default' as const };
                return (
                  <tr key={t.teacherid} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                          {t.firstname[0]}{t.lastname[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{t.firstname} {t.lastname}</p>
                          <p className="text-xs text-gray-400">{t.emailaddress1}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.employeecode}</td>
                    <td className="px-4 py-3 text-gray-500">{t.qualification}</td>
                    <td className="px-4 py-3 text-gray-500">{t.specialization}</td>
                    <td className="px-4 py-3 text-gray-500">{t.department || '—'}</td>
                    <td className="px-4 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setModalOpen(true); }}>
                          <Pencil className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.teacherid)}>
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

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <TeacherForm defaultValues={editing ?? undefined} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
