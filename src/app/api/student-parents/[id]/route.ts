import { NextRequest, NextResponse } from 'next/server';
import { updateStudentParent, unlinkStudentParent } from '@/lib/dataverse/studentparents';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        await updateStudentParent(id, { isprimary: body.isprimary ?? false });
        return NextResponse.json({ success: true, message: 'Updated' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await unlinkStudentParent(id);
        return NextResponse.json({ success: true, message: 'Parent unlinked' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to unlink' }, { status: 500 });
    }
}
