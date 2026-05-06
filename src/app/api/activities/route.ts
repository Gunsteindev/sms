import { NextRequest, NextResponse } from 'next/server';
import { getActivities, createActivity } from '@/lib/dataverse/activities';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const p        = request.nextUrl.searchParams;
        const category = p.get('category');
        const status   = p.get('status');
        const data     = await getActivities(
            category ? Number(category) : undefined,
            status   ? Number(status)   : undefined,
        );
        return NextResponse.json({ success: true, data, total: data.length });
    } catch (error) { return serverError(error); }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name) return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
        const data = await createActivity(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) { return serverError(error); }
}
