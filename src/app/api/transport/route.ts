import { NextRequest, NextResponse } from 'next/server';
import { getVehicles, createVehicle } from '@/lib/dataverse/transport';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const status = request.nextUrl.searchParams.get('status');
        const data   = await getVehicles(status ? Number(status) : undefined);
        return NextResponse.json({ success: true, data, total: data.length });
    } catch (error) { return serverError(error); }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name) return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
        const data = await createVehicle(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) { return serverError(error); }
}
