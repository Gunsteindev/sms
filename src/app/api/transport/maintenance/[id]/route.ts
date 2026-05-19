import { NextRequest, NextResponse } from 'next/server';
import { updateMaintenanceRecord, deleteMaintenanceRecord } from '@/lib/dataverse/vehicleMaintenance';
import { serverError, withSchool } from '@/lib/api-guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissing(e: any) {
    const msg: string = e?.response?.data?.error?.message ?? e?.message ?? '';
    const code: string = e?.response?.data?.error?.code ?? '';
    return msg.includes('sms_vehiclemaintenance') && (msg.includes('Could not find') || msg.includes('does not exist') || msg.includes('Invalid entity') || msg.includes('Resource not found') || code === '0x80060888');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        const { id } = await params;
        try {
            const body = await request.json();
            await updateMaintenanceRecord(id, body);
            return NextResponse.json({ success: true });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            return serverError(error);
        }
    });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        const { id } = await params;
        try {
            await deleteMaintenanceRecord(id);
            return NextResponse.json({ success: true });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            return serverError(error);
        }
    });
}
