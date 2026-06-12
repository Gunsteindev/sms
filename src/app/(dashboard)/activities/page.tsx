'use client';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Activity, RefreshCw, Download, Users, Trophy, Music, Drama, FlaskConical, BookOpen, Globe2, MoreHorizontal, UserPlus, UserMinus, MapPin } from 'lucide-react';
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/Pagination';
import { activitiesAPI, activityParticipantsAPI, studentsAPI } from '@/lib/api-client';
import { exportToCSV } from '@/lib/csv';
import type { Activity as ActivityType } from '@/lib/dataverse/activities';
import type { ActivityParticipant } from '@/lib/dataverse/activityParticipants';

const PAGE_SIZE = 10;
const ST = 'w-full h-10! bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const CAT: Record<number, string>  = { 1: 'Sports', 2: 'Arts', 3: 'Music', 4: 'Drama', 5: 'Science', 6: 'Academic', 7: 'Cultural', 8: 'Other' };
const CAT_ICON: Record<number, React.ElementType> = { 1: Trophy, 2: Activity, 3: Music, 4: Drama, 5: FlaskConical, 6: BookOpen, 7: Globe2, 8: MoreHorizontal };
const CAT_COLOR: Record<number, string> = {
    1: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    2: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    3: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    4: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    5: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    6: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    7: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    8: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};
const DAY: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };
const ASTATUS: Record<number, string> = { 1: 'Active', 2: 'Inactive' };

const schema = z.object({
    name:        z.string().min(1, 'Required'),
    category:    z.string().default('8'),
    coordinator: z.string().optional(),
    venue:       z.string().optional(),
    day:         z.string().optional(),
    starttime:   z.string().optional(),
    endtime:     z.string().optional(),
    capacity:    z.coerce.number().min(0).optional(),
    enrolled:    z.coerce.number().min(0).optional(),
    description: z.string().optional(),
    status:      z.string().default('1'),
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

function ActivityForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: { category: '8', status: '1', ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <F id="name" label="Activity Name *" error={errors.name?.message}>
                <Input id="name" {...register('name')} placeholder="e.g. Football Club" />
            </F>
            <div className="grid grid-cols-2 gap-4">
                <F id="category" label="Category *">
                    <Controller name="category" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '8'} onValueChange={v => field.onChange(v ?? '8')}>
                            <SelectTrigger id="category" className={ST}><SelectValue>{(v: string) => CAT[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                            <SelectContent>
                                {Object.entries(CAT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="status" label="Status">
                    <Controller name="status" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? '1'} onValueChange={v => field.onChange(v ?? '1')}>
                            <SelectTrigger id="status" className={ST}><SelectValue>{(v: string) => ASTATUS[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Active</SelectItem>
                                <SelectItem value="2">Inactive</SelectItem>
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule & Venue</p>
                <div className="grid grid-cols-3 gap-4">
                    <F id="day" label="Day">
                        <Controller name="day" control={control} render={({ field }) => (
                            <SelectRoot value={field.value ?? ''} onValueChange={v => field.onChange(v)}>
                                <SelectTrigger id="day" className={ST}><SelectValue>{(v: string) => DAY[Number(v)] ?? 'Day'}</SelectValue></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(DAY).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                    <F id="starttime" label="Start Time">
                        <Input id="starttime" type="time" {...register('starttime')} className="h-10" />
                    </F>
                    <F id="endtime" label="End Time">
                        <Input id="endtime" type="time" {...register('endtime')} className="h-10" />
                    </F>
                </div>
                <F id="venue" label="Venue">
                    <Input id="venue" {...register('venue')} placeholder="e.g. Sports Field A" />
                </F>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coordinator & Capacity</p>
                <F id="coordinator" label="Coordinator">
                    <Input id="coordinator" {...register('coordinator')} placeholder="Teacher / Staff name" />
                </F>
                <div className="grid grid-cols-2 gap-4">
                    <F id="capacity" label="Capacity">
                        <Input id="capacity" type="number" min={0} {...register('capacity')} placeholder="Max students" />
                    </F>
                    <F id="enrolled" label="Enrolled">
                        <Input id="enrolled" type="number" min={0} {...register('enrolled')} placeholder="Current count" />
                    </F>
                </div>
            </div>

            <F id="description" label="Description">
                <Textarea id="description" {...register('description')} rows={3} placeholder="Brief description of this activity…" />
            </F>

            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
            </div>
        </form>
    );
}

interface StudentOption { studentid: string; fullname: string; }

function ParticipantsDialog({
    activity,
    open,
    onOpenChange,
    onEnrolled,
}: {
    activity: ActivityType;
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onEnrolled: () => void;
}) {
    const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
    const [loading, setLoading]           = useState(false);
    const [setupRequired, setSetupRequired] = useState(false);

    const [studentSearch, setStudentSearch] = useState('');
    const [suggestions, setSuggestions]     = useState<StudentOption[]>([]);
    const [searching, setSearching]         = useState(false);
    const [selected, setSelected]           = useState<StudentOption | null>(null);
    const [enrolling, setEnrolling]         = useState(false);
    const [toUnenroll, setToUnenroll]       = useState<ActivityParticipant | null>(null);

    const loadParticipants = useCallback(async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await activityParticipantsAPI.getByActivity(activity.activityid);
            if (res.setup_required) { setSetupRequired(true); setParticipants([]); }
            else { setParticipants(res.data ?? []); }
        } catch { toast.error('Failed to load participants'); }
        finally { setLoading(false); }
    }, [activity.activityid]);

    useEffect(() => { if (open) { loadParticipants(); setStudentSearch(''); setSuggestions([]); setSelected(null); } }, [open, loadParticipants]);

    useEffect(() => {
        if (!studentSearch.trim() || studentSearch.trim().length < 2) { setSuggestions([]); return; }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const res: any = await studentsAPI.getAll({ search: studentSearch.trim(), pageSize: 10 });
                const rows = res.data?.items ?? res.data ?? [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setSuggestions(rows.map((s: any) => ({
                    studentid: s.studentid,
                    fullname:  s.fullname || `${s.firstname} ${s.lastname}`.trim(),
                })));
            } catch { setSuggestions([]); }
            finally { setSearching(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [studentSearch]);

    const enrolledIds = useMemo(() => new Set(participants.map(p => p.studentid)), [participants]);

    const handleEnroll = async () => {
        if (!selected) return;
        if (enrolledIds.has(selected.studentid)) { toast.error('Student already enrolled'); return; }
        setEnrolling(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await activityParticipantsAPI.enroll(activity.activityid, {
                studentid:   selected.studentid,
                studentname: selected.fullname,
            });
            if (res.success === false) { toast.error(res.error ?? 'Failed to enroll'); }
            else { toast.success(`${selected.fullname} enrolled`); setStudentSearch(''); setSuggestions([]); setSelected(null); loadParticipants(); onEnrolled(); }
        } catch { toast.error('Failed to enroll'); }
        finally { setEnrolling(false); }
    };

    const handleUnenroll = async (p: ActivityParticipant) => {
        try {
            await activityParticipantsAPI.unenroll(activity.activityid, p.participantid);
            toast.success(`${p.studentname} removed`);
            loadParticipants();
            onEnrolled();
        } catch { toast.error('Failed to remove participant'); }
        setToUnenroll(null);
    };

    const full = activity.capacity > 0 && activity.enrolled >= activity.capacity;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            {activity.name} — Participants
                        </DialogTitle>
                    </DialogHeader>

                    {setupRequired ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300">
                            <p className="font-semibold mb-1">Dataverse table required</p>
                            <p>Create <code className="font-mono text-xs bg-amber-100 dark:bg-amber-800/40 rounded px-1">sms_activityparticipants</code> with columns:</p>
                            <ul className="mt-2 space-y-0.5 text-xs font-mono list-disc list-inside">
                                {['sms_activityparticipantid (PK)', 'sms_name (Text)', 'sms_activityid (Text)', 'sms_activityname (Text)', 'sms_studentid (Text)', 'sms_studentname (Text)', 'sms_enrollmentdate (Date)', 'sms_status (Whole Number)', '_sms_school_value (Lookup → sms_schools)'].map(c => <li key={c}>{c}</li>)}
                            </ul>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Enroll section */}
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enroll a Student</p>
                                {full && (
                                    <p className="text-xs text-red-500">This activity is at full capacity ({activity.capacity}).</p>
                                )}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Search student name…"
                                            className="pl-8 h-9 text-sm"
                                            value={selected ? selected.fullname : studentSearch}
                                            onChange={e => { setSelected(null); setStudentSearch(e.target.value); }}
                                        />
                                        {suggestions.length > 0 && !selected && (
                                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {searching && <p className="text-xs text-slate-400 px-3 py-2">Searching…</p>}
                                                {suggestions.map(s => (
                                                    <button
                                                        key={s.studentid}
                                                        type="button"
                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between ${enrolledIds.has(s.studentid) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        onClick={() => { if (!enrolledIds.has(s.studentid)) { setSelected(s); setStudentSearch(s.fullname); setSuggestions([]); } }}
                                                    >
                                                        <span>{s.fullname}</span>
                                                        {enrolledIds.has(s.studentid) && <span className="text-xs text-slate-400">Already enrolled</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={!selected || enrolling || full}
                                        onClick={handleEnroll}
                                    >
                                        {enrolling ? '…' : <><UserPlus className="h-3.5 w-3.5 mr-1" />Enroll</>}
                                    </Button>
                                </div>
                            </div>

                            {/* Participants list */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Enrolled Students
                                        <span className="ml-1.5 text-xs text-slate-400">({participants.length}{activity.capacity > 0 ? ` / ${activity.capacity}` : ''})</span>
                                    </p>
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
                                ) : participants.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-slate-400 dark:text-slate-500">
                                        <Users className="h-8 w-8 mb-2 opacity-40" />
                                        <p className="text-sm">No participants yet</p>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden max-h-64 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-800/60">
                                                <tr>
                                                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                                                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrolled</th>
                                                    <th className="px-3 py-2 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {participants.map(p => (
                                                    <tr key={p.participantid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{p.studentname}</td>
                                                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">
                                                            {p.enrollmentdate ? new Date(p.enrollmentdate).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <button
                                                                type="button"
                                                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                                                                onClick={() => setToUnenroll(p)}
                                                                title="Remove"
                                                            >
                                                                <UserMinus className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toUnenroll}
                onOpenChange={o => !o && setToUnenroll(null)}
                title="Remove participant?"
                description={`Remove ${toUnenroll?.studentname} from ${activity.name}?`}
                onConfirm={() => { if (toUnenroll) handleUnenroll(toUnenroll); }}
            />
        </>
    );
}

export default function ActivitiesPage() {
    const [items, setItems]       = useState<ActivityType[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [catFilter, setCat]     = useState('');
    const [page, setPage]         = useState(1);
    const [modalOpen, setOpen]    = useState(false);
    const [editing, setEditing]   = useState<ActivityType | null>(null);
    const [toDelete, setToDelete] = useState<string | null>(null);
    const [participantsActivity, setParticipantsActivity] = useState<ActivityType | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await activitiesAPI.getAll();
            setItems(res.data ?? []);
        } catch { toast.error('Failed to load activities'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search, catFilter]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return items.filter(a =>
            (!catFilter || String(a.category) === catFilter) &&
            (!q || `${a.name} ${a.coordinator} ${a.venue}`.toLowerCase().includes(q))
        );
    }, [search, catFilter, items]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const active    = items.filter(a => a.status === 1).length;
    const totalCap  = items.reduce((s, a) => s + (a.capacity || 0), 0);
    const totalEnr  = items.reduce((s, a) => s + (a.enrolled || 0), 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        const payload = { ...data, category: Number(data.category), day: data.day ? Number(data.day) : undefined, status: Number(data.status) };
        try {
            if (editing) { await activitiesAPI.update(editing.activityid, payload); toast.success('Updated'); }
            else         { await activitiesAPI.create(payload);                     toast.success('Created'); }
            setOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const handleDelete = async (id: string) => {
        try { await activitiesAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    const CARDS = [
        { label: 'Active Activities', value: active,    sub: `${items.length} total`, accent: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', icon_c: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800', Icon: Activity },
        { label: 'Total Capacity',    value: totalCap,  sub: 'max students',          accent: 'bg-blue-500',    light: 'bg-blue-50 dark:bg-blue-900/20',    icon_c: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-100 dark:border-blue-800',    Icon: Users },
        { label: 'Total Enrolled',    value: totalEnr,  sub: totalCap ? `${Math.round((totalEnr/totalCap)*100)}% of capacity` : '—', accent: 'bg-violet-500', light: 'bg-violet-50 dark:bg-violet-900/20', icon_c: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-800', Icon: Trophy },
    ];

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Activities</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{items.length} extracurricular activit{items.length !== 1 ? 'ies' : 'y'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(
                        `activities_${new Date().toISOString().slice(0, 10)}`,
                        ['Name', 'Category', 'Coordinator', 'Venue', 'Day', 'Start', 'End', 'Capacity', 'Enrolled', 'Status'],
                        filtered.map(a => [a.name, CAT[a.category] ?? '', a.coordinator, a.venue, DAY[a.day] ?? '', a.starttime, a.endtime, a.capacity, a.enrolled, a.status === 1 ? 'Active' : 'Inactive'])
                    )}>
                        <Download className="h-4 w-4 mr-1.5" /> Export CSV
                    </Button>
                    <Button onClick={() => { setEditing(null); setOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Activity
                    </Button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
                {CARDS.map(c => (
                    <div key={c.label} className={`relative rounded-xl border ${c.border} bg-white dark:bg-slate-900 p-5 shadow-sm overflow-hidden`}>
                        <div className={`absolute inset-x-0 top-0 h-1 ${c.accent}`} />
                        <div className="flex items-start gap-4 mt-1">
                            <div className={`rounded-lg p-2.5 ${c.light}`}>
                                <c.Icon className={`h-5 w-5 ${c.icon_c}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{c.value}</p>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{c.label}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{c.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <Input placeholder="Search activities…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <SelectRoot value={catFilter} onValueChange={v => setCat(v ?? '')}>
                    <SelectTrigger className="w-36 h-10"><SelectValue>{(v: string) => CAT[Number(v)] ?? 'All Categories'}</SelectValue></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {Object.entries(CAT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                </SelectRoot>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                    <Activity className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No activities found</p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {['Activity', 'Venue', 'Category', 'Coordinator', 'Schedule', 'Enrollment', 'Status', ''].map(h => (
                                    <TableHead key={h}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(a => {
                                const CatIcon = CAT_ICON[a.category] ?? Activity;
                                const pct = a.capacity ? Math.min(100, Math.round((a.enrolled / a.capacity) * 100)) : 0;
                                const full = a.capacity > 0 && a.enrolled >= a.capacity;
                                return (
                                    <TableRow key={a.activityid}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`rounded-lg p-1.5 ${CAT_COLOR[a.category]}`}>
                                                    <CatIcon className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{a.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {a.venue ? (
                                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                    <span className="truncate max-w-[140px]">{a.venue}</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-600">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${CAT_COLOR[a.category]}`}>
                                                <CatIcon className="h-3 w-3" />{CAT[a.category] ?? '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-700 dark:text-slate-300">{a.coordinator || '—'}</TableCell>
                                        <TableCell>
                                            {a.day ? (
                                                <div className="text-slate-700 dark:text-slate-300">
                                                    <span className="font-medium">{DAY[a.day]}</span>
                                                    {a.starttime && <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">{a.starttime}{a.endtime ? `–${a.endtime}` : ''}</span>}
                                                </div>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {a.capacity > 0 ? (
                                                <div className="w-28">
                                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                                                        <span>{a.enrolled}/{a.capacity}</span>
                                                        <span>{pct}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${full ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                    {full && <p className="text-xs text-red-500 mt-0.5">Full</p>}
                                                </div>
                                            ) : <span className="text-slate-400 dark:text-slate-500 text-xs">No limit</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={a.status === 1 ? 'default' : 'secondary'}>
                                                {a.status === 1 ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 justify-end">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    title="Manage participants"
                                                    onClick={() => setParticipantsActivity(a)}
                                                >
                                                    <Users className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-violet-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setOpen(true); }}>
                                                    <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setToDelete(a.activityid)}>
                                                    <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="activity" onChange={setPage} />
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={o => { if (!o) { setOpen(false); setEditing(null); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
                    </DialogHeader>
                    <ActivityForm
                        defaultValues={editing ? {
                            name: editing.name, category: String(editing.category),
                            coordinator: editing.coordinator, venue: editing.venue,
                            day: editing.day ? String(editing.day) : undefined,
                            starttime: editing.starttime, endtime: editing.endtime,
                            capacity: editing.capacity, enrolled: editing.enrolled,
                            description: editing.description, status: String(editing.status),
                        } : undefined}
                        onSubmit={handleSubmit}
                        onCancel={() => { setOpen(false); setEditing(null); }}
                    />
                </DialogContent>
            </Dialog>

            {participantsActivity && (
                <ParticipantsDialog
                    activity={participantsActivity}
                    open={!!participantsActivity}
                    onOpenChange={o => { if (!o) setParticipantsActivity(null); }}
                    onEnrolled={() => {
                        // refresh the activity's enrolled count in local state
                        load();
                    }}
                />
            )}

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete activity?" description="This will permanently remove the activity."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
