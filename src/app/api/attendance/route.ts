// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAttendance,
  markAttendance,
  getAttendanceTrends,
} from '@/lib/dataverse/attendance';

// GET /api/attendance?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date  = searchParams.get('date') || undefined;
    const trends = searchParams.get('trends') === 'true';
    const days   = parseInt(searchParams.get('days') || '30');

    if (trends) {
      const data = await getAttendanceTrends(days);
      return NextResponse.json({ success: true, data });
    }

    const data = await getAttendance(date);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('GET /api/attendance error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch attendance' }, { status: 500 });
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