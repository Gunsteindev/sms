import { NextRequest, NextResponse } from 'next/server';
import { getSession, serverError, withSchool } from '@/lib/api-guard';
import { getGrades } from '@/lib/dataverse/grades';
import { getStudentAttendance } from '@/lib/dataverse/attendance';
import { getFeeInvoices, type FeeInvoice } from '@/lib/dataverse/feeinvoices';

export async function GET(request: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    return withSchool(request, async () => {
        const { studentId } = await params;
        try {
            const [gradesResult, attendance, feesRaw] = await Promise.all([
                getGrades({ studentid: studentId }),
                getStudentAttendance(studentId, 90),
                getFeeInvoices({ studentid: studentId, pageSize: 100 }),
            ]);
            const fees = feesRaw as FeeInvoice[];

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
                },
            });
        } catch (error) {
            return serverError(error);
        }
    });
}
