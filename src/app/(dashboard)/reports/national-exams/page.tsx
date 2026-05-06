'use client';

import { useEffect, useState, useMemo } from 'react';
import { Award, BookOpen, Trophy, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { academicYearsAPI, termsAPI, classesAPI, gradesAPI } from '@/lib/api-client';

const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

// GES grade → numeric aggregate point (A1=1 best, F9=9 worst)
function gradeToAggregate(score: number | null): number {
  if (score === null) return 9;
  if (score >= 80) return 1; // A1
  if (score >= 70) return 2; // B2
  if (score >= 60) return 3; // B3
  if (score >= 55) return 4; // C4
  if (score >= 50) return 5; // C5
  if (score >= 45) return 6; // C6
  if (score >= 40) return 7; // D7
  if (score >= 35) return 8; // E8
  return 9;                   // F9
}

function scoreToGrade(score: number | null): { label: string; color: string } {
  if (score === null) return { label: '—', color: 'text-slate-400' };
  if (score >= 80) return { label: 'A1', color: 'text-emerald-700 dark:text-emerald-400' };
  if (score >= 70) return { label: 'B2', color: 'text-green-700 dark:text-green-400' };
  if (score >= 60) return { label: 'B3', color: 'text-lime-700 dark:text-lime-400' };
  if (score >= 55) return { label: 'C4', color: 'text-yellow-700 dark:text-yellow-400' };
  if (score >= 50) return { label: 'C5', color: 'text-amber-700 dark:text-amber-400' };
  if (score >= 45) return { label: 'C6', color: 'text-orange-700 dark:text-orange-400' };
  if (score >= 40) return { label: 'D7', color: 'text-red-500 dark:text-red-400' };
  if (score >= 35) return { label: 'E8', color: 'text-red-600 dark:text-red-400' };
  return { label: 'F9', color: 'text-red-700 dark:text-red-400' };
}

function aggregateColor(agg: number): string {
  if (agg <= 12) return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300';
  if (agg <= 18) return 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300';
  if (agg <= 24) return 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300';
  if (agg <= 36) return 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300';
  return 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300';
}

function aggregateLabel(agg: number): string {
  if (agg <= 12) return 'Excellent';
  if (agg <= 18) return 'Very Good';
  if (agg <= 24) return 'Good';
  if (agg <= 36) return 'Average';
  return 'Below Average';
}

interface SubjectScore {
  subjectname: string;
  score: number | null;
  grade: string;
  point: number;
}

interface StudentResult {
  studentid:   string;
  studentname: string;
  scores:      SubjectScore[];
  best6Points: number;
  totalSubs:   number;
  rank?:       number;
}

export default function NationalExamsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [years, setYears]         = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [terms, setTerms]         = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classes, setClasses]     = useState<any[]>([]);
  const [yearId, setYearId]       = useState('');
  const [termId, setTermId]       = useState('');
  const [classId, setClassId]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState<StudentResult[]>([]);
  const [examType, setExamType]   = useState<'bece' | 'wassce'>('bece');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    academicYearsAPI.getAll().then((r: any) => setYears(r.data ?? [])).catch(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    classesAPI.getAll().then((r: any) => setClasses(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!yearId) { setTerms([]); setTermId(''); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    termsAPI.getAll(undefined, yearId).then((r: any) => setTerms(r.data ?? [])).catch(() => {});
    setTermId('');
  }, [yearId]);

  const calculate = async () => {
    if (!classId || !termId) return;
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r: any = await gradesAPI.getAll({ classid: classId, termid: termId });
      const grades: { studentid: string; studentname: string; subjectname: string; finalscore: number | null }[] =
        (r.data ?? []).map((g: any) => ({
          studentid:   g.studentid   ?? g._sms_student_value ?? '',
          studentname: g.studentname ?? '',
          subjectname: g.subjectname ?? '',
          finalscore:  g.finalscore  ?? g.score ?? null,
        }));

      // Group by student
      const studentMap = new Map<string, StudentResult>();
      for (const g of grades) {
        if (!studentMap.has(g.studentid)) {
          studentMap.set(g.studentid, { studentid: g.studentid, studentname: g.studentname, scores: [], best6Points: 0, totalSubs: 0 });
        }
        const entry = studentMap.get(g.studentid)!;
        const point = gradeToAggregate(g.finalscore);
        const gr    = scoreToGrade(g.finalscore);
        entry.scores.push({ subjectname: g.subjectname, score: g.finalscore, grade: gr.label, point });
      }

      // Calculate best 6 aggregate (BECE style: sum of lowest 6 point values = best grades)
      const processed: StudentResult[] = Array.from(studentMap.values()).map(s => {
        const sorted    = [...s.scores].sort((a, b) => a.point - b.point);
        const best6     = sorted.slice(0, 6);
        const best6pts  = best6.reduce((sum, x) => sum + x.point, 0);
        return { ...s, best6Points: best6pts, totalSubs: s.scores.length };
      });

      // Rank by best6 aggregate (lower is better)
      processed.sort((a, b) => a.best6Points - b.best6Points);
      processed.forEach((s, i) => { s.rank = i + 1; });

      setResults(processed);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const allSubjects = useMemo(() => {
    const names = new Set<string>();
    results.forEach(r => r.scores.forEach(s => names.add(s.subjectname)));
    return Array.from(names).sort();
  }, [results]);

  const passRate = useMemo(() => {
    if (!results.length) return null;
    const passed = results.filter(r => r.best6Points <= 36).length;
    return Math.round((passed / results.length) * 100);
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">National Exams</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          BECE / WASSCE aggregate calculator and class performance report
        </p>
      </div>

      {/* Exam type tabs */}
      <div className="flex gap-2">
        {(['bece', 'wassce'] as const).map(t => (
          <button
            key={t}
            onClick={() => setExamType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${examType === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
        <span className="flex items-center ml-2 text-xs text-slate-400 dark:text-slate-500">
          {examType === 'bece' ? 'JHS 3 — Basic Education Certificate' : 'SHS 3 — West Africa Senior Secondary Certificate'}
        </span>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Select Parameters</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Academic Year</label>
            <SelectRoot value={yearId} onValueChange={v => setYearId(v ?? '')}>
              <SelectTrigger className={ST}><SelectValue>{yearId ? years.find(y => y.academicyearid === yearId)?.name ?? 'Year' : 'Select Year'}</SelectValue></SelectTrigger>
              <SelectContent>
                {years.map((y: any) => <SelectItem key={y.academicyearid} value={y.academicyearid}>{y.name}</SelectItem>)}
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Term</label>
            <SelectRoot value={termId} onValueChange={v => setTermId(v ?? '')} disabled={!yearId}>
              <SelectTrigger className={ST}><SelectValue>{termId ? terms.find((t: any) => t.termid === termId)?.name ?? 'Term' : 'Select Term'}</SelectValue></SelectTrigger>
              <SelectContent>
                {terms.map((t: any) => <SelectItem key={t.termid} value={t.termid}>{t.name}</SelectItem>)}
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Class</label>
            <SelectRoot value={classId} onValueChange={v => setClassId(v ?? '')}>
              <SelectTrigger className={ST}><SelectValue>{classId ? (classes.find((c: any) => c.classid === classId)?.classname ?? classes.find((c: any) => c.classid === classId)?.name ?? 'Class') : 'Select Class'}</SelectValue></SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => <SelectItem key={c.classid} value={c.classid}>{c.classname ?? c.name}</SelectItem>)}
              </SelectContent>
            </SelectRoot>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={calculate} disabled={!classId || !termId || loading}>
            {loading ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Calculating…</> : <><BookOpen className="h-4 w-4 mr-1.5" /> Calculate Aggregates</>}
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Students', value: results.length, icon: '👥' },
            { label: 'Subjects', value: allSubjects.length, icon: '📚' },
            { label: 'Best Aggregate', value: results[0]?.best6Points ?? '—', icon: '🏆' },
            { label: 'Pass Rate', value: passRate !== null ? `${passRate}%` : '—', icon: '✅' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <p className="font-semibold text-slate-900 dark:text-slate-100">Class Results — {examType.toUpperCase()}</p>
            </div>
            <p className="text-xs text-slate-500">Best 6 subjects aggregate (lower = better)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-12">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                  {allSubjects.map(sub => (
                    <th key={sub} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      {sub.length > 10 ? sub.slice(0, 9) + '…' : sub}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Best 6</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map(student => {
                  const scoreBySubject = new Map(student.scores.map(s => [s.subjectname, s]));
                  return (
                    <tr key={student.studentid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          student.rank === 1 ? 'bg-amber-100 text-amber-700' :
                          student.rank === 2 ? 'bg-slate-100 text-slate-600' :
                          student.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>{student.rank}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{student.studentname}</p>
                        <p className="text-xs text-slate-400">{student.totalSubs} subject{student.totalSubs !== 1 ? 's' : ''}</p>
                      </td>
                      {allSubjects.map(sub => {
                        const sc = scoreBySubject.get(sub);
                        const gr = scoreToGrade(sc?.score ?? null);
                        return (
                          <td key={sub} className="px-3 py-3 text-center">
                            {sc ? (
                              <div>
                                <p className={`text-xs font-bold ${gr.color}`}>{sc.grade}</p>
                                <p className="text-xs text-slate-400">{sc.score}%</p>
                              </div>
                            ) : <span className="text-slate-300 dark:text-slate-700">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${aggregateColor(student.best6Points)}`}>
                          {student.best6Points}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${aggregateColor(student.best6Points)} inline-flex items-center rounded-full px-2 py-0.5`}>
                          {aggregateLabel(student.best6Points)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer legend */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Aggregate formula:</span> Sum of best 6 subject grade points · A1=1, B2=2, B3=3, C4=4, C5=5, C6=6, D7=7, E8=8, F9=9 · Lower aggregate = better performance
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
            <Award className="h-7 w-7 opacity-50" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No results yet</p>
          <p className="text-xs mt-1">Select a year, term, and class then click Calculate</p>
        </div>
      )}
    </div>
  );
}
