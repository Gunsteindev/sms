import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getActivityById, updateActivity, deleteActivity } from '@/lib/dataverse/activities';
import { serverError, withSchool } from '@/lib/api-guard';

function notFound(error: unknown): boolean {
    return axios.isAxiosError(error) && error.response?.status === 404;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try { const { id } = await params; return NextResponse.json({ success: true, data: await getActivityById(id) }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 });
            return serverError(error);
        }
    });
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try { const { id } = await params; return NextResponse.json({ success: true, data: await updateActivity(id, await request.json()) }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 });
            return serverError(error);
        }
    });
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try { const { id } = await params; await deleteActivity(id); return NextResponse.json({ success: true }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 });
            return serverError(error);
        }
    });
}
