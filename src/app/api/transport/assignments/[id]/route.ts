import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { updateRouteAssignment, deleteRouteAssignment } from '@/lib/dataverse/routeAssignments';
import { serverError, withSchool } from '@/lib/api-guard';

// Precise: a missing TABLE yields an OData "Resource not found for the segment" error.
// A missing RECORD also yields a 404 (with the table name in the message), so we must
// distinguish the two — only the segment error means the table is not configured.
function isTableMissing(error: unknown): boolean {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) return false;
    const msg: string = error.response?.data?.error?.message ?? '';
    return msg.includes('Resource not found for the segment');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        const { id } = await params;
        try {
            const body = await request.json();
            await updateRouteAssignment(id, body);
            return NextResponse.json({ success: true });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            if (axios.isAxiosError(error) && error.response?.status === 404) return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
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
            if (axios.isAxiosError(error) && error.response?.status === 404) return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
            return serverError(error);
        }
    });
}
