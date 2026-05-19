'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { Camera, UserCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/Select';
import { parentsAPI, classesAPI } from '@/lib/api-client';

const schema = z.object({
  firstname:        z.string().min(2, 'Required'),
  lastname:         z.string().min(2, 'Required'),
  dateofbirth:      z.string().min(1, 'Required'),
  gender:           z.string().min(1, 'Required'),
  email:            z.string().email('Invalid email').optional().or(z.literal('')),
  phone:            z.string().optional(),
  address:          z.string().optional(),
  enrollmentdate:   z.string().min(1, 'Required'),
  rollnumber:       z.string().optional(),
  classid:          z.string().optional(),
  parentid:         z.string().optional(),
  studentstatus:    z.string().optional(),
  enrollmentstatus: z.string().optional(),
  profilepicture:   z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormData & { parentname: string }>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

function ProfilePictureUploader({ value, onChange }: { value: string; onChange: (b64: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 240;
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        const out = Math.min(side, MAX);
        const canvas = document.createElement('canvas');
        canvas.width = out; canvas.height = out;
        canvas.getContext('2d')!.drawImage(img, sx, sy, side, side, 0, 0, out, out);
        onChange(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }}
      />
      <div className="relative group">
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value} alt="Profile"
              className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
              onClick={() => inputRef.current?.click()}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-20 w-20 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <UserCircle2 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors"
          title="Upload photo"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500">Click to upload photo</p>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface ParentOption { parentid: string; fullname: string; phone: string; }

function ParentPicker({ value, initialName, onChange }: {
  value: string;
  initialName?: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<ParentOption[]>([]);
  const [selected, setSelected]   = useState<ParentOption | null>(
    value && initialName ? { parentid: value, fullname: initialName, phone: '' } : null
  );
  const [open, setOpen]           = useState(false);
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await parentsAPI.getAll(query) as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: ParentOption[] = (res.data ?? []).map((p: any) => ({
          parentid: p.parentid,
          fullname: p.fullname || `${p.firstname} ${p.lastname}`.trim(),
          phone:    p.phone ?? '',
        }));
        setResults(items);
        setOpen(items.length > 0);
      } catch { setResults([]); }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const handleSelect = (p: ParentOption) => {
    setSelected(p);
    onChange(p.parentid);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setQuery('');
  };

  if (selected) {
    return (
      <div className="flex items-center justify-between h-9 px-3 rounded-md border border-input bg-background text-sm">
        <span className="truncate">{selected.fullname}{selected.phone ? ` · ${selected.phone}` : ''}</span>
        <button type="button" onClick={handleClear} className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex-shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type to search parents…"
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-48 overflow-y-auto">
          {results.map(p => (
            <button
              key={p.parentid}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onMouseDown={() => handleSelect(p)}
            >
              <span className="font-medium">{p.fullname}</span>
              {p.phone && <span className="ml-2 text-slate-400 text-xs">{p.phone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SELECT_TRIGGER = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

export function StudentForm({ defaultValues, onSubmit, onCancel }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    classesAPI.getAll().then((r: any) => setClasses(r.data ?? [])).catch(() => {});
  }, []);

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { gender: 'Male', studentstatus: 'Active', enrollmentstatus: 'Enrolled', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

      {/* ── Profile Picture ── */}
      <Controller control={control} name="profilepicture" render={({ field }) => (
        <ProfilePictureUploader value={field.value ?? ''} onChange={field.onChange} />
      )} />

      {/* ── Personal Info ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Personal Info</p>
        <div className="grid grid-cols-2 gap-4">
          <Field id="firstname" label="First Name *" error={errors.firstname?.message}>
            <Input id="firstname" {...register('firstname')} placeholder="John" />
          </Field>
          <Field id="lastname" label="Last Name *" error={errors.lastname?.message}>
            <Input id="lastname" {...register('lastname')} placeholder="Doe" />
          </Field>
          <Field id="dateofbirth" label="Date of Birth *" error={errors.dateofbirth?.message}>
            <Controller control={control} name="dateofbirth" render={({ field }) => (
              <DatePicker id="dateofbirth" value={field.value} onChange={field.onChange} placeholder="Select date" />
            )} />
          </Field>
          <Field id="gender" label="Gender *" error={errors.gender?.message}>
            <Controller control={control} name="gender" render={({ field }) => (
              <SelectRoot value={field.value ?? ''} onValueChange={v => field.onChange(v)}>
                <SelectTrigger id="gender" className={SELECT_TRIGGER}>
                  <SelectValue>{field.value || 'Select gender'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </SelectRoot>
            )} />
          </Field>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      {/* ── Contact ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Contact</p>
        <div className="grid grid-cols-2 gap-4">
          <Field id="email" label="Email" error={errors.email?.message}>
            <Input id="email" {...register('email')} type="email" placeholder="student@school.edu" />
          </Field>
          <Field id="phone" label="Phone" error={errors.phone?.message}>
            <Input id="phone" {...register('phone')} type="tel" placeholder="+233 55 000 0000" />
          </Field>
          <div className="col-span-2">
            <Field id="address" label="Address" error={errors.address?.message}>
              <Input id="address" {...register('address')} placeholder="Street address" />
            </Field>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      {/* ── School Assignment ── */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">School Assignment</p>
        <div className="grid grid-cols-2 gap-4">
          <Field id="enrollmentdate" label="Enrollment Date *" error={errors.enrollmentdate?.message}>
            <Controller control={control} name="enrollmentdate" render={({ field }) => (
              <DatePicker id="enrollmentdate" value={field.value} onChange={field.onChange} placeholder="Select date" />
            )} />
          </Field>
          <Field id="rollnumber" label="Roll Number" error={errors.rollnumber?.message}>
            <Input id="rollnumber" {...register('rollnumber')} placeholder="e.g. 2024-001" />
          </Field>
          <Field id="studentstatus" label="Student Status" error={errors.studentstatus?.message}>
            <Controller control={control} name="studentstatus" render={({ field }) => (
              <SelectRoot value={field.value ?? 'Active'} onValueChange={v => field.onChange(v)}>
                <SelectTrigger id="studentstatus" className={SELECT_TRIGGER}>
                  <SelectValue>{field.value || 'Select status'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Graduated">Graduated</SelectItem>
                  <SelectItem value="Transferred">Transferred</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </SelectRoot>
            )} />
          </Field>
          <Field id="enrollmentstatus" label="Enrollment Status" error={errors.enrollmentstatus?.message}>
            <Controller control={control} name="enrollmentstatus" render={({ field }) => (
              <SelectRoot value={field.value ?? 'Enrolled'} onValueChange={v => field.onChange(v)}>
                <SelectTrigger id="enrollmentstatus" className={SELECT_TRIGGER}>
                  <SelectValue>{field.value || 'Select status'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enrolled">Enrolled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Dropped">Dropped</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </SelectRoot>
            )} />
          </Field>
          <div className="col-span-2">
            <Field id="classid" label="Class" error={errors.classid?.message}>
              <Controller control={control} name="classid" render={({ field }) => (
                <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger id="classid" className={SELECT_TRIGGER}>
                    <SelectValue>
                      {field.value
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ? (classes.find((c: any) => c.classid === field.value)?.classname ?? '— None —')
                        : '— None —'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— None —</SelectItem>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {classes.map((c: any) => (
                      <SelectItem key={c.classid} value={c.classid}>{c.classname}</SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              )} />
            </Field>
          </div>
        </div>
      </div>

      {/* ── Parent / Guardian ── */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Parent / Guardian</p>
        <Field id="parentid" label="Parent" error={errors.parentid?.message}>
          <Controller control={control} name="parentid" render={({ field }) => (
            <ParentPicker
              value={field.value ?? ''}
              initialName={defaultValues?.parentname}
              onChange={field.onChange}
            />
          )} />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Student'}</Button>
      </div>
    </form>
  );
}
