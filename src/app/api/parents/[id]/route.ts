import { NextRequest, NextResponse } from 'next/server';
import { getParentById, updateParent, deleteParent } from '@/lib/dataverse/parents';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await getParentById(id) });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Not found' }, { status: 404 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await updateParent(id, await request.json());
        return NextResponse.json({ success: true, data, message: 'Parent updated' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteParent(id);
        return NextResponse.json({ success: true, message: 'Parent deleted' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete' }, { status: 500 });
    }
}
