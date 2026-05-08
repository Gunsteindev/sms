import { NextRequest, NextResponse } from 'next/server';
import { getBookById, updateBook, deleteBook } from '@/lib/dataverse/library';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await getBookById(id) });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) { return serverError(e); }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await updateBook(id, await request.json()) });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) { return serverError(e); }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteBook(id);
            return NextResponse.json({ success: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) { return serverError(e); }
    });
}
