'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Megaphone, Pin, Users, GraduationCap, UserCircle, UserPlus,
    RefreshCw, Bell, BookOpen, Calendar, DollarSign, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { announcementsAPI, portalAPI } from '@/lib/api-client';
import { useSession } from '@/contexts/AuthContext';
import type { Announcement } from '@/lib/dataverse/announcements';

// ── Local constants ──────────────────────────────────────────────────────────

const AUDIENCE_ICON: Record<number, React.ElementType> = { 1: Users, 2: GraduationCap, 3: UserCircle, 4: UserPlus };
const AUDIENCE_COLOR: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    2: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    3: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    4: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};
const AUDIENCE_LABEL: Record<number, string> = { 1: 'All', 2: 'Students', 3: 'Teachers', 4: 'Parents' };

const ATT_STATUS: Record<number, string>  = { 1: 'Present', 2: 'Absent', 3: 'Late', 4: 'Excused' };
const FEE_STATUS: Record<number, string>  = { 1: 'Pending', 2: 'Paid', 3: 'Overdue', 4: 'Waived' };
const FEE_STATUS_COLOR: Record<number, string> = {
    1: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    2: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    3: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    4: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

// ── Interfaces ───────────────────────────────────────────────────────────────

interface ChildInfo    { studentid: string; studentname: string; isprimary: boolean; }
interface GradeEntry   { gradeid: string; subjectname: string; assessmenttypename: string; score: number; maxscore: number; date: string; termname: string; }
interface AttRecord    { attendanceid: string; date: string; attendancestatus: number; }
interface FeeInvoice   { feeid: string; name: string; amount: number; duedate: string; feestatus: number; feestructurename: string; }
interface ChildData {
    grades: GradeEntry[];
    attendance: { records: AttRecord[]; summary: { present: number; absent: number; late: number; excused: number; total: number; }; };
    fees: { invoices: FeeInvoice[]; summary: { totalOwed: number; totalPaid: number; }; };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}

function attBadgeCls(status: number) {
    if (status === 1) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 2) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (status === 3) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}

function scoreCls(score: number, max: number) {
    const pct = max > 0 ? score / max : 0;
    if (pct >= 0.7) return 'text-emerald-600 dark:text-emerald-400';
    if (pct >= 0.5) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

// ── Sub-components ───────────────────────────────────────────────────────────

function AnnouncementCard({ a }: { a: Announcement }) {
    const AudIcon = AUDIENCE_ICON[a.audience] ?? Users;
    const isExpired = a.expirydate && new Date(a.expirydate) < new Date();
    return (
        <div className={`relative rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-sm ${a.ispinned ? 'border-amber-200 dark:border-amber-800' : 'border-slate-200 dark:border-slate-800'}`}>
            {a.ispinned && <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-amber-400" />}
            <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2.5 mt-0.5 flex-shrink-0 ${a.ispinned ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    <Megaphone className={`h-4 w-4 ${a.ispinned ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {a.ispinned && <Pin className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">{a.name}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${AUDIENCE_COLOR[a.audience]}`}>
                            <AudIcon className="h-3 w-3" />{AUDIENCE_LABEL[a.audience]}
                        </span>
                        {isExpired && <Badge variant="destructive">Expired</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{a.message}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                        <span>Posted {a.publishdate ? fmtDate(a.publishdate.slice(0, 10)) : '—'}</span>
                        {a.expirydate && <span>· Expires {fmtDate(a.expirydate.slice(0, 10))}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PortalPage() {
    const { data: session } = useSession();
    const [tab, setTab] = useState<'notices' | 'children'>('notices');

    // Notices state
    const [notices, setNotices]           = useState<Announcement[]>([]);
    const [loadingNotices, setLoadingNotices] = useState(false);

    // Children state
    const [children, setChildren]         = useState<ChildInfo[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const [parentFound, setParentFound]   = useState<boolean | null>(null);
    const [selectedId, setSelectedId]     = useState<string | null>(null);
    const [childData, setChildData]       = useState<ChildData | null>(null);
    const [loadingChild, setLoadingChild] = useState(false);

    const loadNotices = useCallback(async () => {
        setLoadingNotices(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await announcementsAPI.getAll();
            const all: Announcement[] = res.data ?? [];
            setNotices(all.filter(a => a.audience === 1 || a.audience === 4));
        } catch { /* silent */ } finally { setLoadingNotices(false); }
    }, []);

    const loadChildren = useCallback(async () => {
        setLoadingChildren(true);
        try {
            const res  = await portalAPI.getChildren();
            const json = res.data as { data?: ChildInfo[]; parentFound?: boolean };
            const kids: ChildInfo[] = json.data ?? [];
            setChildren(kids);
            setParentFound(json.parentFound ?? false);
            if (kids.length === 1) setSelectedId(kids[0].studentid);
        } catch { /* silent */ } finally { setLoadingChildren(false); }
    }, []);

    const loadChildData = useCallback(async (sid: string) => {
        setLoadingChild(true);
        setChildData(null);
        try {
            const res  = await portalAPI.getChildData(sid);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const json = res.data as any;
            if (json.success) setChildData(json.data);
        } catch { /* silent */ } finally { setLoadingChild(false); }
    }, []);

    useEffect(() => { loadNotices(); }, [loadNotices]);

    useEffect(() => {
        if (tab === 'children' && parentFound === null) loadChildren();
    }, [tab, parentFound, loadChildren]);

    useEffect(() => {
        if (selectedId) loadChildData(selectedId);
    }, [selectedId, loadChildData]);

    const name   = session?.user?.name || 'Parent';
    const pinned  = notices.filter(a => a.ispinned && !(a.expirydate && new Date(a.expirydate) < new Date()));
    const regular = notices.filter(a => !a.ispinned && !(a.expirydate && new Date(a.expirydate) < new Date()));
    const expired = notices.filter(a => a.expirydate && new Date(a.expirydate) < new Date());
    const selectedChild = children.find(c => c.studentid === selectedId);

    const tabCls = (t: string) =>
        `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`;

    const onRefresh = tab === 'notices'
        ? loadNotices
        : () => { loadChildren(); if (selectedId) loadChildData(selectedId); };
    const isRefreshing = loadingNotices || loadingChildren || loadingChild;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">

            {/* Welcome */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-400 p-3">
                        <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-amber-900 dark:text-amber-100">Welcome, {name}</h1>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                            {notices.length} announcement{notices.length !== 1 ? 's' : ''} · {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="ml-auto">
                        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing} className="border-amber-300 text-amber-700 hover:bg-amber-100">
                            <RefreshCw className={`h-4 w-4 mr-1.5${isRefreshing ? ' animate-spin' : ''}`} /> Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setTab('notices')} className={tabCls('notices')}>
                    Notices
                    {notices.length > 0 && <span className="ml-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs px-1.5 py-0.5">{notices.length}</span>}
                </button>
                <button type="button" onClick={() => setTab('children')} className={tabCls('children')}>
                    My Children
                    {children.length > 0 && <span className="ml-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-1.5 py-0.5">{children.length}</span>}
                </button>
            </div>

            {/* ── NOTICES TAB ── */}
            {tab === 'notices' && (
                <div>
                    {loadingNotices ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
                    ) : !notices.length ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                            <Megaphone className="h-10 w-10 mb-3 opacity-40" />
                            <p className="text-sm">No announcements at the moment</p>
                            <p className="text-xs mt-1 text-slate-300">Check back later for updates from the school</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {pinned.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                                        <Pin className="h-3.5 w-3.5" /> Important Notices
                                    </p>
                                    {pinned.map(a => <AnnouncementCard key={a.announcementid} a={a} />)}
                                </div>
                            )}
                            {regular.length > 0 && (
                                <div className="space-y-3">
                                    {pinned.length > 0 && <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">General Announcements</p>}
                                    {regular.map(a => <AnnouncementCard key={a.announcementid} a={a} />)}
                                </div>
                            )}
                            {expired.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">Past Notices</p>
                                    {expired.map(a => <AnnouncementCard key={a.announcementid} a={a} />)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── CHILDREN TAB ── */}
            {tab === 'children' && (
                <div className="space-y-6">
                    {loadingChildren && (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
                    )}

                    {!loadingChildren && parentFound === false && (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
                            <UserPlus className="h-10 w-10 mb-3 opacity-40" />
                            <p className="text-sm font-medium">No children linked to your account</p>
                            <p className="text-xs mt-1 text-slate-300">Contact the school admin to link your children</p>
                        </div>
                    )}

                    {!loadingChildren && children.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {children.map(child => (
                                <button
                                    key={child.studentid}
                                    type="button"
                                    onClick={() => setSelectedId(child.studentid)}
                                    className={`rounded-xl border p-4 text-left transition-all ${selectedId === child.studentid ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-300'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                            <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{child.studentname}</p>
                                            {child.isprimary && <p className="text-xs text-amber-600 dark:text-amber-400">Primary ward</p>}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selected child heading */}
                    {selectedChild && !loadingChildren && (
                        <div className="flex items-center gap-2 pt-2">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{selectedChild.studentname}</h2>
                        </div>
                    )}

                    {/* Loading child data */}
                    {loadingChild && (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
                    )}

                    {/* Child data sections */}
                    {!loadingChild && childData && (
                        <div className="space-y-5">

                            {/* Attendance */}
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Attendance</h3>
                                    <span className="ml-auto text-xs text-slate-400">{childData.attendance.summary.total} records</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    {[
                                        { label: 'Present', count: childData.attendance.summary.present, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
                                        { label: 'Absent',  count: childData.attendance.summary.absent,  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
                                        { label: 'Late',    count: childData.attendance.summary.late,    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
                                        { label: 'Excused', count: childData.attendance.summary.excused, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
                                    ].map(s => (
                                        <div key={s.label} className={`rounded-lg p-3 text-center ${s.cls}`}>
                                            <p className="text-2xl font-bold">{s.count}</p>
                                            <p className="text-xs mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                {childData.attendance.records.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Recent</p>
                                        {childData.attendance.records.slice(0, 8).map(r => (
                                            <div key={r.attendanceid} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{fmtDate(r.date)}</span>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${attBadgeCls(r.attendancestatus)}`}>{ATT_STATUS[r.attendancestatus] ?? '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Grades */}
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="h-4 w-4 text-violet-500" />
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Grades</h3>
                                </div>
                                {childData.grades.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-6">No grades recorded yet</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                                    <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</th>
                                                    <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                                                    <th className="text-right py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
                                                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Term</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {childData.grades.slice(0, 15).map(g => (
                                                    <tr key={g.gradeid} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                        <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">{g.subjectname || '—'}</td>
                                                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{g.assessmenttypename}</td>
                                                        <td className="py-2 pr-4 text-right">
                                                            <span className={`font-semibold ${scoreCls(g.score, g.maxscore)}`}>{g.score}/{g.maxscore}</span>
                                                        </td>
                                                        <td className="py-2 text-xs text-slate-500 dark:text-slate-400">{g.termname || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Fees */}
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <DollarSign className="h-4 w-4 text-emerald-500" />
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Fee Balance</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-3">
                                        <p className="text-xs text-red-500 dark:text-red-400 font-medium">Outstanding</p>
                                        <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-0.5">{childData.fees.summary.totalOwed.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3">
                                        <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">Paid</p>
                                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{childData.fees.summary.totalPaid.toLocaleString()}</p>
                                    </div>
                                </div>
                                {childData.fees.invoices.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No fee invoices</p>
                                ) : (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Invoices</p>
                                        {childData.fees.invoices.map(f => (
                                            <div key={f.feeid} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.name || f.feestructurename || 'Fee'}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Due {fmtDate(f.duedate?.slice(0, 10) ?? '')}</p>
                                                </div>
                                                <div className="text-right ml-4 flex-shrink-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{f.amount.toLocaleString()}</p>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FEE_STATUS_COLOR[f.feestatus]}`}>{FEE_STATUS[f.feestatus]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
