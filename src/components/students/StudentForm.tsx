'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const schema = z.object({
  firstname:               z.string().min(2, 'Required'),
  lastname:                z.string().min(2, 'Required'),
  dateofbirth:             z.string().min(1, 'Required'),
  gender:                  z.coerce.number().min(1),
  emailaddress1:           z.string().email('Invalid email'),
  telephone1:              z.string().optional(),
  address1_line1:          z.string().optional(),
  address1_city:           z.string().optional(),
  address1_stateorprovince:z.string().optional(),
  address1_postalcode:     z.string().optional(),
  enrollmentdate:          z.string().min(1, 'Required'),
  rollnumber:              z.string().optional(),
  classname:               z.string().optional(),
  parentname:              z.string().min(2, 'Required'),
  parentphone:             z.string().min(1, 'Required'),
  parentemail:             z.string().email('Invalid email').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function StudentForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 1, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* Personal */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Personal Info</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name *" error={errors.firstname?.message}>
            <Input {...register('firstname')} placeholder="John" />
          </Field>
          <Field label="Last Name *" error={errors.lastname?.message}>
            <Input {...register('lastname')} placeholder="Doe" />
          </Field>
          <Field label="Date of Birth *" error={errors.dateofbirth?.message}>
            <Input {...register('dateofbirth')} type="date" />
          </Field>
          <Field label="Gender *" error={errors.gender?.message}>
            <Select {...register('gender')}>
              <option value={1}>Male</option>
              <option value={2}>Female</option>
            </Select>
          </Field>
        </div>
      </section>

      {/* School */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">School Info</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Enrollment Date *" error={errors.enrollmentdate?.message}>
            <Input {...register('enrollmentdate')} type="date" />
          </Field>
          <Field label="Roll Number" error={errors.rollnumber?.message}>
            <Input {...register('rollnumber')} placeholder="e.g. 2024-001" />
          </Field>
          <Field label="Class" error={errors.classname?.message}>
            <Input {...register('classname')} placeholder="e.g. Grade 10-A" />
          </Field>
        </div>
      </section>

      {/* Contact */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contact</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email *" error={errors.emailaddress1?.message}>
            <Input {...register('emailaddress1')} type="email" placeholder="student@school.edu" />
          </Field>
          <Field label="Phone" error={errors.telephone1?.message}>
            <Input {...register('telephone1')} type="tel" placeholder="+1 555 0000" />
          </Field>
          <Field label="Address" error={errors.address1_line1?.message}>
            <Input {...register('address1_line1')} placeholder="Street address" />
          </Field>
          <Field label="City" error={errors.address1_city?.message}>
            <Input {...register('address1_city')} placeholder="City" />
          </Field>
        </div>
      </section>

      {/* Guardian */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Guardian / Parent</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Guardian Name *" error={errors.parentname?.message}>
            <Input {...register('parentname')} placeholder="Jane Doe" />
          </Field>
          <Field label="Guardian Phone *" error={errors.parentphone?.message}>
            <Input {...register('parentphone')} type="tel" placeholder="+1 555 0001" />
          </Field>
          <Field label="Guardian Email" error={errors.parentemail?.message}>
            <Input {...register('parentemail')} type="email" placeholder="parent@email.com" />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Student'}
        </Button>
      </div>
    </form>
  );
}
