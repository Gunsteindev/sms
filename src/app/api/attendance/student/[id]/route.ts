// src/app/api/attendance/student/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStudentAttendanceReport } from '@/lib/dataverse/attendance';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const present = attendance.filter(a => a.status === 0).length;
    const absent = attendance.filter(a => a.status === 1).length;
    const late = attendance.filter(a => a.status === 2).length;
    const excused = attendance.filter(a => a.status === 3).length;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in GET /api/attendance/student/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch student attendance'
      },
      { status: 500 }
    );
  }
}
