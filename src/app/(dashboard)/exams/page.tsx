'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, FileText, ClipboardCheck, CheckCircle2, XCircle, MapPin, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/Modal';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { AISummary } from '@/components/ui/AISummary';
import { examsAPI, examResultsAPI, academicYearsAPI, studentsAPI, classesAPI, subjectsAPI, termsAPI } from '@/lib/api-client';
import type { Exam } from '@/lib/dataverse/exams';
import type { ExamResult } from '@/lib/dataverse/examresults';
import type { AcademicYear } from '@/lib/dataverse/academicyears';
import { EXAM_TYPES } from '@/lib/dataverse/exams';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentOption { id: string; name: string; }
interface Option        { id: string; name: string; }

// ─── Exam form schema ─────────────────────────────────────────────────────────
const examSchema = z.object({
    name:           z.string().min(1, 'Required'),
    examcode:       z.string().optional(),
    examtype:       z.coerce.number().min(1),
    startdate:      z.string().min(1, 'Required'),
    enddate:        z.string().min(1, 'Required'),
    totalmarks:     z.coerce.number().optional(),
    passmarks:      z.coerce.number().optional(),
    venue:          z.string().optional(),
    weightpercent:  z.coerce.number().optional(),
    academicyearid: z.string().optional(),
    classid:        z.string().optional(),
    subjectid:      z.string().optional(),
    termid:         z.string().optional(),
});
type ExamFormData = z.infer<typeof examSchema>;

// ─── Result form schema ───────────────────────────────────────────────────────
const resultSchema = z.object({
    examid:      z.string().min(1, 'Required'),
    studentid:   z.string().min(1, 'Required'),
    score:       z.coerce.number().min(0, 'Required'),
    gradeletter: z.string().optional(),
    remarks:     z.string().optional(),
});
type ResultFormData = z.infer<typeof resultSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EXAM_TYPE_VARIANT: Record<number, 'default' | 'success' | 'warning' | 'destructive'> = {
    1: 'default', 2: 'warning', 3: 'destructive', 4: 'success',
};

function gradeVariant(pct: number | null): 'success' | 'warning' | 'destructive' | 'default' {
    if (pct === null) return 'default';
    if (pct >= 75) return 'success';
    if (pct >= 50) return 'warning';
    return 'destructive';
}

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-slate-700 dark:text-slate-300 text-sm font-medium">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ─── Exam form ────────────────────────────────────────────────────────────────
function ExamForm({ defaultValues, academicYears, classes, subjects, terms, onSubmit, onCancel }: {
    defaultValues?: Partial<ExamFormData>;
    academicYears: AcademicYear[];
    classes:  Option[];
    subjects: Option[];
    terms:    Option[];
    onSubmit: (d: ExamFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExamFormData>({
        resolver: zodResolver(examSchema) as never,
        defaultValues: { examtype: 3, ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Row 1: name + code */}
            <div className="grid grid-cols-2 gap-3">
                <F id="name" label="Exam Name *" error={errors.name?.message}>
                    <Input id="name" {...register('name')} placeholder="e.g. Term 1 Final" />
                </F>
                <F id="examcode" label="Code">
                    <Input id="examcode" {...register('examcode')} placeholder="e.g. EXAM-001" />
                </F>
            </div>
            {/* Row 2: type + academic year */}
            <div className="grid grid-cols-2 gap-3">
                <F id="examtype" label="Type *" error={errors.examtype?.message}>
                    <select id="examtype" {...register('examtype')}
                        className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500">
                        {Object.entries(EXAM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </F>
                <F id="academicyearid" label="Academic Year">
                    <select id="academicyearid" {...register('academicyearid')}
                        className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500">
                        <option value="">— None —</option>
                        {academicYears.map(ay => <option key={ay.academicyearid} value={ay.academicyearid}>{ay.name}</option>)}
                    </select>
                </F>
            </div>
            {/* Row 3: term + class */}
            <div className="grid grid-cols-2 gap-3">
                <F id="termid" label="Term">
                    <Controller name="termid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">— None —</SelectItem>
                                {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="classid" label="Class">
                    <Controller name="classid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">— None —</SelectItem>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
            </div>
            {/* Row 4: subject + venue */}
            <div className="grid grid-cols-2 gap-3">
                <F id="subjectid" label="Subject">
                    <Controller name="subjectid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">— None —</SelectItem>
                                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
                <F id="venue" label="Venue">
                    <Input id="venue" {...register('venue')} placeholder="e.g. Main Hall" />
                </F>
            </div>
            {/* Row 5: dates */}
            <div className="grid grid-cols-2 gap-3">
                <F id="startdate" label="Start Date *" error={errors.startdate?.message}>
                    <Input id="startdate" type="date" {...register('startdate')} />
                </F>
                <F id="enddate" label="End Date *" error={errors.enddate?.message}>
                    <Input id="enddate" type="date" {...register('enddate')} />
                </F>
            </div>
            {/* Row 6: marks */}
            <div className="grid grid-cols-3 gap-3">
                <F id="totalmarks" label="Total Marks">
                    <Input id="totalmarks" type="number" min={0} step="0.01" {...register('totalmarks')} placeholder="e.g. 100" />
                </F>
                <F id="passmarks" label="Pass Marks">
                    <Input id="passmarks" type="number" min={0} step="0.01" {...register('passmarks')} placeholder="e.g. 50" />
                </F>
                <F id="weightpercent" label="Weight (%)">
                    <Input id="weightpercent" type="number" min={0} max={100} step="0.1" {...register('weightpercent')} placeholder="e.g. 30" />
                </F>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Exam'}</Button>
            </div>
        </form>
    );
}

// ─── Result form ──────────────────────────────────────────────────────────────
function ResultForm({ defaultValues, exams, students, onSubmit, onCancel }: {
    defaultValues?: Partial<ResultFormData>;
    exams: Exam[];
    students: StudentOption[];
    onSubmit: (d: ResultFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResultFormData>({
        resolver: zodResolver(resultSchema) as never,
        defaultValues: { score: 0, ...defaultValues },
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <F id="examid" label="Exam *" error={errors.examid?.message}>
                <Controller name="examid" control={control} render={({ field }) => (
                    <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger id="examid"><SelectValue placeholder="— Select Exam —" /></SelectTrigger>
                        <SelectContent>
                            {exams.map(e => <SelectItem key={e.examid} value={e.examid}>{e.name}</SelectItem>)}
                        </SelectContent>
                    </SelectRoot>
                )} />
            </F>

            <F id="studentid" label="Student *" error={errors.studentid?.message}>
                <Controller name="studentid" control={control} render={({ field }) => (
                    <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger id="studentid"><SelectValue placeholder="— Select Student —" /></SelectTrigger>
                        <SelectContent>
                            {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </SelectRoot>
                )} />
            </F>

            <div className="grid grid-cols-2 gap-3">
                <F id="score" label="Score *" error={errors.score?.message}>
                    <Input id="score" type="number" step="0.01" min="0" {...register('score')} />
                </F>
                <F id="gradeletter" label="Grade Letter">
                    <Input id="gradeletter" {...register('gradeletter')} placeholder="e.g. A, B+, C" />
                </F>
            </div>
            <F id="remarks" label="Remarks">
                <Input id="remarks" {...register('remarks')} placeholder="Optional" />
            </F>

            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                Percentage and pass/fail status are calculated automatically by the system based on the exam&apos;s total marks.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Result'}</Button>
            </div>
        </form>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ExamsPage() {
    const [tab, setTab]         = useState<'exams' | 'results'>('exams');
    const [exams, setExams]     = useState<Exam[]>([]);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [filteredExams, setFilteredExams]     = useState<Exam[]>([]);
    const [filteredResults, setFilteredResults] = useState<ExamResult[]>([]);
    const [academicYears, setAcademicYears]     = useState<AcademicYear[]>([]);
    const [students, setStudents]               = useState<StudentOption[]>([]);
    const [classes,  setClasses]                = useState<Option[]>([]);
    const [subjects, setSubjects]               = useState<Option[]>([]);
    const [terms,    setTerms]                  = useState<Option[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');

    const [examModal, setExamModal]         = useState(false);
    const [editingExam, setEditingExam]     = useState<Exam | null>(null);
    const [deleteExam, setDeleteExam]       = useState<string | null>(null);
    const [resultModal, setResultModal]     = useState(false);
    const [editingResult, setEditingResult] = useState<ExamResult | null>(null);
    const [deleteResult, setDeleteResult]   = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [examRes, resultRes, ayRes]: any[] = await Promise.all([
                examsAPI.getAll(),
                examResultsAPI.getAll(),
                academicYearsAPI.getAll(),
            ]);
            setExams(examRes.data ?? []);
            setFilteredExams(examRes.data ?? []);
            setResults(resultRes.data ?? []);
            setFilteredResults(resultRes.data ?? []);
            setAcademicYears(ayRes.data ?? []);
        } catch {
            toast.error('Failed to load exams data');
        } finally {
            setLoading(false);
        }
    };

    const loadDropdowns = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [sRes, cRes, subRes, tRes]: any[] = await Promise.all([
                studentsAPI.getAll(),
                classesAPI.getAll(),
                subjectsAPI.getAll(),
                termsAPI.getAll(),
            ]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setStudents((sRes.data ?? []).map((s: any) => ({ id: s.studentid, name: `${s.firstname} ${s.lastname}` })));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setClasses((cRes.data ?? []).map((c: any) => ({ id: c.classid, name: c.name })));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setSubjects((subRes.data ?? []).map((s: any) => ({ id: s.subjectid, name: s.name })));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setTerms((tRes.data ?? []).map((t: any) => ({ id: t.termid, name: t.name })));
        } catch { /* non-fatal */ }
    };

    useEffect(() => { load(); loadDropdowns(); }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        if (tab === 'exams') {
            let list = exams;
            if (typeFilter !== 'all') list = list.filter(e => e.examtype === typeFilter);
            setFilteredExams(q ? list.filter(e =>
                `${e.name} ${e.examcode} ${e.academicyearname} ${e.classname} ${e.subjectname} ${e.venue}`
                    .toLowerCase().includes(q)
            ) : list);
        } else {
            setFilteredResults(q ? results.filter(r =>
                `${r.studentname} ${r.examname} ${r.gradeletter}`
                    .toLowerCase().includes(q)
            ) : results);
        }
    }, [search, tab, typeFilter, exams, results]);

    const switchTab = (t: 'exams' | 'results') => { setTab(t); setSearch(''); setTypeFilter('all'); };

    const handleExamSubmit = async (data: ExamFormData) => {
        try {
            if (editingExam) { await examsAPI.update(editingExam.examid, data); toast.success('Exam updated'); }
            else             { await examsAPI.create(data);                     toast.success('Exam added'); }
            setExamModal(false); setEditingExam(null); load();
        } catch { toast.error('Failed to save exam'); }
    };

    const handleExamDelete = async (id: string) => {
        try { await examsAPI.delete(id); toast.success('Exam deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    const handleResultSubmit = async (data: ResultFormData) => {
        try {
            if (editingResult) { await examResultsAPI.update(editingResult.examresultid, data); toast.success('Result updated'); }
            else               { await examResultsAPI.create(data);                             toast.success('Result recorded'); }
            setResultModal(false); setEditingResult(null); load();
        } catch { toast.error('Failed to save result'); }
    };

    const handleResultDelete = async (id: string) => {
        try { await examResultsAPI.delete(id); toast.success('Result deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    // Parse date-only strings (YYYY-MM-DD) as local time to avoid UTC offset shifting the day
    const formatDate = (d: string) => {
        if (!d) return '—';
        const [y, m, day] = d.slice(0, 10).split('-').map(Number);
        return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Exams</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Loading…' : (() => {
                            const counts = [1,2,3,4].map(t => exams.filter(e => e.examtype === t).length);
                            const parts = [
                                counts[0] && `${counts[0]} quiz${counts[0] !== 1 ? 'zes' : ''}`,
                                counts[1] && `${counts[1]} midterm${counts[1] !== 1 ? 's' : ''}`,
                                counts[2] && `${counts[2]} final${counts[2] !== 1 ? 's' : ''}`,
                                counts[3] && `${counts[3]} practical${counts[3] !== 1 ? 's' : ''}`,
                            ].filter(Boolean);
                            return `${exams.length} exam${exams.length !== 1 ? 's' : ''}${parts.length ? ' · ' + parts.join(' · ') : ''}`;
                        })()}
                    </p>
                </div>
                {tab === 'exams' ? (
                    <Button onClick={() => { setEditingExam(null); setExamModal(true); }}>
                        <Plus className="h-4 w-4 mr-1.5" /> Add Exam
                    </Button>
                ) : (
                    <Button onClick={() => { setEditingResult(null); setResultModal(true); }}>
                        <Plus className="h-4 w-4 mr-1.5" /> Add Result
                    </Button>
                )}
            </div>

            <AISummary type="exams" getData={() => ({ total: exams.length, exams, results })} />

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-1">
                    {(['exams', 'results'] as const).map(t => (
                        <button key={t} onClick={() => switchTab(t)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                tab === t
                                    ? 'border-violet-600 text-violet-700 dark:text-violet-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}>
                            {t === 'exams' ? 'Exams' : 'Exam Results'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Type filter pills — exams tab only */}
            {tab === 'exams' && (
                <div className="flex gap-2 flex-wrap">
                    {([['all', 'All'] as const, [1, 'Quiz'] as const, [2, 'Midterm'] as const, [3, 'Final'] as const, [4, 'Practical'] as const]).map(([val, label]) => {
                        const count = val === 'all' ? exams.length : exams.filter(e => e.examtype === val).length;
                        return (
                            <button key={val} onClick={() => setTypeFilter(val)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    typeFilter === val
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}>
                                {label}{count > 0 && <span className={`ml-1 ${typeFilter === val ? 'opacity-80' : 'opacity-60'}`}>({count})</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder={tab === 'exams' ? 'Search exams…' : 'Search by student, exam, grade…'}
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-violet-600" />
                </div>
            ) : tab === 'exams' ? (
                /* ── Exams table ── */
                !filteredExams.length ? (
                    <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                            <FileText className="h-7 w-7 opacity-50" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {search ? 'No exams match your search' : 'No exams yet'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-left">
                                    {['Exam', 'Type', 'Class / Subject', 'Academic Year', 'Dates', 'Marks', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredExams.map(e => (
                                    <tr key={e.examid} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        {/* Exam name + code */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{e.name}</p>
                                                    {e.examcode && (
                                                        <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                                            <Hash className="h-2.5 w-2.5" />{e.examcode}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Type */}
                                        <td className="px-4 py-3">
                                            <Badge variant={EXAM_TYPE_VARIANT[e.examtype] ?? 'default'}>
                                                {EXAM_TYPES[e.examtype] ?? e.examtypename}
                                            </Badge>
                                        </td>
                                        {/* Class / Subject */}
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                                            {e.classname
                                                ? <p className="font-medium">{e.classname}</p>
                                                : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                            {e.subjectname && (
                                                <p className="text-slate-400 dark:text-slate-500 mt-0.5">{e.subjectname}</p>
                                            )}
                                        </td>
                                        {/* Academic Year */}
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                                            {e.academicyearname
                                                ? <span className="inline-block bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">{e.academicyearname}</span>
                                                : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                        </td>
                                        {/* Dates */}
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                            <p>{formatDate(e.startdate)}</p>
                                            {e.enddate !== e.startdate && (
                                                <p className="text-slate-400 dark:text-slate-600 mt-0.5">→ {formatDate(e.enddate)}</p>
                                            )}
                                            {e.venue && (
                                                <p className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500 mt-0.5">
                                                    <MapPin className="h-2.5 w-2.5" />{e.venue}
                                                </p>
                                            )}
                                        </td>
                                        {/* Marks */}
                                        <td className="px-4 py-3 text-xs">
                                            {e.totalmarks !== null ? (
                                                <div className="text-slate-600 dark:text-slate-300">
                                                    <span className="font-medium">{e.totalmarks}</span>
                                                    <span className="text-slate-400"> total</span>
                                                    {e.passmarks !== null && (
                                                        <p className="text-slate-400 dark:text-slate-500 mt-0.5">{e.passmarks} pass</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-600">—</span>
                                            )}
                                        </td>
                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                                    onClick={() => { setEditingExam(e); setExamModal(true); }}>
                                                    <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                                </Button>
                                                <Button variant="ghost" size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => setDeleteExam(e.examid)}>
                                                    <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                /* ── Results table ── */
                !filteredResults.length ? (
                    <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                            <ClipboardCheck className="h-7 w-7 opacity-50" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {search ? 'No results match your search' : 'No exam results yet'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-left">
                                    {['Student', 'Exam', 'Score', 'Grade', 'Pass/Fail', 'Remarks', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredResults.map(r => (
                                    <tr key={r.examresultid} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-xs font-bold">
                                                    {r.studentname ? r.studentname.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                {r.studentname || r.studentid.slice(0, 8) + '…'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.examname || '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{r.score}</span>
                                                {r.percentage !== null && (
                                                    <Badge variant={gradeVariant(r.percentage)}>{r.percentage.toFixed(1)}%</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.gradeletter
                                                ? <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{r.gradeletter}</span>
                                                : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.ispassed
                                                ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" />Pass</span>
                                                : <span className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-semibold"><XCircle className="h-3.5 w-3.5" />Fail</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs max-w-[160px] truncate">
                                            {r.remarks || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                                    onClick={() => { setEditingResult(r); setResultModal(true); }}>
                                                    <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                                </Button>
                                                <Button variant="ghost" size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => setDeleteResult(r.examresultid)}>
                                                    <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Exam modal */}
            <Modal isOpen={examModal} onClose={() => { setExamModal(false); setEditingExam(null); }}
                title={editingExam ? 'Edit Exam' : 'Add Exam'}>
                <ExamForm
                    defaultValues={editingExam ? {
                        name:           editingExam.name,
                        examcode:       editingExam.examcode       || undefined,
                        examtype:       editingExam.examtype,
                        startdate:      editingExam.startdate,
                        enddate:        editingExam.enddate,
                        totalmarks:     editingExam.totalmarks     ?? undefined,
                        passmarks:      editingExam.passmarks      ?? undefined,
                        venue:          editingExam.venue          || undefined,
                        weightpercent:  editingExam.weightpercent  ?? undefined,
                        academicyearid: editingExam.academicyearid || undefined,
                        classid:        editingExam.classid        || undefined,
                        subjectid:      editingExam.subjectid      || undefined,
                        termid:         editingExam.termid         || undefined,
                    } : undefined}
                    academicYears={academicYears}
                    classes={classes}
                    subjects={subjects}
                    terms={terms}
                    onSubmit={handleExamSubmit}
                    onCancel={() => { setExamModal(false); setEditingExam(null); }}
                />
            </Modal>

            {/* Result modal */}
            <Modal isOpen={resultModal} onClose={() => { setResultModal(false); setEditingResult(null); }}
                title={editingResult ? 'Edit Result' : 'Add Result'}>
                <ResultForm
                    defaultValues={editingResult ? {
                        examid:      editingResult.examid,
                        studentid:   editingResult.studentid,
                        score:       editingResult.score,
                        gradeletter: editingResult.gradeletter || undefined,
                        remarks:     editingResult.remarks     || undefined,
                    } : undefined}
                    exams={exams}
                    students={students}
                    onSubmit={handleResultSubmit}
                    onCancel={() => { setResultModal(false); setEditingResult(null); }}
                />
            </Modal>

            {/* Delete confirmations */}
            <ConfirmDialog open={!!deleteExam} onOpenChange={o => !o && setDeleteExam(null)}
                title="Delete exam?" description="This will permanently remove the exam and may affect linked results."
                onConfirm={() => { if (deleteExam) { handleExamDelete(deleteExam); setDeleteExam(null); } }}
            />
            <ConfirmDialog open={!!deleteResult} onOpenChange={o => !o && setDeleteResult(null)}
                title="Delete result?" description="This will permanently remove this exam result."
                onConfirm={() => { if (deleteResult) { handleResultDelete(deleteResult); setDeleteResult(null); } }}
            />
        </div>
    );
}
