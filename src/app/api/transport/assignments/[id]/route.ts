import { NextRequest, NextResponse } from 'next/server';
import { updateRouteAssignment, deleteRouteAssignment } from '@/lib/dataverse/routeAssignments';
import { serverError, withSchool, makeTableGuard } from '@/lib/api-guard';

const isTableMissing = makeTableGuard('sms_routeassignment');
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        const { id } = await params;
        try {
            const body = await request.json();
            await updateRouteAssignment(id, body);
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
            await deleteRouteAssignment(id);
            return NextResponse.json({ success: true });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            return serverError(error);
        }
    });
}
