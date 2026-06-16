import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { updateAttendance, deleteAttendance } from '@/lib/dataverse/attendance';
import { serverError, withSchool } from '@/lib/api-guard';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            await updateAttendance(id, body);
            return NextResponse.json({ success: true });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Attendance record not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            await deleteAttendance(id);
            return NextResponse.json({ success: true });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Attendance record not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}
