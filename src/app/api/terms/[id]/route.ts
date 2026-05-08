import { NextRequest, NextResponse } from 'next/server';
import { getTermById, updateTerm, deleteTerm } from '@/lib/dataverse/terms';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const data = await getTermById(id);
            return NextResponse.json({ success: true, data });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const data = await updateTerm(id, body);
            return NextResponse.json({ success: true, data, message: 'Term updated' });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteTerm(id);
            return NextResponse.json({ success: true, message: 'Term deleted' });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
