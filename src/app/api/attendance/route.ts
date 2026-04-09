// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAttendanceByDate, 
  markAttendance, 
  getAttendanceSummary,
  getAttendanceTrends 
} from '@/lib/dataverse/attendance';

// GET /api/attendance - Get attendance records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const className = searchParams.get('className') || undefined;
    const summary = searchParams.get('summary') === 'true';
    const trends = searchParams.get('trends') === 'true';
    const days = parseInt(searchParams.get('days') || '30');

    if (!date && !trends) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Get attendance trends
    if (trends) {
      const trendsData = await getAttendanceTrends(days);
      return NextResponse.json({
        success: true,
        data: trendsData
      });
    }

    // Get attendance summary
    if (summary && date) {
      const summaryData = await getAttendanceSummary(date, className);
      return NextResponse.json({
        success: true,
        data: summaryData
      });
    }

    // Get attendance records for a date
    const attendance = await getAttendanceByDate(date!, className);
    
    return NextResponse.json({
      success: true,
      data: attendance,
      total: attendance.length
    });
  } catch (error: any) {
    console.error('Error in GET /api/attendance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch attendance' 
      },
      { status: 500 }
    );
  }
}

// POST /api/attendance - Mark attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Records array is required' },
        { status: 400 }
      );
    }

    const result = await markAttendance(records);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Marked ${records.length} attendance records successfully`
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/attendance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to mark attendance' 
      },
      { status: 500 }
    );
  }
}