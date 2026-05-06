import { NextRequest, NextResponse } from 'next/server';
import { getStaffLeaves, createStaffLeave } from '@/lib/dataverse/staffleave';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const status     = request.nextUrl.searchParams.get('status');
        const employeeid = request.nextUrl.searchParams.get('employeeid') || undefined;
        const items = await getStaffLeaves(
            status ? Number(status) : undefined,
            employeeid,
        );
        return NextResponse.json({ success: true, data: items, total: items.length });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.employeeid || !body.leavetype || !body.startdate || !body.enddate) {
            return NextResponse.json({ success: false, error: 'employeeid, leavetype, startdate and enddate are required' }, { status: 400 });
        }
        const item = await createStaffLeave(body);
        return NextResponse.json({ success: true, data: item }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
