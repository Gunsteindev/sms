import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getSessionById, updateSession, deleteSession } from '@/lib/dataverse/poolsessions';
import { serverError, withSchool } from '@/lib/api-guard';

const notFound = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 404;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try { const { id } = await params; return NextResponse.json({ success: true, data: await getSessionById(id) }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try { const { id } = await params; return NextResponse.json({ success: true, data: await updateSession(id, await request.json()) }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try { const { id } = await params; await deleteSession(id); return NextResponse.json({ success: true }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
            return serverError(error);
        }
    });
}
