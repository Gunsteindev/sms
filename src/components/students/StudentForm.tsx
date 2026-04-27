'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
import { parentsAPI } from '@/lib/api-client';

const schema = z.object({
  firstname:        z.string().min(2, 'Required'),
  lastname:         z.string().min(2, 'Required'),
  dateofbirth:      z.string().min(1, 'Required'),
  gender:           z.coerce.number().min(1),
  email:            z.string().email('Invalid email').optional().or(z.literal('')),
  phone:            z.string().optional(),
  address:          z.string().optional(),
  enrollmentdate:   z.string().min(1, 'Required'),
  rollnumber:       z.string().optional(),
  classid:          z.string().optional(),
  parentid:         z.string().optional(),
  studentstatus:    z.coerce.number().optional(),
  enrollmentstatus: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormData & { parentname: string }>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
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

export function StudentForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { gender: 1, studentstatus: 1, enrollmentstatus: 1, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">

      {/* ── Personal ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Info</p>
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
              <SelectRoot value={String(field.value ?? '')} onValueChange={v => field.onChange(Number(v))}>
                <SelectTrigger id="gender" className="w-full"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Male</SelectItem>
                  <SelectItem value="2">Female</SelectItem>
                </SelectContent>
              </SelectRoot>
            )} />
          </Field>
        </div>
      </section>

      {/* ── School ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">School Info</p>
        <div className="grid grid-cols-2 gap-4">
          <Field id="enrollmentdate" label="Enrollment Date *" error={errors.enrollmentdate?.message}>
            <Controller control={control} name="enrollmentdate" render={({ field }) => (
              <DatePicker id="enrollmentdate" value={field.value} onChange={field.onChange} placeholder="Select date" />
            )} />
          </Field>
          <Field id="rollnumber" label="Roll Number" error={errors.rollnumber?.message}>
            <Input id="rollnumber" {...register('rollnumber')} placeholder="e.g. 2024-001" />
          </Field>
          <Field id="classid" label="Class ID (GUID)" error={errors.classid?.message}>
            <Input id="classid" {...register('classid')} placeholder="Class record GUID" />
          </Field>
          <Field id="studentstatus" label="Student Status" error={errors.studentstatus?.message}>
            <Controller control={control} name="studentstatus" render={({ field }) => (
              <SelectRoot value={String(field.value ?? '1')} onValueChange={v => field.onChange(Number(v))}>
                <SelectTrigger id="studentstatus" className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="2">Graduated</SelectItem>
                  <SelectItem value="3">Transferred</SelectItem>
                  <SelectItem value="4">Suspended</SelectItem>
                </SelectContent>
              </SelectRoot>
            )} />
          </Field>
          <Field id="enrollmentstatus" label="Enrollment Status" error={errors.enrollmentstatus?.message}>
            <Controller control={control} name="enrollmentstatus" render={({ field }) => (
              <SelectRoot value={String(field.value ?? '1')} onValueChange={v => field.onChange(Number(v))}>
                <SelectTrigger id="enrollmentstatus" className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Enrolled</SelectItem>
                  <SelectItem value="2">Completed</SelectItem>
                  <SelectItem value="3">Dropped</SelectItem>
                  <SelectItem value="4">On Hold</SelectItem>
                </SelectContent>
              </SelectRoot>
            )} />
          </Field>
        </div>
      </section>

      {/* ── Parent / Guardian ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parent / Guardian</p>
        <Field id="parentid" label="Parent" error={errors.parentid?.message}>
          <Controller control={control} name="parentid" render={({ field }) => (
            <ParentPicker
              value={field.value ?? ''}
              initialName={defaultValues?.parentname}
              onChange={field.onChange}
            />
          )} />
        </Field>
      </section>

      {/* ── Contact ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</p>
        <div className="grid grid-cols-2 gap-4">
          <Field id="email" label="Email" error={errors.email?.message}>
            <Input id="email" {...register('email')} type="email" placeholder="student@school.edu" />
          </Field>
          <Field id="phone" label="Phone" error={errors.phone?.message}>
            <Input id="phone" {...register('phone')} type="tel" placeholder="+1 555 0000" />
          </Field>
          <Field id="address" label="Address" error={errors.address?.message}>
            <Input id="address" {...register('address')} placeholder="Street address" />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Student'}</Button>
      </div>
    </form>
  );
}
