import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceRecords, createMaintenanceRecord } from '@/lib/dataverse/vehicleMaintenance';
import { serverError, withSchool } from '@/lib/api-guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissing(e: any) {
    const msg: string = e?.response?.data?.error?.message ?? e?.message ?? '';
    const code: string = e?.response?.data?.error?.code ?? '';
    return msg.includes('sms_vehiclemaintenance') && (msg.includes('Could not find') || msg.includes('does not exist') || msg.includes('Invalid entity') || msg.includes('Resource not found') || code === '0x80060888');
}

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const vehicleid = request.nextUrl.searchParams.get('vehicleid') ?? undefined;
            const data = await getMaintenanceRecords(vehicleid);
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: true, data: [], total: 0, setup_required: true });
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.vehicleid) return NextResponse.json({ success: false, error: 'vehicleid is required' }, { status: 400 });
            const data = await createMaintenanceRecord(body);
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'sms_vehiclemaintenances table not created yet', setup_required: true }, { status: 503 });
            return serverError(error);
        }
    });
}
