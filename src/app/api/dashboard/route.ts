// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData, getDashboardStats } from '@/lib/dataverse/dashboard';

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const full = searchParams.get('full') === 'true';

    let data;
    if (full) {
      data = await getDashboardData();
    } else {
      data = await getDashboardStats();
    }
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in GET /api/dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch dashboard data' 
      },
      { status: 500 }
    );
  }
}