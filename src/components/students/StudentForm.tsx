'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const schema = z.object({
  firstname:      z.string().min(2, 'Required'),
  lastname:       z.string().min(2, 'Required'),
  dateofbirth:    z.string().min(1, 'Required'),
  gender:         z.coerce.number().min(1),
  email:          z.string().email('Invalid email').optional().or(z.literal('')),
  phone:          z.string().optional(),
  address:        z.string().optional(),
  enrollmentdate: z.string().min(1, 'Required'),
  rollnumber:     z.string().optional(),
  classid:        z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormData>;
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

export function StudentForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { gender: 1, ...defaultValues },
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
        </div>
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
