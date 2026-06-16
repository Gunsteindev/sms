'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';

import { useEffect, useState, useMemo } from 'react';
import { MessageSquare, RefreshCw, Reply, Inbox, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/Pagination';
import { feedbackAPI } from '@/lib/api-client';

const PAGE_SIZE = 10;
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const TYPES: Record<number, string>  = { 1: 'Feedback', 2: 'Complaint', 3: 'Suggestion', 4: 'Question' };
const STATUS: Record<number, string> = { 1: 'Submitted', 2: 'In Review', 3: 'Resolved' };
const TYPE_VARIANT: Record<number, 'default' | 'destructive' | 'info' | 'secondary'> = {
    1: 'info', 2: 'destructive', 3: 'secondary', 4: 'default',
};
const STATUS_VARIANT: Record<number, 'warning' | 'info' | 'success'> = { 1: 'warning', 2: 'info', 3: 'success' };

interface FB {
    feedbackid: string; subject: string; feedbacktype: number; message: string;
    status: number; response: string; submittedby: string; studentname: string; createdon: string;
}

function fmtDate(d: string) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
}

export default function FeedbackAdminPage() {
    const [rows, setRows]             = useState<FB[]>([]);
    const [loading, setLoading]       = useState(true);
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]             = useState(1);
    const [editing, setEditing]       = useState<FB | null>(null);
    const [respStatus, setRespStatus] = useState('1');
    const [respText, setRespText]     = useState('');
    const [saving, setSaving]         = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await feedbackAPI.getAll();
            setRows(res?.data ?? []);
        } catch { toast.error('Failed to load feedback'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [typeFilter, statusFilter]);

    const filtered = useMemo(() => rows.filter(r =>
        (!typeFilter   || String(r.feedbacktype) === typeFilter) &&
        (!statusFilter || String(r.status)       === statusFilter)
    ), [rows, typeFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const openComplaints = rows.filter(r => r.feedbacktype === 2 && r.status !== 3).length;
    const unresolved     = rows.filter(r => r.status !== 3).length;

    const openRespond = (f: FB) => { setEditing(f); setRespStatus(String(f.status)); setRespText(f.response || ''); };

    const save = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            await feedbackAPI.update(editing.feedbackid, { status: Number(respStatus), response: respText });
            toast.success('Response saved');
            setEditing(null); load();
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Parent Feedback</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{rows.length} submission{rows.length !== 1 ? 's' : ''} from parents</p>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total',          value: rows.length,   Icon: Inbox,        cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
                    { label: 'Open Complaints',value: openComplaints, Icon: AlertTriangle,cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
                    { label: 'Unresolved',     value: unresolved,    Icon: CheckCircle2, cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
                ].map(({ label, value, Icon, cls }) => (
                    <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${cls}`}><Icon className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <SelectRoot value={typeFilter} onValueChange={v => setTypeFilter(v ?? '')}>
                    <SelectTrigger className="w-44 h-10"><SelectValue>{(v: string) => TYPES[Number(v)] ?? 'All Types'}</SelectValue></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        {Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                </SelectRoot>
                <SelectRoot value={statusFilter} onValueChange={v => setStatusFilter(v ?? '')}>
                    <SelectTrigger className="w-44 h-10"><SelectValue>{(v: string) => STATUS[Number(v)] ?? 'All Statuses'}</SelectValue></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        {Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                </SelectRoot>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                    <MessageSquare className="h-10 w-10 mb-3 opacity-40" /><p className="text-sm">No feedback found</p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800">
                                {['Subject', 'Type', 'From', 'Regarding', 'Date', 'Status', ''].map(h => <TableHead key={h}>{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(f => (
                                <TableRow key={f.feedbackid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <TableCell className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[220px]">
                                        <span className="truncate block">{f.subject}</span>
                                    </TableCell>
                                    <TableCell><Badge variant={TYPE_VARIANT[f.feedbacktype] ?? 'default'}>{TYPES[f.feedbacktype] ?? '—'}</Badge></TableCell>
                                    <TableCell className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{f.submittedby || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{f.studentname || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{fmtDate(f.createdon?.slice(0, 10) ?? '')}</TableCell>
                                    <TableCell><Badge variant={STATUS_VARIANT[f.status] ?? 'warning'}>{STATUS[f.status] ?? 'Submitted'}</Badge></TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => openRespond(f)}>
                                            <Reply className="h-3.5 w-3.5 mr-1" /> {f.response ? 'View' : 'Respond'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="submission" onChange={setPage} />
                </div>
            )}

            {/* Respond dialog */}
            <Dialog open={!!editing} onOpenChange={o => { if (!o) setEditing(null); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editing?.subject}</DialogTitle></DialogHeader>
                    {editing && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                                <Badge variant={TYPE_VARIANT[editing.feedbacktype] ?? 'default'}>{TYPES[editing.feedbacktype]}</Badge>
                                <span className="text-slate-500">From <span className="font-medium text-slate-700 dark:text-slate-300">{editing.submittedby || 'Parent'}</span></span>
                                {editing.studentname && <span className="text-slate-400">· Regarding {editing.studentname}</span>}
                                <span className="text-slate-400">· {fmtDate(editing.createdon?.slice(0, 10) ?? '')}</span>
                            </div>
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-3">
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{editing.message}</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
                                <SelectRoot value={respStatus} onValueChange={v => setRespStatus(v ?? '1')}>
                                    <SelectTrigger className={ST}><SelectValue>{(v: string) => STATUS[Number(v)] ?? 'Select'}</SelectValue></SelectTrigger>
                                    <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                </SelectRoot>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Response to parent</label>
                                <Textarea value={respText} onChange={e => setRespText(e.target.value)} rows={4} placeholder="Write a reply the parent will see…" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                                <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Response'}</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
