import { NextRequest, NextResponse } from 'next/server';
import { getSubjectById, updateSubject, deleteSubject } from '@/lib/dataverse/subjects';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await getSubjectById(id) });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) { return serverError(e); }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await updateSubject(id, await request.json()) });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) { return serverError(e); }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteSubject(id);
            return NextResponse.json({ success: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) { return serverError(e); }
    });
}
