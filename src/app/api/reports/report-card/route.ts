import { NextRequest, NextResponse } from 'next/server';
import { getStudentById } from '@/lib/dataverse/students';
import { serverError } from '@/lib/api-guard';
import { getGrades } from '@/lib/dataverse/grades';
import { getExams } from '@/lib/dataverse/exams';
import { getExamResults } from '@/lib/dataverse/examresults';
import { getSubjects } from '@/lib/dataverse/subjects';

const GES_GRADES = [
    { min: 80, label: 'A1' }, { min: 70, label: 'B2' }, { min: 60, label: 'B3' },
    { min: 55, label: 'C4' }, { min: 50, label: 'C5' }, { min: 45, label: 'C6' },
    { min: 40, label: 'D7' }, { min: 35, label: 'E8' }, { min: 0,  label: 'F9' },
];
function gesGrade(pct: number) {
    return GES_GRADES.find(g => pct >= g.min)?.label ?? 'F9';
}

export async function GET(request: NextRequest) {
    try {
        const p         = request.nextUrl.searchParams;
        const studentId = p.get('studentId');
        const termId    = p.get('termId') || undefined;

        if (!studentId) {
            return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
        }

        // Fetch student first — hard failure if not found
        const student = await getStudentById(studentId);

        // Fetch remaining data; treat individual failures as empty (table may not exist yet)
        const [subjectsResult, gradesResult, allExamsResult, examResultsResult] = await Promise.allSettled([
            getSubjects(),
            getGrades({ studentid: studentId, termid: termId }),
            getExams(),
            getExamResults({ studentid: studentId }),
        ]);

        const subjects    = subjectsResult.status    === 'fulfilled' ? subjectsResult.value         : [];
        const grades      = gradesResult.status      === 'fulfilled' ? gradesResult.value.items      : [];
        const allExams    = allExamsResult.status    === 'fulfilled' ? allExamsResult.value           : [];
        const examResults = examResultsResult.status === 'fulfilled' ? examResultsResult.value        : [];

        // Filter exams by term (in code, since getExams doesn't support termid filter)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const termExams = termId ? allExams.filter((e: any) => e.termid === termId) : allExams;
        // Filter exams relevant to the student's class
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const classExams = student.classid
            ? termExams.filter((e: any) => e.classid === student.classid)
            : termExams;

        // Build per-subject rows using subjects that have grade or exam data for this student
        const subjectRows = subjects
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((sub: any) => {
                // Continuous assessment grades for this subject/term
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subGrades = grades.filter((g: any) => g.subjectid === sub.subjectid);

                // Class score = avg of Classwork(1), Homework(2), MidTerm(4)
                const contScores = subGrades
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .filter((g: any) => [1, 2, 4].includes(g.assessmenttype))
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((g: any) => g.score as number);
                const classScore = contScores.length
                    ? parseFloat((contScores.reduce((a: number, b: number) => a + b, 0) / contScores.length).toFixed(1))
                    : null;

                // End of term exam score from exam results (exam type 3 = Final)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subjectExams = classExams.filter((e: any) => e.subjectid === sub.subjectid && e.examtype === 3);
                let examScore: number | null = null;
                for (const exam of subjectExams) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const result = examResults.find((r: any) => r.examid === exam.examid);
                    if (result) {
                        examScore = result.percentage ?? null;
                        break;
                    }
                }

                if (classScore === null && examScore === null) return null;

                const finalScore = parseFloat(((classScore ?? 0) * 0.30 + (examScore ?? 0) * 0.70).toFixed(1));

                return {
                    subjectid:   sub.subjectid,
                    subjectname: sub.name,
                    subjectcode: sub.code ?? '',
                    classScore,
                    examScore,
                    finalScore,
                    grade: gesGrade(finalScore),
                };
            })
            .filter(Boolean);

        // Overall summary
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalScores = subjectRows.map((r: any) => r.finalScore as number);
        const average = finalScores.length
            ? parseFloat((finalScores.reduce((a: number, b: number) => a + b, 0) / finalScores.length).toFixed(1))
            : null;

        return NextResponse.json({
            success: true,
            data: {
                student,
                termId,
                subjectRows,
                summary: {
                    average,
                    overallGrade: average !== null ? gesGrade(average) : null,
                    totalSubjects: subjectRows.length,
                },
            },
        });
    } catch (error: unknown) {
        return serverError(error);
    }
}
