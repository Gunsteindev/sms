'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { housesAPI } from '@/lib/api-client';
import type { House, HouseType, CreateHouseRequest } from '@/lib/dataverse/houses';

const COLORS = [
  { value: 'blue',    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'       },
  { value: 'emerald', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'amber',   bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'   },
  { value: 'red',     bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'           },
  { value: 'purple',  bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'orange',  bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'green',   bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'   },
  { value: 'rose',    bg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'       },
  { value: 'indigo',  bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'cyan',    bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'       },
];

const colorBg = (c: string) => COLORS.find(x => x.value === c)?.bg ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

const DEFAULT_HOUSES: CreateHouseRequest[] = [
  { name: 'Aggrey House',     type: 1, color: 'blue',   description: 'Named after Rev. Dr. James Emman Kwegyir Aggrey' },
  { name: 'Busia House',      type: 1, color: 'green',  description: 'Named after Dr. Kofi Abrefa Busia'               },
  { name: 'Danquah House',    type: 1, color: 'amber',  description: 'Named after Dr. Joseph Boakye Danquah'           },
  { name: 'Nkrumah House',    type: 1, color: 'red',    description: 'Named after Dr. Kwame Nkrumah'                   },
  { name: 'Ofori-Atta House', type: 1, color: 'purple', description: 'Named after Okyenhene Ofori Atta I'              },
];

const DEFAULT_STREAMS: CreateHouseRequest[] = [
  { name: 'Stream A', type: 3, color: 'blue',    description: '' },
  { name: 'Stream B', type: 3, color: 'emerald', description: '' },
  { name: 'Stream C', type: 3, color: 'amber',   description: '' },
  { name: 'Stream D', type: 3, color: 'red',     description: '' },
];

const TYPE_OPTIONS: { value: HouseType; label: string }[] = [
  { value: 1, label: 'Boarding House' },
  { value: 2, label: 'Day House'      },
  { value: 3, label: 'Class Stream'   },
];

const TYPE_STYLE: Record<number, string> = {
  1: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  2: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  3: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
};

const schema = z.object({
  name:        z.string().min(1, 'Required'),
  type:        z.union([z.literal(1), z.literal(2), z.literal(3)]),
  description: z.string().optional(),
  color:       z.string().default('blue'),
});
type FormData = z.infer<typeof schema>;

function HouseForm({ defaultValues, onSubmit, onCancel, submitting }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { color: 'blue', type: 1, ...defaultValues },
  });
  const selectedColor = watch('color');
  const selectedType  = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">House / Stream Name *</Label>
        <Input id="name" {...register('name')} placeholder="e.g. Aggrey House" />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map(t => (
            <button key={t.value} type="button" onClick={() => setValue('type', t.value)}
              className={`rounded-lg border-2 py-2.5 text-xs font-medium transition-all ${selectedType === t.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} placeholder="e.g. Named after Dr. Kwame Nkrumah" />
      </div>
      <div className="space-y-2">
        <Label>House Colour</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c.value} type="button" onClick={() => setValue('color', c.value)}
              className={`h-7 w-7 rounded-full transition-all ${c.bg.split(' ')[0]} ${selectedColor === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export default function HousesPage() {
  const [houses, setHouses]         = useState<House[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<House | null>(null);
  const [toDelete, setToDelete]     = useState<string | null>(null);
  const [resetType, setResetType]   = useState<'houses' | 'streams' | null>(null);

  const loadHouses = async () => {
    setLoading(true);
    try {
      const res = await housesAPI.getAll();
      const data: House[] = res.data ?? [];
      setHouses(data);
      return data;
    } catch {
      toast.error('Failed to load houses');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHouses(); }, []);

  const handleSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (editing) {
        const res = await housesAPI.update(editing.houseid, data);
        setHouses(houses.map(h => h.houseid === editing.houseid ? res.data : h));
        toast.success('Updated');
      } else {
        const ordernumber = houses.length ? Math.max(...houses.map(h => h.ordernumber)) + 1 : 1;
        const res = await housesAPI.create({ ...data, ordernumber });
        setHouses([...houses, res.data]);
        toast.success('House added');
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      toast.error('Failed to save house');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await housesAPI.delete(id);
      setHouses(houses.filter(h => h.houseid !== id));
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    } finally {
      setToDelete(null);
    }
  };

  const handleReset = async (defaults: CreateHouseRequest[], successMsg: string) => {
    setResetting(true);
    try {
      const current = await loadHouses();
      await Promise.all(current.map(h => housesAPI.delete(h.houseid)));
      const created = await Promise.all(
        defaults.map((d, index) => housesAPI.create({ ...d, ordernumber: index + 1 }))
      );
      setHouses(created.map(res => res.data));
      toast.success(successMsg);
    } catch {
      toast.error('Failed to reset');
      await loadHouses();
    } finally {
      setResetting(false);
      setResetType(null);
    }
  };

  const openEdit = (h: House) => { setEditing(h); setModalOpen(true); };

  const boardingCount = houses.filter(h => h.type === 1).length;
  const dayCount      = houses.filter(h => h.type === 2).length;
  const streamCount   = houses.filter(h => h.type === 3).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Houses &amp; Streams</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {houses.length} total · {boardingCount} boarding{dayCount ? ` · ${dayCount} day` : ''}{streamCount ? ` · ${streamCount} stream${streamCount !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`relative group ${(loading || resetting) ? 'pointer-events-none opacity-50' : ''}`}>
            <Button variant="outline" size="sm" disabled={loading || resetting}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Reset Defaults
            </Button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 w-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
              <button onClick={() => setResetType('houses')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800">Boarding Houses</button>
              <button onClick={() => setResetType('streams')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Class Streams (A–D)</button>
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }} disabled={loading}>
            <Plus className="h-4 w-4 mr-1" /> Add House
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4">
        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Houses &amp; Streams</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          <strong>Boarding / Day Houses</strong> group students for welfare and competitions (e.g. Aggrey, Busia).
          <strong className="ml-1">Streams</strong> group students within the same class level (e.g. 3A, 3B).
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center py-24 text-slate-400">
          <p className="text-sm">Loading…</p>
        </div>
      ) : houses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
            <Home className="h-7 w-7 opacity-50 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No houses or streams defined</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Add one manually or reset to defaults</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((h, i) => (
            <div key={h.houseid} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${colorBg(h.color)}`}>
                  {h.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{h.name}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${TYPE_STYLE[h.type] ?? ''}`}>
                    {h.typelabel}
                  </span>
                </div>
              </div>
              {h.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{h.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-600">#{i + 1}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(h)} className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Pencil className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(h.houseid)} className="h-7 w-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? `Edit — ${editing.name}` : 'Add House / Stream'}</DialogTitle></DialogHeader>
          <HouseForm
            defaultValues={editing ? { name: editing.name, type: editing.type, description: editing.description, color: editing.color } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setModalOpen(false); setEditing(null); }}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)} title="Remove house?" description="This will remove the house or stream." onConfirm={() => { if (toDelete) handleDelete(toDelete); }} />
      <ConfirmDialog open={resetType === 'houses'} onOpenChange={o => !o && setResetType(null)} title="Reset to boarding houses?" description="Replace all current houses with the 5 default Ghanaian boarding houses (Aggrey, Busia, Danquah, Nkrumah, Ofori-Atta)." onConfirm={() => handleReset(DEFAULT_HOUSES, 'Reset to boarding houses')} />
      <ConfirmDialog open={resetType === 'streams'} onOpenChange={o => !o && setResetType(null)} title="Reset to class streams?" description="Replace all current houses with Streams A, B, C, D." onConfirm={() => handleReset(DEFAULT_STREAMS, 'Reset to class streams')} />
    </div>
  );
}
