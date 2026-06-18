'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Printer, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { reportsAPI } from '@/lib/api-client';

const GES_GRADE_COLORS: Record<string, string> = {
    A1: 'text-emerald-700', B2: 'text-green-700', B3: 'text-lime-700',
    C4: 'text-yellow-700',  C5: 'text-amber-700', C6: 'text-orange-600',
    D7: 'text-red-500',     E8: 'text-red-600',   F9: 'text-red-700',
};

export default function ReportCardPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const searchParams  = useSearchParams();
    const termId        = searchParams.get('termId') ?? '';

    const [data,    setData]    = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    // Editable remarks
    const [teacherRemarks,    setTeacherRemarks]    = useState('');
    const [principalRemarks,  setPrincipalRemarks]  = useState('');

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        reportsAPI.getReportCard(studentId, termId).then((res: any) => {
            if (res.success) {
                setData(res.data);
            } else {
                setError(res.error ?? 'Failed to load report card');
            }
        }).catch(() => setError('Failed to load report card')).finally(() => setLoading(false));
    }, [studentId, termId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Link href="/reports/report-card" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-4 w-4" /> Back to selector
                </Link>
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { student, school, subjectRows, summary } = data;
    const printDate = new Date().toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' });

    const schoolName    = school?.name || 'SchoolMS Academy';
    const schoolAddress = [school?.address, school?.region].filter(Boolean).join(', ');
    const schoolInitial = (school?.name || 'S').trim().charAt(0).toUpperCase();

    return (
        <div className="space-y-4">
            {/* Toolbar — hidden on print */}
            <div className="no-print flex items-center justify-between">
                <Link href="/reports/report-card" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Link>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                    <Printer className="h-4 w-4" />
                    Print / Save as PDF
                </button>
            </div>

            {/* Report card — printable */}
            <div className="print-area rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 p-8 max-w-3xl mx-auto">

                {/* School header */}
                <div className="text-center border-b border-slate-200 pb-4 mb-6">
                    <div className="flex justify-center mb-2">
                        {school?.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={school.logo} alt={schoolName} className="h-14 w-14 rounded-full object-cover" />
                        ) : (
                            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">{schoolInitial}</div>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">{schoolName}</h1>
                    {schoolAddress && <p className="text-sm text-slate-500 mt-0.5">{schoolAddress}</p>}
                    {school?.motto && <p className="text-xs italic text-slate-400 mt-0.5">{school.motto}</p>}
                    <h2 className="mt-3 text-base font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Terminal Report Card</h2>
                </div>

                {/* Student info */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="space-y-2">
                        <Row label="Student Name" value={student.fullname || `${student.firstname} ${student.lastname}`} />
                        <Row label="Roll Number"  value={student.rollnumber || '—'} />
                        <Row label="Class"        value={student.classname || '—'} />
                    </div>
                    <div className="space-y-2">
                        <Row label="Date Printed" value={printDate} />
                        <Row label="Total Subjects" value={String(summary.totalSubjects)} />
                        <Row label="Overall Average" value={summary.average !== null ? `${summary.average}%` : '—'} />
                    </div>
                </div>

                {/* Subjects table */}
                <div className="mb-6 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase">
                                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left">Subject</th>
                                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center">Class Score<br /><span className="font-normal normal-case text-[10px]">(30%)</span></th>
                                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center">Exam Score<br /><span className="font-normal normal-case text-[10px]">(70%)</span></th>
                                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center">Total<br /><span className="font-normal normal-case text-[10px]">(100%)</span></th>
                                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center">Grade</th>
                                <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjectRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="border border-slate-200 dark:border-slate-700 px-3 py-6 text-center text-slate-400 text-xs">
                                        No grade data available for this term
                                    </td>
                                </tr>
                            ) : subjectRows.map((row: any, i: number) => (
                                <tr key={row.subjectid} className={i % 2 === 0 ? '' : 'bg-slate-50 dark:bg-slate-800/30'}>
                                    <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 font-medium">
                                        {row.subjectname}
                                        {row.subjectcode && <span className="ml-1 text-xs text-slate-400">({row.subjectcode})</span>}
                                    </td>
                                    <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center">
                                        {row.classScore !== null ? row.classScore : '—'}
                                    </td>
                                    <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center">
                                        {row.examScore !== null ? row.examScore : '—'}
                                    </td>
                                    <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center font-semibold">
                                        {row.finalScore !== null ? row.finalScore : '—'}
                                    </td>
                                    <td className={`border border-slate-200 dark:border-slate-700 px-3 py-2 text-center font-bold ${GES_GRADE_COLORS[row.grade] ?? ''}`}>
                                        {row.grade ?? <span className="text-xs font-normal italic text-slate-400">Pending</span>}
                                    </td>
                                    <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center text-xs text-slate-500">
                                        {row.grade === 'A1' || row.grade === 'B2' ? 'Excellent' :
                                         row.grade === 'B3' || row.grade === 'C4' ? 'Good' :
                                         row.grade === 'C5' || row.grade === 'C6' ? 'Average' :
                                         row.grade === 'D7' ? 'Below Average' :
                                         row.grade === 'E8' || row.grade === 'F9' ? 'Fail' : 'Awaiting exam'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {subjectRows.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-100 dark:bg-slate-800 font-semibold text-sm">
                                    <td className="border border-slate-200 dark:border-slate-700 px-3 py-2" colSpan={3}>
                                        Overall Average
                                        {summary.subjectsScored < summary.totalSubjects && (
                                            <span className="ml-1 text-xs font-normal text-slate-400">({summary.subjectsScored} of {summary.totalSubjects} scored)</span>
                                        )}
                                    </td>
                                    <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-center">{summary.average ?? '—'}</td>
                                    <td className={`border border-slate-200 dark:border-slate-700 px-3 py-2 text-center font-bold ${GES_GRADE_COLORS[summary.overallGrade] ?? ''}`}>
                                        {summary.overallGrade ?? '—'}
                                    </td>
                                    <td className="border border-slate-200 dark:border-slate-700 px-3 py-2" />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Grade scale key */}
                <div className="mb-6 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-xs text-slate-500 flex flex-wrap gap-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">GES Grade Scale:</span>
                    {[['A1','80-100'],['B2','70-79'],['B3','60-69'],['C4','55-59'],['C5','50-54'],['C6','45-49'],['D7','40-44'],['E8','35-39'],['F9','0-34']].map(([g, r]) => (
                        <span key={g}><strong className={GES_GRADE_COLORS[g]}>{g}</strong>: {r}</span>
                    ))}
                </div>

                {/* Remarks — editable but hides the textareas on print */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Class Teacher&apos;s Remarks</p>
                        <textarea
                            value={teacherRemarks}
                            onChange={e => setTeacherRemarks(e.target.value)}
                            rows={3}
                            placeholder="Enter remarks here…"
                            className="no-print w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <p className="print-only hidden text-sm text-slate-700 min-h-[60px] border-b border-slate-300 pb-2">{teacherRemarks || ' '}</p>
                        <div className="mt-3">
                            <p className="text-xs text-slate-400">Signature: ___________________</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Headmaster / Principal&apos;s Remarks</p>
                        <textarea
                            value={principalRemarks}
                            onChange={e => setPrincipalRemarks(e.target.value)}
                            rows={3}
                            placeholder="Enter remarks here…"
                            className="no-print w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <p className="print-only hidden text-sm text-slate-700 min-h-[60px] border-b border-slate-300 pb-2">{principalRemarks || ' '}</p>
                        <div className="mt-3">
                            <p className="text-xs text-slate-400">Signature: ___________________</p>
                        </div>
                    </div>
                </div>

                {/* School stamp area */}
                <div className="pt-4 text-center text-xs text-slate-400">
                    <p>School Stamp: _________________</p>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-2">
            <span className="text-slate-500 min-w-[110px]">{label}:</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
        </div>
    );
}
