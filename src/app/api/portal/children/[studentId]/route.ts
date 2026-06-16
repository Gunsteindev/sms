import { NextRequest, NextResponse } from 'next/server';
import { getSession, serverError, withSchool } from '@/lib/api-guard';
import { getGrades } from '@/lib/dataverse/grades';
import { getStudentAttendance } from '@/lib/dataverse/attendance';
import { getFeeInvoices, type FeeInvoice } from '@/lib/dataverse/feeinvoices';
import { getDisciplinaryRecords } from '@/lib/dataverse/disciplinary';
import { getTerms } from '@/lib/dataverse/terms';
import { buildReportCard } from '@/lib/reportcard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    return withSchool(request, async () => {
        const { studentId } = await params;
        const termIdParam = request.nextUrl.searchParams.get('termId') || undefined;
        try {
            const [gradesResult, attendance, feesRaw, terms] = await Promise.all([
                getGrades({ studentid: studentId }),
                getStudentAttendance(studentId, 90),
                getFeeInvoices({ studentid: studentId, pageSize: 100 }),
                getTerms().catch(() => []),
            ]);
            const fees = feesRaw as FeeInvoice[];

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
