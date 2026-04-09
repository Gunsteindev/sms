'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, BookOpen, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { classesAPI } from '@/lib/api-client';
import type { Class } from '@/lib/dataverse/classes';

const schema = z.object({
  classname:      z.string().min(1, 'Required'),
  gradelevel:     z.coerce.number().min(1).max(12),
  academicyear:   z.string().min(4, 'Required'),
  classteacherid: z.string().min(1, 'Required'),
  capacity:       z.coerce.number().min(1),
  roomnumber:     z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

function ClassForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {([
          ['classname',      'Class Name *',     {}],
          ['gradelevel',     'Grade Level *',    { type: 'number', min: 1, max: 12 }],
          ['academicyear',   'Academic Year *',  { placeholder: '2024' }],
          ['classteacherid', 'Teacher ID *',     {}],
          ['capacity',       'Capacity *',       { type: 'number', min: 1 }],
          ['roomnumber',     'Room Number *',    {}],
        ] as const).map(([name, label, rest]) => (
          <div key={name}>
            <label className="text-xs font-medium text-gray-700 mb-1 block">{label}</label>
            <Input {...register(name)} {...rest} />
            {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message as string}</p>}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Class'}</Button>
      </div>
    </form>
  );
}

function utilColor(rate: number) {
  if (rate >= 90) return 'bg-red-100 text-red-600';
  if (rate >= 70) return 'bg-yellow-100 text-yellow-600';
  return 'bg-green-100 text-green-600';
}

export default function ClassesPage() {
  const [classes, setClasses]   = useState<Class[]>([]);
  const [filtered, setFiltered] = useState<Class[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<Class | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await classesAPI.getAll();
      setClasses(res.data ?? []); setFiltered(res.data ?? []);
    } catch { toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? classes.filter((c) => `${c.classname} ${c.academicyear}`.toLowerCase().includes(q)) : classes);
  }, [search, classes]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      if (editing) { await classesAPI.update(editing.classid, data); toast.success('Class updated'); }
      else          { await classesAPI.create(data);                  toast.success('Class added'); }
      setModalOpen(false); setEditing(null); load();
    } catch { toast.error('Failed to save class'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    try { await classesAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Class
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search classes…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <BookOpen className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No classes found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const utilRate = c.capacity > 0 ? (c.currentenrollment / c.capacity) * 100 : 0;
            return (
              <Card key={c.classid} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                      <BookOpen className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setModalOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.classid)}>
                        <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{c.classname}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Grade {c.gradelevel} · {c.academicyear}</p>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{c.currentenrollment} / {c.capacity}</span>
                    <span>Room {c.roomnumber}</span>
                  </div>

                  {/* Utilization bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Utilization</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${utilColor(utilRate)}`}>
                        {utilRate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${utilRate >= 90 ? 'bg-red-400' : utilRate >= 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                        style={{ width: `${Math.min(utilRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Class' : 'Add Class'}>
        <ClassForm defaultValues={editing ?? undefined} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
