'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Search } from 'lucide-react';
import { academicYearsAPI, termsAPI, classesAPI, studentsAPI } from '@/lib/api-client';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/contexts/I18nContext';

export default function ReportCardSelectorPage() {
    const router = useRouter();
    const { t } = useI18n();
    const rc = t.reportCard;

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [terms,         setTerms]         = useState<any[]>([]);
    const [allClasses,    setAllClasses]    = useState<any[]>([]);
    const [students,      setStudents]      = useState<any[]>([]);

    const [selYear,    setSelYear]    = useState('');
    const [selTerm,    setSelTerm]    = useState('');
    const [selClass,   setSelClass]   = useState('');
    const [selStudent, setSelStudent] = useState('');
    const [loading,    setLoading]    = useState(false);

    // Classes filtered client-side by selected academic year
    const classes = selYear ? allClasses.filter((c: any) => c.academicyearid === selYear) : allClasses;

    // Load academic years and all classes once
    useEffect(() => {
        Promise.all([
            academicYearsAPI.getAll(),
            classesAPI.getAll(),
        ]).then(([yr, cl]: any[]) => {
            setAcademicYears(yr.data ?? []);
            setAllClasses(cl.data ?? []);
        });
    }, []);

    // Reload terms from server whenever the selected year changes
    useEffect(() => {
        setSelTerm('');
        termsAPI.getAll(undefined, selYear || undefined).then((r: any) => {
            setTerms(r.data ?? []);
        });
    }, [selYear]);

    useEffect(() => {
        if (!selClass) { setStudents([]); setSelStudent(''); return; }
        setLoading(true);
        studentsAPI.getAll({ classid: selClass }).then((r: any) => {
            setStudents(r.data ?? []);
        }).finally(() => setLoading(false));
    }, [selClass]);

    const canGenerate = selStudent && selTerm;

    const handleGenerate = () => {
        if (!canGenerate) return;
        router.push(`/reports/report-card/${selStudent}?termId=${selTerm}`);
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{rc.title}</h1>
                    <p className="text-xs text-slate-500">{rc.subtitle}</p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{rc.selectParams}</p>

                <div className="grid grid-cols-2 gap-4">
                    {/* Academic Year */}
                    <div className="space-y-1.5">
                        <Label>Academic Year <span className="text-red-500">*</span></Label>
                        <SelectRoot
                            value={selYear}
                            onValueChange={v => { setSelYear(v ?? ''); setSelTerm(''); setSelClass(''); setSelStudent(''); }}
                        >
                            <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                                <SelectValue>
                                    {selYear
                                        ? (academicYears.find((y: any) => y.academicyearid === selYear)?.name ?? 'Select Year')
                                        : 'Select Year'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Select Year</SelectItem>
                                {academicYears.map((y: any) => (
                                    <SelectItem key={y.academicyearid} value={y.academicyearid}>{y.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    </div>

                    {/* Term */}
                    <div className="space-y-1.5">
                        <Label>Term <span className="text-red-500">*</span></Label>
                        <SelectRoot
                            value={selTerm}
                            onValueChange={v => setSelTerm(v ?? '')}
                            disabled={!selYear}
                        >
                            <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <SelectValue>
                                    {!selYear
                                        ? rc.selectYearFirst
                                        : selTerm
                                            ? (terms.find((t: any) => t.termid === selTerm)?.name ?? rc.selectTerm)
                                            : rc.selectTerm}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">{rc.selectTerm}</SelectItem>
                                {terms.map((t: any) => (
                                    <SelectItem key={t.termid} value={t.termid}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    </div>

                    {/* Class */}
                    <div className="space-y-1.5">
                        <Label>Class <span className="text-red-500">*</span></Label>
                        <SelectRoot
                            value={selClass}
                            onValueChange={v => { setSelClass(v ?? ''); setSelStudent(''); }}
                        >
                            <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                                <SelectValue>
                                    {selClass
                                        ? (classes.find((c: any) => c.classid === selClass)?.classname ?? rc.selectClass)
                                        : rc.selectClass}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">{rc.selectClass}</SelectItem>
                                {classes.map((c: any) => (
                                    <SelectItem key={c.classid} value={c.classid}>{c.classname}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    </div>

                    {/* Student */}
                    <div className="space-y-1.5">
                        <Label>Student <span className="text-red-500">*</span></Label>
                        <SelectRoot
                            value={selStudent}
                            onValueChange={v => setSelStudent(v ?? '')}
                            disabled={!selClass || loading}
                        >
                            <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <SelectValue>
                                    {!selClass
                                        ? rc.selectClassFirst
                                        : loading
                                            ? t.common.loading
                                            : selStudent
                                                ? (() => {
                                                    const s = students.find((s: any) => s.studentid === selStudent);
                                                    if (!s) return rc.selectStudent;
                                                    const name = s.fullname || `${s.firstname} ${s.lastname}`.trim();
                                                    return s.rollnumber ? `${name} (${s.rollnumber})` : name;
                                                })()
                                                : rc.selectStudent}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">{loading ? t.common.loading : rc.selectStudent}</SelectItem>
                                {students.map((s: any) => {
                                    const name = s.fullname || `${s.firstname} ${s.lastname}`.trim();
                                    return (
                                        <SelectItem key={s.studentid} value={s.studentid}>
                                            {name}{s.rollnumber ? ` (${s.rollnumber})` : ''}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </SelectRoot>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Search className="h-4 w-4" />
                        {rc.generate}
                    </button>
                    {!selTerm && (
                        <p className="mt-2 text-xs text-slate-400">{rc.selectYearAndTerm}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
