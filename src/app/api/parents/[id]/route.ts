import { NextRequest, NextResponse } from 'next/server';
import { getParentById, updateParent, deleteParent } from '@/lib/dataverse/parents';
import { serverError } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await getParentById(id) });
    } catch (error: unknown) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await updateParent(id, await request.json());
        return NextResponse.json({ success: true, data, message: 'Parent updated' });
    } catch (error: unknown) {
        return serverError(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteParent(id);
        return NextResponse.json({ success: true, message: 'Parent deleted' });
    } catch (error: unknown) {
        return serverError(error);
    }
}
