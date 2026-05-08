import { NextRequest, NextResponse } from 'next/server';
import { updateAttendance, deleteAttendance } from '@/lib/dataverse/attendance';
import { serverError, withSchool } from '@/lib/api-guard';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            await updateAttendance(id, body);
            return NextResponse.json({ success: true });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            await deleteAttendance(id);
            return NextResponse.json({ success: true });
        } catch (error) {
            return serverError(error);
        }
    });
}
