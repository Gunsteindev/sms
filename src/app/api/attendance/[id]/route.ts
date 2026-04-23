import { NextRequest, NextResponse } from 'next/server';
import { updateAttendance, deleteAttendance } from '@/lib/dataverse/attendance';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        await updateAttendance(id, body);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('PUT /api/attendance/[id] error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteAttendance(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE /api/attendance/[id] error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to delete' }, { status: 500 });
    }
}
