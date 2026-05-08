'use client';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Megaphone, RefreshCw, Pin, PinOff, Users, GraduationCap, UserCircle, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { announcementsAPI } from '@/lib/api-client';
import type { Announcement } from '@/lib/dataverse/announcements';

const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const AUDIENCE: Record<number, string> = { 1: 'All', 2: 'Students', 3: 'Teachers', 4: 'Parents' };
const AUDIENCE_ICON: Record<number, React.ElementType> = { 1: Users, 2: GraduationCap, 3: UserCircle, 4: UserPlus };
const AUDIENCE_COLOR: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    2: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    3: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    4: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const schema = z.object({
    name:        z.string().min(1, 'Required'),
    message:     z.string().min(1, 'Required'),
    audience:    z.string().default('1'),
    ispinned:    z.boolean().default(false),
    publishdate: z.string().optional(),
    expirydate:  z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function AnnouncementForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: { audience: '1', ispinned: false, ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <F id="name" label="Title *" error={errors.name?.message}>
                <Input id="name" {...register('name')} placeholder="Announcement title" />
            </F>
            <F id="message" label="Message *" error={errors.message?.message}>
                <Textarea id="message" {...register('message')} rows={5} placeholder="Write the full announcement text…" />
            </F>
            <div className="grid grid-cols-2 gap-4">
                <F id="audience" label="Audience *">
                    <Controller name="audience" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '1'} onValueChange={v => field.onChange(v ?? '1')}>
                            <SelectTrigger id="audience" className={ST}><SelectValue>{(v: string) => AUDIENCE[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {Object.entries(AUDIENCE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" {...register('ispinned')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Pin to top</span>
                    </label>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <F id="publishdate" label="Publish Date">
                    <Controller control={control} name="publishdate" render={({ field }) => (
                        <DatePicker id="publishdate" value={field.value ?? ''} onChange={field.onChange} placeholder="Today" />
                    )} />
                </F>
                <F id="expirydate" label="Expiry Date">
                    <Controller control={control} name="expirydate" render={({ field }) => (
                        <DatePicker id="expirydate" value={field.value ?? ''} onChange={field.onChange} placeholder="No expiry" />
                    )} />
                </F>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
            </div>
        </form>
    );
}

export default function AnnouncementsPage() {
    const [items, setItems]         = useState<Announcement[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [audFilter, setAudFilter] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Announcement | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await announcementsAPI.getAll();
            setItems(res.data ?? []);
        } catch { toast.error('Failed to load announcements'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return items.filter(a =>
            (!audFilter || String(a.audience) === audFilter) &&
            (!q || `${a.name} ${a.message}`.toLowerCase().includes(q))
        );
    }, [search, audFilter, items]);

    const pinned   = filtered.filter(a => a.ispinned);
    const unpinned = filtered.filter(a => !a.ispinned);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        const payload = { ...data, audience: Number(data.audience) };
        try {
            if (editing) { await announcementsAPI.update(editing.announcementid, payload); toast.success('Updated'); }
            else         { await announcementsAPI.create(payload);                         toast.success('Posted'); }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const togglePin = async (a: Announcement) => {
        try {
            await announcementsAPI.update(a.announcementid, { ispinned: !a.ispinned });
            toast.success(a.ispinned ? 'Unpinned' : 'Pinned');
            load();
        } catch { toast.error('Failed to update'); }
    };

    const handleDelete = async (id: string) => {
        try { await announcementsAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    const Card = ({ a }: { a: Announcement }) => {
        const AudIcon = AUDIENCE_ICON[a.audience] ?? Users;
        const isExpired = a.expirydate && new Date(a.expirydate) < new Date();
        return (
            <div className={`relative rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-sm transition-shadow hover:shadow-md ${a.ispinned ? 'border-blue-200 dark:border-blue-800' : 'border-slate-200 dark:border-slate-800'}`}>
                {a.ispinned && <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-blue-500" />}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            {a.ispinned && <Pin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">{a.name}</h3>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${AUDIENCE_COLOR[a.audience]}`}>
                                <AudIcon className="h-3 w-3" />{AUDIENCE[a.audience]}
                            </span>
                            {isExpired && <Badge variant="destructive">Expired</Badge>}
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{a.message}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                            <span>Posted {a.publishdate ? new Date(a.publishdate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                            {a.expirydate && <span>· Expires {new Date(a.expirydate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" title={a.ispinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(a)}>
                            {a.ispinned ? <PinOff className="h-4 w-4 text-blue-500" /> : <Pin className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-blue-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setModalOpen(true); }}>
                            <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setToDelete(a.announcementid)}>
                            <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Announcements</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{items.length} announcement{items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> New Announcement
                    </Button>
                </div>
            </div>

            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <Input placeholder="Search announcements…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <SelectRoot value={audFilter} onValueChange={v => setAudFilter(v ?? '')}>
                    <SelectTrigger className="w-36 h-10"><SelectValue>{(v: string) => AUDIENCE[Number(v)] ?? 'All Audiences'}</SelectValue></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Audiences</SelectItem>
                        {Object.entries(AUDIENCE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                </SelectRoot>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                    <Megaphone className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No announcements found</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {pinned.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 flex items-center gap-1.5">
                                <Pin className="h-3.5 w-3.5" /> Pinned
                            </p>
                            {pinned.map(a => <Card key={a.announcementid} a={a} />)}
                        </div>
                    )}
                    {unpinned.length > 0 && (
                        <div className="space-y-3">
                            {pinned.length > 0 && <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">All Announcements</p>}
                            {unpinned.map(a => <Card key={a.announcementid} a={a} />)}
                        </div>
                    )}
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setModalOpen(false); setEditing(null); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
                    </DialogHeader>
                    <AnnouncementForm
                        defaultValues={editing ? {
                            name: editing.name, message: editing.message,
                            audience: String(editing.audience), ispinned: editing.ispinned,
                            publishdate: editing.publishdate?.slice(0, 10),
                            expirydate:  editing.expirydate?.slice(0, 10),
                        } : undefined}
                        onSubmit={handleSubmit}
                        onCancel={() => { setModalOpen(false); setEditing(null); }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete announcement?" description="This will permanently remove the announcement."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
