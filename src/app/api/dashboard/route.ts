// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData, getDashboardStats } from '@/lib/dataverse/dashboard';
import { serverError } from '@/lib/api-guard';

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
  } catch (error) {
    return serverError(error);
  }
}
