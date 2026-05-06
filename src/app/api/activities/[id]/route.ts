import { NextRequest, NextResponse } from 'next/server';
import { getActivityById, updateActivity, deleteActivity } from '@/lib/dataverse/activities';
import { serverError } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try { const { id } = await params; return NextResponse.json({ success: true, data: await getActivityById(id) }); }
    catch (error) { return serverError(error); }
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try { const { id } = await params; return NextResponse.json({ success: true, data: await updateActivity(id, await request.json()) }); }
    catch (error) { return serverError(error); }
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try { const { id } = await params; await deleteActivity(id); return NextResponse.json({ success: true }); }
    catch (error) { return serverError(error); }
}
