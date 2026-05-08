// src/app/api/attendance/student/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStudentAttendanceReport } from '@/lib/dataverse/attendance';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSchool(request, async () => {
    try {
      const { id } = await params;
      const searchParams = request.nextUrl.searchParams;
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'startDate and endDate are required' },
          { status: 400 }
        );
      }

      const attendance = await getStudentAttendanceReport(id, startDate, endDate);

      const total = attendance.length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const present = attendance.filter((a: any) => a.attendancestatus === 1).length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const absent  = attendance.filter((a: any) => a.attendancestatus === 2).length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const late    = attendance.filter((a: any) => a.attendancestatus === 3).length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const excused = attendance.filter((a: any) => a.attendancestatus === 4).length;

      return NextResponse.json({
        success: true,
        data: {
          records: attendance,
          summary: {
            total,
            present,
            absent,
            late,
            excused,
            percentage: total > 0 ? (present / total) * 100 : 0
          }
        }
      });
    } catch (error) {
      return serverError(error);
    }
  });
}
