import { NextRequest, NextResponse } from 'next/server';
import { getSession, serverError, withSchool } from '@/lib/api-guard';
import { getParentByEmail } from '@/lib/dataverse/parents';
import { getParentStudents } from '@/lib/dataverse/studentparents';
import { getGrades } from '@/lib/dataverse/grades';
import { getStudentAttendance } from '@/lib/dataverse/attendance';
import { getFeeInvoices, type FeeInvoice } from '@/lib/dataverse/feeinvoices';
import { getDisciplinaryRecords } from '@/lib/dataverse/disciplinary';
import { getTerms } from '@/lib/dataverse/terms';
import { getStudentById } from '@/lib/dataverse/students';
import { getClassById } from '@/lib/dataverse/classes';
import { buildReportCard } from '@/lib/reportcard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    return withSchool(request, async () => {
        const { studentId } = await params;
        const termIdParam = request.nextUrl.searchParams.get('termId') || undefined;
        try {
            // Authorization: the caller must be a parent linked to this student.
            const parent = await getParentByEmail(session.email);
            if (!parent) {
                return NextResponse.json({ success: false, error: 'No parent record is linked to your account' }, { status: 403 });
            }
            const links = await getParentStudents(parent.parentid);
            if (!links.some(l => l.studentid === studentId)) {
                return NextResponse.json({ success: false, error: 'Forbidden — this student is not linked to your account' }, { status: 403 });
            }

            const [gradesResult, attendance, feesRaw, terms, student] = await Promise.all([
                getGrades({ studentid: studentId }),
                getStudentAttendance(studentId, 90),
                getFeeInvoices({ studentid: studentId, pageSize: 100 }),
                getTerms().catch(() => []),
                getStudentById(studentId).catch(() => null),
            ]);
            const fees = feesRaw as FeeInvoice[];

            // Class summary — pull the class record for richer details (teacher, room, etc.)
            const cls = student?.classid ? await getClassById(student.classid).catch(() => null) : null;
            const classInfo = student ? {
                studentName:   student.fullname,
                rollnumber:    student.rollnumber,
                enrollmentdate: student.enrollmentdate,
                classname:     cls?.classname     || student.classname || '',
                section:       cls?.section       || '',
                roomnumber:    cls?.roomnumber    || '',
                gradelevel:    cls?.gradelevelname || '',
                classteacher:  cls?.teachername   || '',
                academicyear:  cls?.academicyearname || '',
                capacity:      cls?.capacity      ?? null,
                enrolledcount: cls?.enrolledcount ?? null,
            } : null;

            // Default the report card to the most recent term unless one is requested
            const termsSorted = [...terms].sort((a, b) => (b.startdate || '').localeCompare(a.startdate || ''));
            const reportTermId = termIdParam || termsSorted[0]?.termid;

            // These can fail independently (e.g. table not configured) — treat as empty
            const [disciplinaryRes, reportCardRes] = await Promise.allSettled([
                getDisciplinaryRecords(studentId),
                reportTermId ? buildReportCard(studentId, reportTermId, session.schoolId) : Promise.resolve(null),
            ]);

            const present = attendance.filter(a => a.attendancestatus === 1).length;
            const absent  = attendance.filter(a => a.attendancestatus === 2).length;
            const late    = attendance.filter(a => a.attendancestatus === 3).length;
            const excused = attendance.filter(a => a.attendancestatus === 4).length;

            const totalOwed = fees
                .filter(f => f.feestatus === 1 || f.feestatus === 3)
                .reduce((sum, f) => sum + f.amount, 0);
            const totalPaid = fees
                .filter(f => f.feestatus === 2)
                .reduce((sum, f) => sum + f.amount, 0);

            return NextResponse.json({
                success: true,
                data: {
                    classInfo,
                    grades: gradesResult.items.slice(0, 50),
                    attendance: {
                        records: attendance.slice(0, 20),
                        summary: { present, absent, late, excused, total: attendance.length },
                    },
                    fees: {
                        invoices: fees,
                        summary: { totalOwed, totalPaid },
                    },
                    disciplinary: disciplinaryRes.status === 'fulfilled' ? disciplinaryRes.value : [],
                    terms: termsSorted.map(t => ({ termid: t.termid, name: t.name })),
                    reportCard: reportCardRes.status === 'fulfilled' ? reportCardRes.value : null,
                },
            });
        } catch (error) {
            return serverError(error);
        }
    });
}
