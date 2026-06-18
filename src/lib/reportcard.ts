// Shared GES report-card computation, used by the admin report-card route and the parent portal.
import { getStudentById } from '@/lib/dataverse/students';
import { getSchoolById } from '@/lib/dataverse/school';
import { getGrades } from '@/lib/dataverse/grades';
import { getExams } from '@/lib/dataverse/exams';
import { getExamResults } from '@/lib/dataverse/examresults';
import { getSubjects } from '@/lib/dataverse/subjects';

const GES_GRADES = [
    { min: 80, label: 'A1' }, { min: 70, label: 'B2' }, { min: 60, label: 'B3' },
    { min: 55, label: 'C4' }, { min: 50, label: 'C5' }, { min: 45, label: 'C6' },
    { min: 40, label: 'D7' }, { min: 35, label: 'E8' }, { min: 0,  label: 'F9' },
];

export function gesGrade(pct: number) {
    return GES_GRADES.find(g => pct >= g.min)?.label ?? 'F9';
}

export interface ReportSubjectRow {
    subjectid:   string;
    subjectname: string;
    subjectcode: string;
    classScore:  number | null;
    examScore:   number | null;
    finalScore:  number | null;
    grade:       string | null;
}

export interface ReportCard {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    student: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    school:  any;
    termId:  string | undefined;
    subjectRows: ReportSubjectRow[];
    summary: {
        average:        number | null;
        overallGrade:   string | null;
        totalSubjects:  number;
        subjectsScored: number;
    };
}

// Computes a student's terminal report card for a term (30% continuous + 70% final exam, GES grading).
// Throws if the student is not found (so callers can map to a 404).
export async function buildReportCard(
    studentId: string,
    termId: string | undefined,
    schoolId: string | undefined,
): Promise<ReportCard> {
    const student = await getStudentById(studentId);

    const [schoolResult, subjectsResult, gradesResult, allExamsResult, examResultsResult] = await Promise.allSettled([
        schoolId ? getSchoolById(schoolId) : Promise.resolve(null),
        getSubjects(),
        getGrades({ studentid: studentId, termid: termId }),
        getExams(),
        getExamResults({ studentid: studentId }),
    ]);

    const school      = schoolResult.status      === 'fulfilled' ? schoolResult.value      : null;
    const subjects    = subjectsResult.status    === 'fulfilled' ? subjectsResult.value    : [];
    const grades      = gradesResult.status      === 'fulfilled' ? gradesResult.value.items : [];
    const allExams    = allExamsResult.status    === 'fulfilled' ? allExamsResult.value     : [];
    const examResults = examResultsResult.status === 'fulfilled' ? examResultsResult.value  : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const termExams = termId ? allExams.filter((e: any) => e.termid === termId) : allExams;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classExams = student.classid
        ? termExams.filter((e: any) => e.classid === student.classid)
        : termExams;

    const subjectRows = subjects
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((sub: any): ReportSubjectRow | null => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subGrades = grades.filter((g: any) => g.subjectid === sub.subjectid);

            const contScores = subGrades
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((g: any) => [1, 2, 4].includes(g.assessmenttype))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((g: any) => g.score as number);
            const classScore = contScores.length
                ? parseFloat((contScores.reduce((a: number, b: number) => a + b, 0) / contScores.length).toFixed(1))
                : null;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subjectExams = classExams.filter((e: any) => e.subjectid === sub.subjectid && e.examtype === 3);
            let examScore: number | null = null;
            for (const exam of subjectExams) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result = examResults.find((r: any) => r.examid === exam.examid);
                if (result) { examScore = result.percentage ?? null; break; }
            }

            if (classScore === null && examScore === null) return null;

            // Final needs both components; otherwise the subject stays pending (no fabricated zero).
            const finalScore = (classScore !== null && examScore !== null)
                ? parseFloat((classScore * 0.30 + examScore * 0.70).toFixed(1))
                : null;

            return {
                subjectid:   sub.subjectid,
                subjectname: sub.name,
                subjectcode: sub.code ?? '',
                classScore,
                examScore,
                finalScore,
                grade: finalScore !== null ? gesGrade(finalScore) : null,
            };
        })
        .filter((r): r is ReportSubjectRow => r !== null);

    const finalScores = subjectRows
        .map(r => r.finalScore)
        .filter((s): s is number => s !== null);
    const average = finalScores.length
        ? parseFloat((finalScores.reduce((a, b) => a + b, 0) / finalScores.length).toFixed(1))
        : null;

    return {
        student,
        school,
        termId,
        subjectRows,
        summary: {
            average,
            overallGrade:   average !== null ? gesGrade(average) : null,
            totalSubjects:  subjectRows.length,
            subjectsScored: finalScores.length,
        },
    };
}
