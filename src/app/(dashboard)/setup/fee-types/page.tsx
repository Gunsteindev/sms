'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, DollarSign, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { feeTypesAPI } from '@/lib/api-client';

type FeeTypeCategory = 'academic' | 'residential' | 'extracurricular' | 'administrative';

interface FeeTypeRecord {
  feetypeid:   string;
  name:        string;
  description: string;
  category:    FeeTypeCategory;
  mandatory:   boolean;
  color:       string;
}

const COLORS = [
  { value: 'blue',    bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'             },
  { value: 'emerald', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'amber',   bg: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'         },
  { value: 'orange',  bg: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'     },
  { value: 'violet',  bg: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'     },
  { value: 'cyan',    bg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'             },
  { value: 'indigo',  bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'     },
  { value: 'rose',    bg: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'             },
  { value: 'red',     bg: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'                 },
  { value: 'slate',   bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'           },
];

const colorBg = (c: string) => COLORS.find(x => x.value === c)?.bg ?? COLORS[9].bg;

const CATEGORIES: { value: FeeTypeCategory; label: string }[] = [
  { value: 'academic',        label: 'Academic'        },
  { value: 'residential',     label: 'Residential'     },
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'administrative',  label: 'Administrative'  },
];

const SEED_DATA: Omit<FeeTypeRecord, 'feetypeid'>[] = [
  { name: 'Tuition Fee',        description: 'Core academic instruction fee',                category: 'academic',        mandatory: true,  color: 'blue'    },
  { name: 'Boarding Fee',       description: 'Accommodation and meals',                      category: 'residential',     mandatory: false, color: 'emerald' },
  { name: 'PTA Levy',           description: 'Parent-Teacher Association contribution',      category: 'administrative',  mandatory: true,  color: 'amber'   },
  { name: 'Sports & Games',     description: 'Physical education and sports equipment',      category: 'extracurricular', mandatory: true,  color: 'orange'  },
  { name: 'Examination Fee',    description: 'Internal examination administration',          category: 'academic',        mandatory: true,  color: 'violet'  },
  { name: 'Library Fee',        description: 'Library resources and maintenance',            category: 'academic',        mandatory: true,  color: 'cyan'    },
  { name: 'ICT / Computer Lab', description: 'Computer lab access and technology',           category: 'academic',        mandatory: true,  color: 'indigo'  },
  { name: 'BECE Registration',  description: 'WAEC BECE fee (JHS 3 students)',               category: 'academic',        mandatory: false, color: 'rose'    },
  { name: 'WASSCE Registration',description: 'WAEC WASSCE fee (SHS 3 students)',             category: 'academic',        mandatory: false, color: 'red'     },
];

const schema = z.object({
  name:        z.string().min(1, 'Required'),
  description: z.string().optional(),
  category:    z.enum(['academic', 'residential', 'extracurricular', 'administrative']),
  mandatory:   z.boolean().default(true),
  color:       z.string().default('blue'),
});
type FormData = z.infer<typeof schema>;

function FeeTypeForm({ defaultValues, onSubmit, onCancel, saving }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { color: 'blue', category: 'academic', mandatory: true, ...defaultValues },
  });
  const selectedColor    = watch('color');
  const selectedCategory = watch('category');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Fee Type Name *</Label>
        <Input id="name" {...register('name')} placeholder="e.g. Examination Fee" />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} placeholder="Brief description…" />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(c => (
            <button key={c.value} type="button" onClick={() => setValue('category', c.value)}
              className={`rounded-lg border-2 py-2 text-xs font-medium transition-all ${selectedCategory === c.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" {...register('mandatory')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
        <span className="text-sm text-slate-700 dark:text-slate-300">Mandatory for all students</span>
      </label>
      <div className="space-y-2">
        <Label>Colour</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c.value} type="button" onClick={() => setValue('color', c.value)}
              className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${c.bg} ${selectedColor === c.value ? 'ring-2 ring-offset-1 ring-current' : 'opacity-70 hover:opacity-100'}`}>
              {c.value}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Fee Type'}</Button>
      </div>
    </form>
  );
}

export default function FeeTypesPage() {
  const [feeTypes, setFeeTypes]     = useState<FeeTypeRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<FeeTypeRecord | null>(null);
  const [toDelete, setToDelete]     = useState<string | null>(null);
  const [seedConfirm, setSeedConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await feeTypesAPI.getAll() as any;
      setFeeTypes(res.data ?? []);
    } catch {
      toast.error('Failed to load fee types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await feeTypesAPI.update(editing.feetypeid, data) as any;
        setFeeTypes(prev => prev.map(f => f.feetypeid === editing.feetypeid ? res.data : f));
        toast.success('Updated');
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await feeTypesAPI.create(data) as any;
        setFeeTypes(prev => [...prev, res.data]);
        toast.success('Fee type added');
      }
      setModalOpen(false); setEditing(null);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await feeTypesAPI.delete(id);
      setFeeTypes(prev => prev.filter(f => f.feetypeid !== id));
      toast.success('Removed');
    } catch {
      toast.error('Delete failed');
    } finally {
      setToDelete(null);
    }
  };

  const handleSeed = async () => {
    setSeedConfirm(false);
    setSaving(true);
    let created = 0;
    for (const item of SEED_DATA) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await feeTypesAPI.create(item) as any;
        setFeeTypes(prev => [...prev, res.data]);
        created++;
      } catch { /* skip duplicates */ }
    }
    setSaving(false);
    toast.success(`${created} default fee types added`);
  };

  const openEdit = (f: FeeTypeRecord) => { setEditing(f); setModalOpen(true); };

  const byCategory = (cat: FeeTypeCategory) => feeTypes.filter(f => f.category === cat);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fee Types</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${feeTypes.length} type${feeTypes.length !== 1 ? 's' : ''} · ${feeTypes.filter(f => f.mandatory).length} mandatory`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSeedConfirm(true)} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Seed Defaults
          </Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Fee Type
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {CATEGORIES.map(cat => {
            const items = byCategory(cat.value);
            if (!items.length) return null;
            return (
              <div key={cat.value}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">{cat.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(f => (
                    <div key={f.feetypeid} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${colorBg(f.color)}`}>
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">{f.name}</p>
                            {f.mandatory && (
                              <span className="flex-shrink-0 inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-medium">
                                <Check className="h-2.5 w-2.5 mr-0.5" />Must
                              </span>
                            )}
                          </div>
                          {f.description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{f.description}</p>}
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(f)} className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setToDelete(f.feetypeid)} className="h-7 w-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {feeTypes.length === 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                <DollarSign className="h-7 w-7 opacity-50 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No fee types defined</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Add one manually or seed the 9 default types</p>
              <Button size="sm" onClick={() => setSeedConfirm(true)}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Seed Defaults
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit — ${editing.name}` : 'Add Fee Type'}</DialogTitle>
          </DialogHeader>
          <FeeTypeForm
            defaultValues={editing ? { name: editing.name, description: editing.description, category: editing.category, mandatory: editing.mandatory, color: editing.color } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setModalOpen(false); setEditing(null); }}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={o => !o && setToDelete(null)}
        title="Remove fee type?"
        description="This removes the category definition only — existing fee records are not affected."
        onConfirm={() => { if (toDelete) handleDelete(toDelete); }}
      />
      <ConfirmDialog
        open={seedConfirm}
        onOpenChange={o => !o && setSeedConfirm(false)}
        title="Seed default fee types?"
        description="This will add the 9 standard Ghanaian school fee categories to Dataverse. Existing records are not affected."
        onConfirm={handleSeed}
      />
    </div>
  );
}
