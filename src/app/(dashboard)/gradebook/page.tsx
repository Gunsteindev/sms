'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpenCheck, Save, AlertCircle, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { classesAPI, subjectsAPI, termsAPI, academicYearsAPI, gradesAPI, studentsAPI } from '@/lib/api-client';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/contexts/I18nContext';
import { useSchoolSettings } from '@/contexts/SchoolSettingsContext';
import type { AssessmentComponent } from '@/lib/grading-systems';

interface StudentRow {
    studentid:  string;
    name:       string;
    rollnumber: string;
    scores:     Record<string, { gradeid?: string; score: number | null; dirty: boolean }>;
}

function buildRows(
    students: any[],
    grades:   any[],
    components: AssessmentComponent[],
): StudentRow[] {
    return students.map(s => {
        const studentGrades = grades.filter((g: any) => g.studentid === s.studentid);
        const scores: StudentRow['scores'] = {};
        for (const comp of components) {
            scores[comp.key] = { score: null, dirty: false };
            const g = studentGrades.find((gr: any) => gr.assessmenttype === comp.assessmentType);
            if (g) scores[comp.key] = { gradeid: g.gradeid, score: g.score, dirty: false };
        }
        return {
            studentid:  s.studentid,
            name:       s.fullname || `${s.firstname} ${s.lastname}`.trim(),
            rollnumber: s.rollnumber ?? '',
            scores,
        };
    });
}

export default function GradebookPage() {
    const { t } = useI18n();
    const gb = t.gradebook;
    const { gradingSystem } = useSchoolSettings();

    // ── Filters ────────────────────────────────────────────────────────────
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [allTerms,      setAllTerms]      = useState<any[]>([]);
    const [allClasses,    setAllClasses]    = useState<any[]>([]);
    const [subjects,      setSubjects]      = useState<any[]>([]);

    const [selYear,    setSelYear]    = useState('');
    const [selTerm,    setSelTerm]    = useState('');
    const [selClass,   setSelClass]   = useState('');
    const [selSubject, setSelSubject] = useState('');

    const terms   = selYear ? allTerms.filter((t: any)   => t.academicyearid === selYear) : allTerms;
    const classes = selYear ? allClasses.filter((c: any) => c.academicyearid === selYear) : allClasses;

    // ── Table state ────────────────────────────────────────────────────────
    const [rows,    setRows]    = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState('');

    // ── Load reference data ────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            academicYearsAPI.getAll(),
            classesAPI.getAll(),
            subjectsAPI.getAll(),
            termsAPI.getAll(),
        ]).then(([yr, cl, su, tr]: any[]) => {
            setAcademicYears(yr.data ?? []);
            setAllClasses(cl.data ?? []);
            setSubjects(su.data ?? []);
            setAllTerms(tr.data ?? []);
        }).catch(() => toast.error(t.common.error));
    }, [t.common.error]);

    // ── Refresh ────────────────────────────────────────────────────────────
    const [refreshing, setRefreshing] = useState(false);
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const [yr, cl, su, tr]: any[] = await Promise.all([
                academicYearsAPI.getAll(),
                classesAPI.getAll(),
                subjectsAPI.getAll(),
                termsAPI.getAll(),
            ]);
            setAcademicYears(yr.data ?? []);
            setAllClasses(cl.data ?? []);
            setSubjects(su.data ?? []);
            setAllTerms(tr.data ?? []);
        } catch {
            toast.error(t.common.error);
        } finally {
            setRefreshing(false);
        }
    }, [t.common.error]);

    // ── Load gradebook data ────────────────────────────────────────────────
    const loadGradebook = useCallback(async () => {
        if (!selClass || !selSubject) return;
        setLoading(true);
        setError('');
        try {
            const [studentsRes, gradesRes]: any[] = await Promise.all([
                studentsAPI.getAll({ classid: selClass }),
                gradesAPI.getAll({ classid: selClass, subjectid: selSubject, termid: selTerm || undefined }),
            ]);
            setRows(buildRows(studentsRes.data ?? [], gradesRes.data ?? [], gradingSystem.components));
        } catch {
            setError(t.common.error);
        } finally {
            setLoading(false);
        }
    }, [selClass, selSubject, selTerm, gradingSystem.components, t.common.error]);

    useEffect(() => { loadGradebook(); }, [loadGradebook]);

    // Rebuild rows when grading system changes (re-map existing scores to new component keys)
    useEffect(() => {
        if (rows.length === 0) return;
        setRows(prev => prev.map(r => {
            const newScores: StudentRow['scores'] = {};
            for (const comp of gradingSystem.components) {
                // preserve score if same assessmentType exists in current row
                const existing = Object.values(r.scores).find(
                    (_, i) => Object.keys(r.scores)[i] === comp.key
                );
                newScores[comp.key] = existing ?? { score: null, dirty: false };
            }
            return { ...r, scores: newScores };
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gradingSystem.id]);

    // ── Cell edit ──────────────────────────────────────────────────────────
    const handleScoreChange = (studentid: string, key: string, raw: string) => {
        const num = raw === '' ? null : parseFloat(raw);
        if (num !== null && (num < 0 || num > 100)) return;
        setRows(prev => prev.map(r =>
            r.studentid === studentid
                ? { ...r, scores: { ...r.scores, [key]: { ...r.scores[key], score: num, dirty: true } } }
                : r
        ));
    };

    // ── Save ───────────────────────────────────────────────────────────────
    const handleSave = async () => {
        const entries: any[] = [];
        for (const row of rows) {
            for (const comp of gradingSystem.components) {
                const cell = row.scores[comp.key];
                if (!cell?.dirty || cell.score === null) continue;
                entries.push({
                    gradeid:        cell.gradeid,
                    studentid:      row.studentid,
                    subjectid:      selSubject,
                    classid:        selClass,
                    termid:         selTerm || undefined,
                    academicyearid: selYear || undefined,
                    assessmenttype: comp.assessmentType,
                    score:          cell.score,
                    maxscore:       100,
                    date:           new Date().toISOString().slice(0, 10),
                });
            }
        }
        if (!entries.length) { toast(gb.noChanges); return; }
        setSaving(true);
        try {
            const res: any = await gradesAPI.bulkUpsert(entries);
            toast.success(`${res.data?.saved ?? entries.length} ${gb.gradesSaved}`);
            setRows(prev => prev.map(r => ({
                ...r,
                scores: Object.fromEntries(
                    gradingSystem.components.map(c => [c.key, { ...r.scores[c.key], dirty: false }])
                ),
            })));
            loadGradebook();
        } catch {
            toast.error(t.common.error);
        } finally {
            setSaving(false);
        }
    };

    const hasDirty = rows.some(r => gradingSystem.components.some(c => r.scores[c.key]?.dirty));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                        <BookOpenCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{gb.title}</h1>
                        <p className="text-xs text-slate-500">
                            {gb.subtitle}
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                                {gradingSystem.flag} {gradingSystem.shortName}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? t.common.loading : t.common.refresh}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasDirty || saving}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? t.common.saving : gb.saveAll}
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-4">
                <div className="space-y-1.5">
                    <Label>{t.nav.academicYears}</Label>
                    <SelectRoot value={selYear} onValueChange={v => { setSelYear(v ?? ''); setSelTerm(''); setSelClass(''); }}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                            <SelectValue>
                                {selYear ? (academicYears.find((y: any) => y.academicyearid === selYear)?.name ?? gb.allYears) : gb.allYears}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{gb.allYears}</SelectItem>
                            {academicYears.map((y: any) => (
                                <SelectItem key={y.academicyearid} value={y.academicyearid}>{y.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </div>

                <div className="space-y-1.5">
                    <Label>{t.nav.terms}</Label>
                    <SelectRoot value={selTerm} onValueChange={v => setSelTerm(v ?? '')}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                            <SelectValue>
                                {selTerm ? (terms.find((term: any) => term.termid === selTerm)?.name ?? gb.allTerms) : gb.allTerms}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{gb.allTerms}</SelectItem>
                            {terms.map((t: any) => (
                                <SelectItem key={t.termid} value={t.termid}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </div>

                <div className="space-y-1.5">
                    <Label>{t.nav.classes} <span className="text-red-500">*</span></Label>
                    <SelectRoot value={selClass} onValueChange={v => setSelClass(v ?? '')}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                            <SelectValue>
                                {selClass ? (classes.find((c: any) => c.classid === selClass)?.classname ?? gb.selectClass) : gb.selectClass}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{gb.selectClass}</SelectItem>
                            {classes.map((c: any) => (
                                <SelectItem key={c.classid} value={c.classid}>{c.classname}</SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </div>

                <div className="space-y-1.5">
                    <Label>{t.nav.subjects} <span className="text-red-500">*</span></Label>
                    <SelectRoot value={selSubject} onValueChange={v => setSelSubject(v ?? '')}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                            <SelectValue>
                                {selSubject ? (subjects.find((s: any) => s.subjectid === selSubject)?.name ?? gb.selectSubject) : gb.selectSubject}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{gb.selectSubject}</SelectItem>
                            {subjects.map((s: any) => (
                                <SelectItem key={s.subjectid} value={s.subjectid}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError('')} className="flex-shrink-0 rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Empty states */}
            {!selClass || !selSubject ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
                    <BookOpenCheck className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium text-slate-500">{gb.selectPrompt}</p>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
                    <BookOpenCheck className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium text-slate-500">{gb.noStudents}</p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-8">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{gb.student}</th>
                                {gradingSystem.components.map(comp => (
                                    <th key={comp.key} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        {comp.label}
                                        <span className="block text-[10px] font-normal text-slate-400 normal-case">{comp.displayWeight}</span>
                                    </th>
                                ))}
                                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {gb.final}
                                    <span className="block text-[10px] font-normal text-slate-400 normal-case">{gradingSystem.gradeLabel}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => {
                                const scoreMap = Object.fromEntries(
                                    gradingSystem.components.map(c => [c.key, row.scores[c.key]?.score ?? null])
                                );
                                const final = gradingSystem.calcFinal(scoreMap);
                                const grade = final !== null ? gradingSystem.getGrade(final) : null;

                                return (
                                    <tr key={row.studentid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-2.5 text-xs text-slate-400">{idx + 1}</td>
                                        <td className="px-4 py-2.5">
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{row.name}</p>
                                            {row.rollnumber && <p className="text-xs text-slate-400">{row.rollnumber}</p>}
                                        </td>
                                        {gradingSystem.components.map(comp => {
                                            const cell = row.scores[comp.key];
                                            return (
                                                <td key={comp.key} className="px-3 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={0.5}
                                                        placeholder="—"
                                                        value={cell?.score ?? ''}
                                                        onChange={e => handleScoreChange(row.studentid, comp.key, e.target.value)}
                                                        className={`w-20 rounded-lg border text-center text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                                                            ${cell?.dirty
                                                                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500'
                                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                            }`}
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-2 text-center">
                                            {grade ? (
                                                <span className={`inline-flex flex-col items-center rounded-lg px-3 py-1 text-xs font-bold ${grade.color}`}>
                                                    <span className="text-base leading-tight">{grade.label}</span>
                                                    <span className="font-normal opacity-75">{gradingSystem.displayScore(final!)}</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Formula footer */}
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        {gradingSystem.formulaLines.map((line, i) => (
                            <span key={i} className={i === 0 ? 'font-semibold text-slate-700 dark:text-slate-300' : ''}>{line}</span>
                        ))}
                        <span className="ml-auto text-slate-400">{gradingSystem.scaleLabel}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
