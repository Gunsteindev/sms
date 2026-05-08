import { NextRequest, NextResponse } from 'next/server';
import { getStaffLeaveById, updateStaffLeave, deleteStaffLeave } from '@/lib/dataverse/staffleave';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const item = await getStaffLeaveById(id);
            return NextResponse.json({ success: true, data: item });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const item = await updateStaffLeave(id, body);
            return NextResponse.json({ success: true, data: item });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteStaffLeave(id);
            return NextResponse.json({ success: true });
        } catch (error) {
            return serverError(error);
        }
    });
}
