'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpenCheck, Save, AlertCircle, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { classesAPI, subjectsAPI, termsAPI, academicYearsAPI, gradesAPI, studentsAPI } from '@/lib/api-client';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/contexts/I18nContext';

// ── Ghana GES Grade Scale ────────────────────────────────────────────────────
const GES_GRADES = [
    { min: 80, label: 'A1', color: 'text-emerald-700 bg-emerald-50' },
    { min: 70, label: 'B2', color: 'text-green-700 bg-green-50' },
    { min: 60, label: 'B3', color: 'text-lime-700 bg-lime-50' },
    { min: 55, label: 'C4', color: 'text-yellow-700 bg-yellow-50' },
    { min: 50, label: 'C5', color: 'text-amber-700 bg-amber-50' },
    { min: 45, label: 'C6', color: 'text-orange-700 bg-orange-50' },
    { min: 40, label: 'D7', color: 'text-red-500 bg-red-50' },
    { min: 35, label: 'E8', color: 'text-red-600 bg-red-50' },
    { min: 0,  label: 'F9', color: 'text-red-700 bg-red-100' },
];

function gesGrade(pct: number) {
    return GES_GRADES.find(g => pct >= g.min) ?? GES_GRADES[GES_GRADES.length - 1];
}

// Class score = weighted avg of Classwork(30%) + Homework(20%) + MidTerm(50%) of classwork portion
// End of Term exam = 70% weight
// Final = ClassScore(30%) + EndOfTerm(70%)
function calcFinal(classwork: number | null, homework: number | null, midterm: number | null, endofterm: number | null) {
    const scores = [classwork, homework, midterm].filter(s => s !== null) as number[];
    const classScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    if (classScore === null && endofterm === null) return null;
    const cs = classScore ?? 0;
    const et = endofterm ?? 0;
    return parseFloat((cs * 0.30 + et * 0.70).toFixed(1));
}

type AssessmentCol = 'classwork' | 'homework' | 'midterm' | 'endofterm';
const COLS: { key: AssessmentCol; label: string; type: number; weight: string }[] = [
    { key: 'classwork',  label: 'Classwork',    type: 1, weight: '10%' },
    { key: 'homework',   label: 'Homework',      type: 2, weight: '10%' },
    { key: 'midterm',    label: 'Mid-Term',      type: 4, weight: '10%' },
    { key: 'endofterm',  label: 'End of Term',   type: 5, weight: '70%' },
];

interface StudentRow {
    studentid: string;
    name: string;
    rollnumber: string;
    scores: Record<AssessmentCol, { gradeid?: string; score: number | null; dirty: boolean }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRows(students: any[], grades: any[]): StudentRow[] {
    return students.map(s => {
        const studentGrades = grades.filter((g: any) => g.studentid === s.studentid);
        const scores: StudentRow['scores'] = {
            classwork:  { score: null, dirty: false },
            homework:   { score: null, dirty: false },
            midterm:    { score: null, dirty: false },
            endofterm:  { score: null, dirty: false },
        };
        for (const col of COLS) {
            const g = studentGrades.find((gr: any) => gr.assessmenttype === col.type);
            if (g) scores[col.key] = { gradeid: g.gradeid, score: g.score, dirty: false };
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

    // ── Filters ────────────────────────────────────────────────────────────
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [allTerms,      setAllTerms]      = useState<any[]>([]);
    const [allClasses,    setAllClasses]    = useState<any[]>([]);
    const [subjects,      setSubjects]      = useState<any[]>([]);

    const [selYear,    setSelYear]    = useState('');
    const [selTerm,    setSelTerm]    = useState('');
    const [selClass,   setSelClass]   = useState('');
    const [selSubject, setSelSubject] = useState('');

    // Derived options filtered by selected academic year
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
        }).catch(() => toast.error('Failed to load reference data'));
    }, []);

    // ── Refresh all data ───────────────────────────────────────────────────
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
            toast.error('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    }, []);

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
            const students = studentsRes.data ?? [];
            const grades   = gradesRes.data ?? [];
            setRows(buildRows(students, grades));
        } catch {
            setError('Failed to load gradebook data');
        } finally {
            setLoading(false);
        }
    }, [selClass, selSubject, selTerm]);

    useEffect(() => { loadGradebook(); }, [loadGradebook]);

    // ── Cell edit ──────────────────────────────────────────────────────────
    const handleScoreChange = (studentid: string, col: AssessmentCol, raw: string) => {
        const num = raw === '' ? null : parseFloat(raw);
        if (num !== null && (num < 0 || num > 100)) return;
        setRows(prev => prev.map(r =>
            r.studentid === studentid
                ? { ...r, scores: { ...r.scores, [col]: { ...r.scores[col], score: num, dirty: true } } }
                : r
        ));
    };

    // ── Save all dirty cells ───────────────────────────────────────────────
    const handleSave = async () => {
        const entries: any[] = [];
        for (const row of rows) {
            for (const col of COLS) {
                const cell = row.scores[col.key];
                if (!cell.dirty || cell.score === null) continue;
                entries.push({
                    gradeid:        cell.gradeid,
                    studentid:      row.studentid,
                    subjectid:      selSubject,
                    classid:        selClass,
                    termid:         selTerm || undefined,
                    academicyearid: selYear || undefined,
                    assessmenttype: col.type,
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
            toast.success(`${res.data?.saved ?? entries.length} grades saved`);
            setRows(prev => prev.map(r => ({
                ...r,
                scores: Object.fromEntries(
                    COLS.map(c => [c.key, { ...r.scores[c.key], dirty: false }])
                ) as StudentRow['scores'],
            })));
            loadGradebook();
        } catch {
            toast.error('Failed to save grades');
        } finally {
            setSaving(false);
        }
    };

    const hasDirty = rows.some(r => COLS.some(c => r.scores[c.key].dirty));

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
                        <p className="text-xs text-slate-500">{gb.subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        title="Refresh data"
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
                    <SelectRoot
                        value={selYear}
                        onValueChange={v => { setSelYear(v ?? ''); setSelTerm(''); setSelClass(''); }}
                    >
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                            <SelectValue>
                                {selYear
                                    ? (academicYears.find((y: any) => y.academicyearid === selYear)?.name ?? gb.allYears)
                                    : gb.allYears}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{gb.allYears}</SelectItem>
                            {academicYears.map((y: any) => (
                                <SelectItem key={y.academicyearid} value={y.academicyearid}>
                                    {y.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </div>

                <div className="space-y-1.5">
                    <Label>{t.nav.terms}</Label>
                    <SelectRoot value={selTerm} onValueChange={v => setSelTerm(v ?? '')}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                            <SelectValue>
                                {selTerm
                                    ? (terms.find((term: any) => term.termid === selTerm)?.name ?? gb.allTerms)
                                    : gb.allTerms}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{gb.allTerms}</SelectItem>
                            {terms.map((t: any) => (
                                <SelectItem key={t.termid} value={t.termid}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </div>

                <div className="space-y-1.5">
                    <Label>{t.nav.classes} <span className="text-red-500">*</span></Label>
                    <SelectRoot value={selClass} onValueChange={v => setSelClass(v ?? '')}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                            <SelectValue>
                                {selClass
                                    ? (classes.find((c: any) => c.classid === selClass)?.classname ?? gb.selectClass)
                                    : gb.selectClass}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{gb.selectClass}</SelectItem>
                            {classes.map((c: any) => (
                                <SelectItem key={c.classid} value={c.classid}>
                                    {c.classname}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </div>

                <div className="space-y-1.5">
                    <Label>{t.nav.subjects} <span className="text-red-500">*</span></Label>
                    <SelectRoot value={selSubject} onValueChange={v => setSelSubject(v ?? '')}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                            <SelectValue>
                                {selSubject
                                    ? (subjects.find((s: any) => s.subjectid === selSubject)?.name ?? gb.selectSubject)
                                    : gb.selectSubject}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{gb.selectSubject}</SelectItem>
                            {subjects.map((s: any) => (
                                <SelectItem key={s.subjectid} value={s.subjectid}>
                                    {s.name}
                                </SelectItem>
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

            {/* Prompt if no class/subject selected */}
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
                                {COLS.map(c => (
                                    <th key={c.key} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        {c.label}
                                        <span className="block text-[10px] font-normal text-slate-400 normal-case">{c.weight}</span>
                                    </th>
                                ))}
                                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {gb.final}
                                    <span className="block text-[10px] font-normal text-slate-400 normal-case">{gb.gesGrade}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {rows.map((row, idx) => {
                                const final = calcFinal(
                                    row.scores.classwork.score,
                                    row.scores.homework.score,
                                    row.scores.midterm.score,
                                    row.scores.endofterm.score,
                                );
                                const grade = final !== null ? gesGrade(final) : null;

                                return (
                                    <tr key={row.studentid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-2.5 text-xs text-slate-400">{idx + 1}</td>
                                        <td className="px-4 py-2.5">
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{row.name}</p>
                                            {row.rollnumber && <p className="text-xs text-slate-400">{row.rollnumber}</p>}
                                        </td>
                                        {COLS.map(col => {
                                            const cell = row.scores[col.key];
                                            return (
                                                <td key={col.key} className="px-3 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={0.5}
                                                        placeholder="—"
                                                        value={cell.score ?? ''}
                                                        onChange={e => handleScoreChange(row.studentid, col.key, e.target.value)}
                                                        className={`w-20 rounded-lg border text-center text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                                                            ${cell.dirty
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
                                                    <span className="font-normal opacity-75">{final}%</span>
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

                    {/* GES formula footer */}
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{gb.gesFormula}</span>
                        <span>{gb.gesFormulaClass}</span>
                        <span>{gb.gesFormulaExam}</span>
                        <span>{gb.gesFormulaFinal}</span>
                        <span className="ml-auto text-slate-400">{gb.gesScale}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
