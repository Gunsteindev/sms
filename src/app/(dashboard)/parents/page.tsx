'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw, Users, Phone, Mail, MapPin, Briefcase, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { parentsAPI } from '@/lib/api-client';
import { PARENT_RELATIONSHIPS } from '@/lib/dataverse/parents';
import type { Parent } from '@/lib/dataverse/parents';

const PAGE_SIZE = 10;

const RELATIONSHIP_OPTIONS = [
  { label: 'Father',   value: 1 },
  { label: 'Mother',   value: 2 },
  { label: 'Guardian', value: 3 },
];

const RELATIONSHIP_STYLE: Record<number, string> = {
  1: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  2: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  3: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(fullname: string) {
  const parts = fullname.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return fullname.slice(0, 2).toUpperCase();
}

const schema = z.object({
  firstname:    z.string().min(1, 'Required'),
  lastname:     z.string().min(1, 'Required'),
  relationship: z.string().optional(),
  email:        z.string().optional(),
  phone:        z.string().optional(),
  occupation:   z.string().optional(),
  address:      z.string().optional(),
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

const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

function ParentForm({ defaultValues, onSubmit, onCancel }: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <F id="firstname" label="First Name *" error={errors.firstname?.message}>
            <Input id="firstname" {...register('firstname')} placeholder="e.g. John" />
          </F>
          <F id="lastname" label="Last Name *" error={errors.lastname?.message}>
            <Input id="lastname" {...register('lastname')} placeholder="e.g. Doe" />
          </F>
        </div>
        <F id="relationship" label="Relationship">
          <Controller name="relationship" control={control} render={({ field }) => (
            <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className={ST}>
                <SelectValue>
                  {field.value
                    ? (RELATIONSHIP_OPTIONS.find(o => String(o.value) === field.value)?.label ?? '— None —')
                    : '— None —'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {RELATIONSHIP_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          )} />
        </F>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Details</p>
        <div className="grid grid-cols-2 gap-4">
          <F id="email" label="Email">
            <Input id="email" {...register('email')} type="email" placeholder="e.g. john.doe@email.com" />
          </F>
          <F id="phone" label="Phone">
            <Input id="phone" {...register('phone')} placeholder="e.g. +233 55 000 0000" />
          </F>
        </div>
        <F id="occupation" label="Occupation">
          <Input id="occupation" {...register('occupation')} placeholder="e.g. Engineer" />
        </F>
        <F id="address" label="Address">
          <Input id="address" {...register('address')} placeholder="e.g. 12 Main Street, Accra" />
        </F>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Parent'}</Button>
      </div>
    </form>
  );
}

export default function ParentsPage() {
  const [parents, setParents]     = useState<Parent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Parent | null>(null);
  const [toDelete, setToDelete]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await parentsAPI.getAll();
      setParents(res.data ?? []);
    } catch {
      toast.error('Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? parents.filter(p =>
          `${p.fullname} ${p.email} ${p.phone} ${p.occupation}`.toLowerCase().includes(q))
      : parents;
  }, [search, parents]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = async (data: FormData) => {
    try {
      const payload = {
        firstname:    data.firstname,
        lastname:     data.lastname,
        relationship: data.relationship ? Number(data.relationship) : undefined,
        email:        data.email      || undefined,
        phone:        data.phone      || undefined,
        occupation:   data.occupation || undefined,
        address:      data.address    || undefined,
      };
      if (editing) {
        await parentsAPI.update(editing.parentid, payload);
        toast.success('Parent updated');
      } else {
        await parentsAPI.create(payload);
        toast.success('Parent added');
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch {
      toast.error('Failed to save parent');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await parentsAPI.delete(id);
      toast.success('Parent deleted');
      load();
    } catch {
      toast.error('Failed to delete parent');
    }
  };

  const openEdit = (p: Parent) => { setEditing(p); setModalOpen(true); };

  const counts = { father: parents.filter(p => p.relationship === 1).length, mother: parents.filter(p => p.relationship === 2).length, guardian: parents.filter(p => p.relationship === 3).length };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Parents / Guardians</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${parents.length} contact${parents.length !== 1 ? 's' : ''} · ${counts.father} father${counts.father !== 1 ? 's' : ''} · ${counts.mother} mother${counts.mother !== 1 ? 's' : ''} · ${counts.guardian} guardian${counts.guardian !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <UserPlus className="h-4 w-4 mr-1" /> Add Parent
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search by name, email, phone…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-violet-600" />
        </div>
      ) : !filtered.length ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
            <Users className="h-7 w-7 opacity-50" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {search ? `No parents match "${search}"` : 'No parents found'}
          </p>
          {!search && <p className="text-xs mt-1">Add a parent to get started</p>}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {['Parent', 'Email', 'Relationship', 'Phone', 'Occupation', 'Address', ''].map(h => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(p => (
                <TableRow key={p.parentid} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(p.fullname || `${p.firstname}${p.lastname}`)}`}>
                        {initials(p.fullname || `${p.firstname} ${p.lastname}`)}
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{p.fullname || `${p.firstname} ${p.lastname}`.trim()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.email ? (
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{p.email}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.relationship && PARENT_RELATIONSHIPS[p.relationship]
                      ? <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${RELATIONSHIP_STYLE[p.relationship] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {PARENT_RELATIONSHIPS[p.relationship]}
                        </span>
                      : <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  <TableCell>
                    {p.phone
                      ? <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"><Phone className="h-3.5 w-3.5 text-slate-400" />{p.phone}</span>
                      : <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  <TableCell>
                    {p.occupation
                      ? <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"><Briefcase className="h-3.5 w-3.5 text-slate-400" />{p.occupation}</span>
                      : <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  <TableCell>
                    {p.address
                      ? <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 max-w-[200px]"><MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" /><span className="truncate">{p.address}</span></span>
                      : <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(p.parentid)} className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="parent" onChange={setPage} />
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit — ${editing.fullname || `${editing.firstname} ${editing.lastname}`.trim()}` : 'Add Parent'}</DialogTitle>
          </DialogHeader>
          <ParentForm
            defaultValues={editing ? {
              firstname:    editing.firstname    || '',
              lastname:     editing.lastname     || '',
              relationship: editing.relationship ? String(editing.relationship) : undefined,
              email:        editing.email        || undefined,
              phone:        editing.phone        || undefined,
              occupation:   editing.occupation   || undefined,
              address:      editing.address      || undefined,
            } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setModalOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={o => !o && setToDelete(null)}
        title="Delete parent?"
        description="This will permanently remove the parent record from Dataverse."
        onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
      />
    </div>
  );
}
