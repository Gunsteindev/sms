'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Layers, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useSchoolSettings, type ProgrammeTrack } from '@/contexts/SchoolSettingsContext';

const COLORS = [
  { value: 'blue',    label: 'Blue',    bg: 'bg-blue-100    text-blue-700    dark:bg-blue-900/30    dark:text-blue-300'    },
  { value: 'emerald', label: 'Green',   bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'amber',   label: 'Amber',   bg: 'bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-300'   },
  { value: 'orange',  label: 'Orange',  bg: 'bg-orange-100  text-orange-700  dark:bg-orange-900/30  dark:text-orange-300'  },
  { value: 'purple',  label: 'Purple',  bg: 'bg-purple-100  text-purple-700  dark:bg-purple-900/30  dark:text-purple-300'  },
  { value: 'green',   label: 'Lime',    bg: 'bg-green-100   text-green-700   dark:bg-green-900/30   dark:text-green-300'   },
  { value: 'rose',    label: 'Rose',    bg: 'bg-rose-100    text-rose-700    dark:bg-rose-900/30    dark:text-rose-300'    },
  { value: 'indigo',  label: 'Indigo',  bg: 'bg-indigo-100  text-indigo-700  dark:bg-indigo-900/30  dark:text-indigo-300'  },
  { value: 'cyan',    label: 'Cyan',    bg: 'bg-cyan-100    text-cyan-700    dark:bg-cyan-900/30    dark:text-cyan-300'    },
  { value: 'slate',   label: 'Slate',   bg: 'bg-slate-100   text-slate-700   dark:bg-slate-800      dark:text-slate-300'   },
];

const colorBg = (color: string) =>
  COLORS.find(c => c.value === color)?.bg ??
  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

const DEFAULT_TRACKS: ProgrammeTrack[] = [
  { id: 'general-arts',    name: 'General Arts',    abbreviation: 'Arts',      description: 'Literature, History, Geography, Government, Economics',   color: 'blue'    },
  { id: 'general-science', name: 'General Science', abbreviation: 'Science',   description: 'Physics, Chemistry, Biology, Elective Mathematics',        color: 'emerald' },
  { id: 'business',        name: 'Business',        abbreviation: 'Business',  description: 'Accounting, Business Management, Economics',               color: 'amber'   },
  { id: 'technical',       name: 'Technical',       abbreviation: 'Technical', description: 'Technical Drawing, Workshop Technology, Auto Mechanics',   color: 'orange'  },
  { id: 'visual-arts',     name: 'Visual Arts',     abbreviation: 'Visual',    description: 'Graphic Design, Picture Making, Ceramics, Textiles',       color: 'purple'  },
  { id: 'agriculture',     name: 'Agriculture',     abbreviation: 'Agric',     description: 'Crop Production, Animal Husbandry, Agribusiness',          color: 'green'   },
  { id: 'home-economics',  name: 'Home Economics',  abbreviation: 'Home Eco',  description: 'Food & Nutrition, Textiles, Management in Living',         color: 'rose'    },
];

const schema = z.object({
  name:         z.string().min(1, 'Required'),
  abbreviation: z.string().min(1, 'Required').max(12, 'Max 12 chars'),
  description:  z.string().optional(),
  color:        z.string().default('blue'),
});
type FormData = z.infer<typeof schema>;

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function TrackForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { color: 'blue', ...defaultValues },
  });

  const selectedColor = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <F id="name" label="Track Name *" error={errors.name?.message}>
            <Input id="name" {...register('name')} placeholder="e.g. General Science" />
          </F>
        </div>
        <F id="abbreviation" label="Abbreviation *" error={errors.abbreviation?.message}>
          <Input id="abbreviation" {...register('abbreviation')} placeholder="e.g. Science" maxLength={12} />
        </F>
        <div />
      </div>

      <F id="description" label="Subjects / Description">
        <Input id="description" {...register('description')} placeholder="e.g. Physics, Chemistry, Biology, Elective Maths" />
      </F>

      <div className="space-y-2">
        <Label>Colour</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setValue('color', c.value)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-all ${c.bg} ${selectedColor === c.value ? 'ring-2 ring-offset-1 ring-current' : 'opacity-70 hover:opacity-100'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Track</Button>
      </div>
    </form>
  );
}

export default function ProgrammeTracksPage() {
  const { programmeTracks, setProgrammeTracks } = useSchoolSettings();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<ProgrammeTrack | null>(null);
  const [toDelete, setToDelete]     = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSubmit = (data: FormData) => {
    if (editing) {
      setProgrammeTracks(programmeTracks.map(t =>
        t.id === editing.id ? { ...t, ...data } : t
      ));
      toast.success('Track updated');
    } else {
      const newTrack: ProgrammeTrack = {
        id:           `track-${Date.now()}`,
        name:         data.name,
        abbreviation: data.abbreviation,
        description:  data.description ?? '',
        color:        data.color,
      };
      setProgrammeTracks([...programmeTracks, newTrack]);
      toast.success('Track added');
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setProgrammeTracks(programmeTracks.filter(t => t.id !== id));
    toast.success('Track removed');
    setToDelete(null);
  };

  const handleReset = () => {
    setProgrammeTracks(DEFAULT_TRACKS);
    toast.success('Tracks reset to GES defaults');
    setResetConfirm(false);
  };

  const openEdit = (t: ProgrammeTrack) => { setEditing(t); setModalOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Programme Tracks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {programmeTracks.length} track{programmeTracks.length !== 1 ? 's' : ''} · SHS programme categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setResetConfirm(true)}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Reset to GES Defaults
          </Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Track
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Ghana GES SHS Programme Tracks</p>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
          These are the academic tracks offered at Senior High School level. Each track groups related elective subjects.
          Students in the same class may belong to different tracks.
        </p>
      </div>

      {/* Tracks grid */}
      {programmeTracks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
            <Layers className="h-7 w-7 opacity-50" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No programme tracks defined</p>
          <p className="text-xs mt-1">Add a track or reset to GES defaults</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programmeTracks.map((track, index) => (
            <div
              key={track.id}
              className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              {/* Drag handle (decorative) */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-30 transition-opacity">
                <GripVertical className="h-4 w-4 text-slate-400" />
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold ${colorBg(track.color)}`}>
                  {track.abbreviation.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{track.name}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${colorBg(track.color)}`}>
                    {track.abbreviation}
                  </span>
                </div>
              </div>

              {track.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  {track.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-600">Track {index + 1}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(track)}
                    className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(track.id)}
                    className="h-7 w-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit — ${editing.name}` : 'Add Programme Track'}</DialogTitle>
          </DialogHeader>
          <TrackForm
            defaultValues={editing ? {
              name:         editing.name,
              abbreviation: editing.abbreviation,
              description:  editing.description,
              color:        editing.color,
            } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setModalOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={o => !o && setToDelete(null)}
        title="Remove track?"
        description="This will remove the programme track. Student assignments to this track will not be affected."
        onConfirm={() => { if (toDelete) handleDelete(toDelete); }}
      />

      {/* Reset confirm */}
      <ConfirmDialog
        open={resetConfirm}
        onOpenChange={o => !o && setResetConfirm(false)}
        title="Reset to GES defaults?"
        description="This will replace all current tracks with the 7 standard GES SHS programme tracks. Any custom tracks will be lost."
        onConfirm={handleReset}
      />
    </div>
  );
}
