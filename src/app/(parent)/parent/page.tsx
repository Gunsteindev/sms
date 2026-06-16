'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Megaphone, Pin, Users, GraduationCap, UserCircle, UserPlus,
    RefreshCw, Bell, BookOpen, Calendar, DollarSign, ChevronRight, Search,
    ShieldAlert, FileText, Printer, MessageSquare, Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

const FB_TYPES: Record<number, string>  = { 1: 'Feedback', 2: 'Complaint', 3: 'Suggestion', 4: 'Question' };
const FB_STATUS: Record<number, string> = { 1: 'Submitted', 2: 'In Review', 3: 'Resolved' };
const FB_STATUS_COLOR: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

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
interface DiscRecord   { disciplinaryid: string; date: string; incidenttype: number; incidenttypename: string; description: string; action: string; resolved: boolean; }
interface FeedbackItem { feedbackid: string; subject: string; feedbacktype: number; message: string; status: number; response: string; studentname: string; createdon: string; }
interface TermOption   { termid: string; name: string; }
interface ReportRow    { subjectid: string; subjectname: string; subjectcode: string; classScore: number | null; examScore: number | null; finalScore: number | null; grade: string | null; }
interface ReportCard {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    student?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    school: any; termId?: string; subjectRows: ReportRow[];
    summary: { average: number | null; overallGrade: string | null; totalSubjects: number; subjectsScored: number; };
}
interface ChildData {
    grades: GradeEntry[];
    attendance: { records: AttRecord[]; summary: { present: number; absent: number; late: number; excused: number; total: number; }; };
    fees: { invoices: FeeInvoice[]; summary: { totalOwed: number; totalPaid: number; }; };
    disciplinary: DiscRecord[];
    terms: TermOption[];
    reportCard: ReportCard | null;
}

const GES_GRADE_COLORS: Record<string, string> = {
    A1: 'text-emerald-700 dark:text-emerald-400', B2: 'text-green-700 dark:text-green-400', B3: 'text-lime-700 dark:text-lime-400',
    C4: 'text-yellow-700 dark:text-yellow-400',  C5: 'text-amber-700 dark:text-amber-400',  C6: 'text-orange-600 dark:text-orange-400',
    D7: 'text-red-500 dark:text-red-400',        E8: 'text-red-600 dark:text-red-400',      F9: 'text-red-700 dark:text-red-400',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(n ?? 0);
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
    const [tab, setTab] = useState<'notices' | 'children' | 'feedback'>('notices');

    // Notices state
    const [notices, setNotices]           = useState<Announcement[]>([]);
    const [loadingNotices, setLoadingNotices] = useState(false);
    const [noticeSearch, setNoticeSearch] = useState('');

    // Children state
    const [children, setChildren]         = useState<ChildInfo[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const [parentFound, setParentFound]   = useState<boolean | null>(null);
    const [parentName, setParentName]     = useState('');
    const [selectedId, setSelectedId]     = useState<string | null>(null);
    const [childData, setChildData]       = useState<ChildData | null>(null);
    const [loadingChild, setLoadingChild] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState('');

    // Feedback state
    const [feedback, setFeedback]         = useState<FeedbackItem[]>([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [fbType, setFbType]             = useState('1');
    const [fbSubject, setFbSubject]       = useState('');
    const [fbChild, setFbChild]           = useState('');
    const [fbMessage, setFbMessage]       = useState('');
    const [submittingFb, setSubmittingFb] = useState(false);

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
            // apiClient unwraps to the response body: { success, data, parentFound }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await portalAPI.getChildren();
            const kids: ChildInfo[] = res?.data ?? [];
            setChildren(kids);
            setParentFound(res?.parentFound ?? false);
            setParentName(res?.parentName ?? '');
            if (kids.length === 1) setSelectedId(kids[0].studentid);
        } catch { /* silent */ } finally { setLoadingChildren(false); }
    }, []);

    const loadChildData = useCallback(async (sid: string, termId?: string) => {
        setLoadingChild(true);
        setChildData(null);
        try {
            // apiClient unwraps to the response body: { success, data }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await portalAPI.getChildData(sid, termId);
            if (res?.success) {
                setChildData(res.data);
                if (!termId) setSelectedTerm(res.data?.reportCard?.termId ?? res.data?.terms?.[0]?.termid ?? '');
            }
        } catch { /* silent */ } finally { setLoadingChild(false); }
    }, []);

    const onTermChange = (termId: string) => {
        setSelectedTerm(termId);
        if (selectedId) loadChildData(selectedId, termId || undefined);
    };

    const printReportCard = () => {
        const rc = childData?.reportCard;
        if (!rc) return;
        const childName = childData?.reportCard?.student?.fullname
            || children.find(c => c.studentid === selectedId)?.studentname || 'Student';
        const term = childData?.terms.find(t => t.termid === selectedTerm)?.name ?? '';
        const school = rc.school ?? {};
        const gradeColor: Record<string, string> = {
            A1: '#047857', B2: '#15803d', B3: '#4d7c0f', C4: '#a16207', C5: '#b45309',
            C6: '#ea580c', D7: '#ef4444', E8: '#dc2626', F9: '#b91c1c',
        };
        const rows = rc.subjectRows.map(r => `
            <tr>
                <td>${r.subjectname}${r.subjectcode ? ` <span style="color:#94a3b8">(${r.subjectcode})</span>` : ''}</td>
                <td style="text-align:center">${r.classScore ?? '—'}</td>
                <td style="text-align:center">${r.examScore ?? '—'}</td>
                <td style="text-align:center;font-weight:600">${r.finalScore ?? '—'}</td>
                <td style="text-align:center;font-weight:700;color:${r.grade ? gradeColor[r.grade] ?? '#1e293b' : '#94a3b8'}">${r.grade ?? 'Pending'}</td>
            </tr>`).join('');
        const win = window.open('', '_blank', 'width=820,height=900');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
            <title>Report Card — ${childName}</title>
            <style>
                *{box-sizing:border-box;margin:0;padding:0}
                body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;padding:32px}
                .head{text-align:center;border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:18px}
                .head h1{font-size:18px;text-transform:uppercase;letter-spacing:.04em}
                .head p{font-size:12px;color:#64748b;margin-top:2px}
                .head h2{margin-top:10px;font-size:14px;color:#1d4ed8;text-transform:uppercase;letter-spacing:.06em}
                .meta{display:flex;justify-content:space-between;font-size:12px;margin-bottom:14px}
                table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px}
                th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}
                th{background:#f1f5f9;text-transform:uppercase;font-size:10px;letter-spacing:.04em;color:#475569}
                tfoot td{background:#f1f5f9;font-weight:600}
                .scale{font-size:10px;color:#64748b;background:#f8fafc;border-radius:6px;padding:8px 10px}
                img{height:48px;width:48px;object-fit:contain;border-radius:6px;margin-bottom:6px}
            </style></head><body>
            <div class="head">
                ${school.logo ? `<img src="${school.logo}" alt="logo"/>` : ''}
                <h1>${school.name ?? 'School Report Card'}</h1>
                ${school.address ? `<p>${school.address}${school.region ? ', ' + school.region : ''}</p>` : ''}
                <h2>Terminal Report Card</h2>
            </div>
            <div class="meta">
                <div><strong>Student:</strong> ${childName}</div>
                <div><strong>Term:</strong> ${term || '—'}</div>
                <div><strong>Average:</strong> ${rc.summary.average ?? '—'}${rc.summary.average !== null ? '%' : ''}</div>
            </div>
            <table>
                <thead><tr><th>Subject</th><th style="text-align:center">Class (30%)</th><th style="text-align:center">Exam (70%)</th><th style="text-align:center">Total</th><th style="text-align:center">Grade</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">No grades for this term</td></tr>'}</tbody>
                ${rc.subjectRows.length ? `<tfoot><tr><td colspan="3">Overall Average</td><td style="text-align:center">${rc.summary.average ?? '—'}</td><td style="text-align:center;color:${rc.summary.overallGrade ? gradeColor[rc.summary.overallGrade] ?? '#1e293b' : '#94a3b8'}">${rc.summary.overallGrade ?? '—'}</td></tr></tfoot>` : ''}
            </table>
            <div class="scale"><strong>GES Grade Scale:</strong> A1: 80-100 · B2: 70-79 · B3: 60-69 · C4: 55-59 · C5: 50-54 · C6: 45-49 · D7: 40-44 · E8: 35-39 · F9: 0-34</div>
            </body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    useEffect(() => { loadNotices(); }, [loadNotices]);

    const loadFeedback = useCallback(async () => {
        setLoadingFeedback(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await portalAPI.getFeedback();
            setFeedback(res?.data ?? []);
        } catch { /* silent */ } finally { setLoadingFeedback(false); }
    }, []);

    const submitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fbSubject.trim() || !fbMessage.trim()) { toast.error('Subject and message are required'); return; }
        setSubmittingFb(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await portalAPI.submitFeedback({
                subject:      fbSubject.trim(),
                feedbacktype: Number(fbType),
                message:      fbMessage.trim(),
                studentid:    fbChild || undefined,
            });
            if (res?.success) {
                toast.success('Submitted — thank you!');
                setFbSubject(''); setFbMessage(''); setFbChild(''); setFbType('1');
                loadFeedback();
            } else {
                toast.error(res?.error || 'Failed to submit');
            }
        } catch { toast.error('Failed to submit'); } finally { setSubmittingFb(false); }
    };

    // Load the parent + their wards on mount so the greeting can show the real parent name
    useEffect(() => { loadChildren(); loadFeedback(); }, [loadChildren, loadFeedback]);

    useEffect(() => {
        if (selectedId) loadChildData(selectedId);
    }, [selectedId, loadChildData]);

    const name   = parentName || session?.user?.name || 'Parent';
    const filteredNotices = useMemo(() => {
        const q = noticeSearch.trim().toLowerCase();
        if (!q) return notices;
        return notices.filter(a => `${a.name} ${a.message}`.toLowerCase().includes(q));
    }, [notices, noticeSearch]);
    const pinned  = filteredNotices.filter(a => a.ispinned && !(a.expirydate && new Date(a.expirydate) < new Date()));
    const regular = filteredNotices.filter(a => !a.ispinned && !(a.expirydate && new Date(a.expirydate) < new Date()));
    const expired = filteredNotices.filter(a => a.expirydate && new Date(a.expirydate) < new Date());
    const selectedChild = children.find(c => c.studentid === selectedId);

    const tabCls = (t: string) =>
        `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`;

    const onRefresh = tab === 'notices'  ? loadNotices
        : tab === 'feedback' ? loadFeedback
        : () => { loadChildren(); if (selectedId) loadChildData(selectedId); };
    const isRefreshing = loadingNotices || loadingChildren || loadingChild || loadingFeedback;

    return (
        <div className="space-y-6">

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
                <button type="button" onClick={() => setTab('feedback')} className={tabCls('feedback')}>
                    Feedback
                    {feedback.length > 0 && <span className="ml-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-1.5 py-0.5">{feedback.length}</span>}
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
                        <div className="space-y-5">
                            {/* Search */}
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search notices…"
                                    className="pl-9"
                                    value={noticeSearch}
                                    onChange={e => setNoticeSearch(e.target.value)}
                                />
                            </div>

                            {!filteredNotices.length ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                                    <Search className="h-8 w-8 mb-3 opacity-40" />
                                    <p className="text-sm">No notices match &ldquo;{noticeSearch}&rdquo;</p>
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
                                        <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-0.5">{fmtCurrency(childData.fees.summary.totalOwed)}</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3">
                                        <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">Paid</p>
                                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{fmtCurrency(childData.fees.summary.totalPaid)}</p>
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
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmtCurrency(f.amount)}</p>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FEE_STATUS_COLOR[f.feestatus]}`}>{FEE_STATUS[f.feestatus]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Disciplinary */}
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Disciplinary</h3>
                                    {childData.disciplinary.length > 0 && (
                                        <span className="ml-auto text-xs text-slate-400">{childData.disciplinary.length} record{childData.disciplinary.length !== 1 ? 's' : ''}</span>
                                    )}
                                </div>
                                {childData.disciplinary.length === 0 ? (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center py-4">✓ Clean record — no incidents</p>
                                ) : (
                                    <div className="space-y-2">
                                        {childData.disciplinary.map(d => (
                                            <div key={d.disciplinaryid} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                                        {d.incidenttypename || 'Incident'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{fmtDate(d.date?.slice(0, 10) ?? '')}</span>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.resolved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                                                        {d.resolved ? 'Resolved' : 'Open'}
                                                    </span>
                                                </div>
                                                {d.description && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{d.description}</p>}
                                                {d.action && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1"><span className="font-medium">Action:</span> {d.action}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Report Card */}
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Report Card</h3>
                                    <div className="ml-auto flex items-center gap-2">
                                        {childData.terms.length > 0 && (
                                            <select
                                                value={selectedTerm}
                                                onChange={e => onTermChange(e.target.value)}
                                                className="h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm px-2 text-slate-900 dark:text-slate-100"
                                            >
                                                {childData.terms.map(t => <option key={t.termid} value={t.termid}>{t.name}</option>)}
                                            </select>
                                        )}
                                        {childData.reportCard && childData.reportCard.subjectRows.length > 0 && (
                                            <Button variant="outline" size="sm" onClick={printReportCard}>
                                                <Printer className="h-4 w-4 mr-1.5" /> Print
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {!childData.reportCard || childData.reportCard.subjectRows.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-6">No report card available for this term yet</p>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
                                                        <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left">Subject</th>
                                                        <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center">Class<br/><span className="font-normal normal-case text-[10px]">(30%)</span></th>
                                                        <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center">Exam<br/><span className="font-normal normal-case text-[10px]">(70%)</span></th>
                                                        <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center">Total</th>
                                                        <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center">Grade</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {childData.reportCard.subjectRows.map((r, i) => (
                                                        <tr key={r.subjectid} className={i % 2 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}>
                                                            <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                                                                {r.subjectname}{r.subjectcode && <span className="ml-1 text-xs text-slate-400">({r.subjectcode})</span>}
                                                            </td>
                                                            <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center text-slate-600 dark:text-slate-300">{r.classScore ?? '—'}</td>
                                                            <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center text-slate-600 dark:text-slate-300">{r.examScore ?? '—'}</td>
                                                            <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-semibold text-slate-900 dark:text-slate-100">{r.finalScore ?? '—'}</td>
                                                            <td className={`border border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-bold ${r.grade ? GES_GRADE_COLORS[r.grade] : 'text-slate-400'}`}>
                                                                {r.grade ?? <span className="text-xs font-normal italic">Pending</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-slate-50 dark:bg-slate-800 font-semibold">
                                                        <td className="border border-slate-200 dark:border-slate-700 px-3 py-2" colSpan={3}>Overall Average</td>
                                                        <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center">{childData.reportCard.summary.average ?? '—'}</td>
                                                        <td className={`border border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-bold ${childData.reportCard.summary.overallGrade ? GES_GRADE_COLORS[childData.reportCard.summary.overallGrade] : 'text-slate-400'}`}>
                                                            {childData.reportCard.summary.overallGrade ?? '—'}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                        {childData.reportCard.summary.subjectsScored < childData.reportCard.summary.totalSubjects && (
                                            <p className="text-xs text-slate-400 mt-2">
                                                {childData.reportCard.summary.subjectsScored} of {childData.reportCard.summary.totalSubjects} subjects scored — the rest are awaiting exam results.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            )}

            {/* ── FEEDBACK TAB ── */}
            {tab === 'feedback' && (
                <div className="space-y-5">
                    {/* Submit form */}
                    <form onSubmit={submitFeedback} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-amber-500" />
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Send Feedback or a Complaint</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Type</label>
                                <select value={fbType} onChange={e => setFbType(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm px-2 text-slate-900 dark:text-slate-100">
                                    {Object.entries(FB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Regarding (optional)</label>
                                <select value={fbChild} onChange={e => setFbChild(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm px-2 text-slate-900 dark:text-slate-100">
                                    <option value="">— General —</option>
                                    {children.map(c => <option key={c.studentid} value={c.studentid}>{c.studentname}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Subject</label>
                            <Input value={fbSubject} onChange={e => setFbSubject(e.target.value)} placeholder="Brief subject…" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Message</label>
                            <textarea value={fbMessage} onChange={e => setFbMessage(e.target.value)} rows={4}
                                placeholder="Write your feedback or complaint in detail…"
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm px-3 py-2 text-slate-900 dark:text-slate-100 resize-none" />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={submittingFb}>
                                <Send className="h-4 w-4 mr-1.5" /> {submittingFb ? 'Sending…' : 'Submit'}
                            </Button>
                        </div>
                    </form>

                    {/* Past submissions */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Your Submissions</h2>
                        {loadingFeedback ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
                        ) : feedback.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                                <MessageSquare className="h-8 w-8 mb-3 opacity-40" />
                                <p className="text-sm">No submissions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {feedback.map(f => (
                                    <div key={f.feedbackid} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{FB_TYPES[f.feedbacktype] ?? 'Feedback'}</span>
                                            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{f.subject}</h3>
                                            <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${FB_STATUS_COLOR[f.status]}`}>{FB_STATUS[f.status] ?? 'Submitted'}</span>
                                        </div>
                                        {f.studentname && <p className="text-xs text-slate-400 mt-1">Regarding {f.studentname}</p>}
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">{f.message}</p>
                                        <p className="text-xs text-slate-400 mt-2">{fmtDate(f.createdon?.slice(0, 10) ?? '')}</p>
                                        {f.response && (
                                            <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3">
                                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">School response</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{f.response}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
