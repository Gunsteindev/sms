'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { academicYearsAPI, gradeLevelsAPI, classesAPI, studentsAPI, promotionsAPI } from '@/lib/api-client';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/contexts/I18nContext';

type PromotionStatus = 1 | 2 | 3 | 4;

const STATUS_COLORS: Record<PromotionStatus, string> = {
    1: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    2: 'text-amber-700 bg-amber-50 border-amber-200',
    3: 'text-blue-700 bg-blue-50 border-blue-200',
    4: 'text-purple-700 bg-purple-50 border-purple-200',
};

interface StudentRow {
    studentid:      string;
    name:           string;
    rollnumber:     string;
    gradelevelid:   string;
    status:         PromotionStatus;
    toclassid:      string;
    togradelevelid: string;
    remarks:        string;
}

type Tab = 'promote' | 'history';

export default function PromotionsPage() {
    const { t } = useI18n();
    const pr = t.promotions;

    const statusOptions = [
        { value: 1 as PromotionStatus, label: pr.promoted,    color: STATUS_COLORS[1] },
        { value: 2 as PromotionStatus, label: pr.retained,    color: STATUS_COLORS[2] },
        { value: 3 as PromotionStatus, label: pr.transferred, color: STATUS_COLORS[3] },
        { value: 4 as PromotionStatus, label: pr.graduated,   color: STATUS_COLORS[4] },
    ];

    const [tab, setTab] = useState<Tab>('promote');

    // Reference data
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [gradeLevels,   setGradeLevels]   = useState<any[]>([]);
    const [classes,       setClasses]       = useState<any[]>([]);

    // Filters
    const [selYear,      setSelYear]      = useState('');
    const [selFromGrade, setSelFromGrade] = useState('');

    // Table rows
    const [rows,    setRows]    = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState('');

    // History
    const [history,        setHistory]        = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Load reference data
    useEffect(() => {
        Promise.all([academicYearsAPI.getAll(), gradeLevelsAPI.getAll(), classesAPI.getAll()]).then(([yr, gl, cl]: any[]) => {
            setAcademicYears(yr.data ?? []);
            setGradeLevels(gl.data ?? []);
            setClasses(cl.data ?? []);
        }).catch(() => toast.error(t.common.error));
    }, [t.common.error]);

    // Load students for selected grade
    const loadStudents = useCallback(async () => {
        if (!selFromGrade) { setRows([]); return; }
        setLoading(true);
        setError('');
        try {
            const res: any = await studentsAPI.getAll({ gradelevelid: selFromGrade });
            const students: any[] = res.data ?? [];

            const sortedGrades = [...gradeLevels].sort((a, b) => (a.ordernumber ?? 0) - (b.ordernumber ?? 0));
            const fromIdx = sortedGrades.findIndex(g => g.gradelevelid === selFromGrade);
            const nextGrade = fromIdx >= 0 && fromIdx < sortedGrades.length - 1 ? sortedGrades[fromIdx + 1] : null;
            const isLastGrade = fromIdx === sortedGrades.length - 1;

            setRows(students.map((s: any) => ({
                studentid:      s.studentid,
                name:           s.fullname || `${s.firstname} ${s.lastname}`.trim(),
                rollnumber:     s.rollnumber ?? '',
                gradelevelid:   s.gradelevelid ?? '',
                status:         isLastGrade ? 4 : 1,
                toclassid:      '',
                togradelevelid: nextGrade?.gradelevelid ?? '',
                remarks:        '',
            })));
        } catch {
            setError(t.common.error);
        } finally {
            setLoading(false);
        }
    }, [selFromGrade, gradeLevels, t.common.error]);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    // Load history
    const loadHistory = useCallback(async () => {
        if (tab !== 'history') return;
        setHistoryLoading(true);
        try {
            const res: any = await promotionsAPI.getAll({ academicyearid: selYear || undefined });
            setHistory(res.data ?? []);
        } catch {
            toast.error(t.common.error);
        } finally {
            setHistoryLoading(false);
        }
    }, [tab, selYear, t.common.error]);

    useEffect(() => { loadHistory(); }, [loadHistory]);

    const updateRow = (studentid: string, field: keyof StudentRow, value: any) => {
        setRows(prev => prev.map(r => r.studentid === studentid ? { ...r, [field]: value } : r));
    };

    const handleApply = async () => {
        const entries = rows.map(r => ({
            studentid:        r.studentid,
            status:           r.status,
            fromgradelevelid: selFromGrade,
            togradelevelid:   r.togradelevelid || undefined,
            toclassid:        r.toclassid || undefined,
            academicyearid:   selYear || undefined,
            remarks:          r.remarks || undefined,
        }));
        setSaving(true);
        try {
            const res: any = await promotionsAPI.bulk(entries);
            toast.success(res.message ?? pr.apply);
            setTab('history');
        } catch {
            toast.error(t.common.error);
        } finally {
            setSaving(false);
        }
    };

    const classesForGrade = (gradelevelid: string) =>
        classes.filter((c: any) => c.gradelevelid === gradelevelid);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{pr.title}</h1>
                    <p className="text-xs text-slate-500">{pr.subtitle}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                {([['promote', pr.applyTab], ['history', pr.historyTab]] as [Tab, string][]).map(([tabKey, label]) => (
                    <button
                        key={tabKey}
                        type="button"
                        onClick={() => setTab(tabKey)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
                            ${tab === tabKey
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'promote' && (
                <>
                    {/* Filter bar */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-4">
                        <div className="space-y-1.5">
                            <Label>Academic Year</Label>
                            <SelectRoot value={selYear} onValueChange={v => setSelYear(v ?? '')}>
                                <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                                    <SelectValue>
                                        {selYear
                                            ? (academicYears.find((y: any) => y.academicyearid === selYear)?.name ?? pr.allYears)
                                            : pr.allYears}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{pr.allYears}</SelectItem>
                                    {academicYears.map((y: any) => (
                                        <SelectItem key={y.academicyearid} value={y.academicyearid}>{y.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        </div>
                        <div className="space-y-1.5">
                            <Label>{pr.fromGrade} <span className="text-red-500">*</span></Label>
                            <SelectRoot value={selFromGrade} onValueChange={v => setSelFromGrade(v ?? '')}>
                                <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                                    <SelectValue>
                                        {selFromGrade
                                            ? (gradeLevels.find((g: any) => g.gradelevelid === selFromGrade)?.name ?? pr.selectGrade)
                                            : pr.selectGrade}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{pr.selectGrade}</SelectItem>
                                    {[...gradeLevels].sort((a, b) => (a.ordernumber ?? 0) - (b.ordernumber ?? 0)).map((g: any) => (
                                        <SelectItem key={g.gradelevelid} value={g.gradelevelid}>{g.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!selFromGrade ? (
                        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
                            <TrendingUp className="h-10 w-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium text-slate-500">{pr.selectGradePrompt}</p>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
                            <TrendingUp className="h-10 w-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium text-slate-500">{pr.noStudents}</p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-8">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t.gradebook.student}</th>
                                            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">{pr.decision}</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{pr.promoteToGrade}</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{pr.promoteToClass}</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{pr.remarks}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {rows.map((row, idx) => {
                                            const cfg = statusOptions.find(s => s.value === row.status)!;
                                            return (
                                                <tr key={row.studentid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-2.5 text-xs text-slate-400">{idx + 1}</td>
                                                    <td className="px-4 py-2.5">
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">{row.name}</p>
                                                        {row.rollnumber && <p className="text-xs text-slate-400">{row.rollnumber}</p>}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <SelectRoot
                                                            value={String(row.status)}
                                                            onValueChange={v => updateRow(row.studentid, 'status', parseInt(v ?? '1') as PromotionStatus)}
                                                        >
                                                            <SelectTrigger className={`w-32 text-xs font-medium border ${cfg.color} bg-transparent`}>
                                                                <SelectValue>
                                                                    {cfg.label}
                                                                </SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {statusOptions.map(o => (
                                                                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </SelectRoot>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {row.status === 1 && (
                                                            <SelectRoot
                                                                value={row.togradelevelid}
                                                                onValueChange={v => updateRow(row.studentid, 'togradelevelid', v ?? '')}
                                                            >
                                                                <SelectTrigger className="w-36 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                                                                    <SelectValue>
                                                                        {row.togradelevelid
                                                                            ? (gradeLevels.find((g: any) => g.gradelevelid === row.togradelevelid)?.name ?? pr.selectGrade)
                                                                            : pr.selectGrade}
                                                                    </SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="">{pr.selectGrade}</SelectItem>
                                                                    {[...gradeLevels].sort((a, b) => (a.ordernumber ?? 0) - (b.ordernumber ?? 0)).map((g: any) => (
                                                                        <SelectItem key={g.gradelevelid} value={g.gradelevelid}>{g.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </SelectRoot>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {row.status === 1 && row.togradelevelid && (
                                                            <SelectRoot
                                                                value={row.toclassid}
                                                                onValueChange={v => updateRow(row.studentid, 'toclassid', v ?? '')}
                                                            >
                                                                <SelectTrigger className="w-36 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                                                                    <SelectValue>
                                                                        {row.toclassid
                                                                            ? (classesForGrade(row.togradelevelid).find((c: any) => c.classid === row.toclassid)?.classname ?? pr.anyClass)
                                                                            : pr.anyClass}
                                                                    </SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="">{pr.anyClass}</SelectItem>
                                                                    {classesForGrade(row.togradelevelid).map((c: any) => (
                                                                        <SelectItem key={c.classid} value={c.classid}>{c.classname}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </SelectRoot>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            placeholder={pr.optional}
                                                            value={row.remarks}
                                                            onChange={e => updateRow(row.studentid, 'remarks', e.target.value)}
                                                            className="w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    {rows.length} students · {rows.filter(r => r.status === 1).length} {pr.promoted.toLowerCase()} · {rows.filter(r => r.status === 2).length} {pr.retained.toLowerCase()} · {rows.filter(r => r.status === 4).length} {pr.graduated.toLowerCase()}
                                </p>
                                <button
                                    onClick={handleApply}
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {saving ? pr.applying : pr.apply}
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            {tab === 'history' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-7 w-7 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <History className="h-10 w-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium text-slate-500">{pr.noHistory}</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t.gradebook.student}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{pr.from}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{pr.to}</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">{pr.decision}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{pr.date}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{pr.year}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {history.map((p: any) => {
                                    const cfg = statusOptions.find(s => s.value === p.status);
                                    return (
                                        <tr key={p.promotionid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.studentname}</td>
                                            <td className="px-4 py-3 text-slate-500">{p.fromgradelevelname || p.fromclassname || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">{p.togradelevelname || p.toclassname || '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${cfg?.color ?? ''}`}>
                                                    {p.statuslabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{p.promotiondate || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">{p.academicyearname || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
