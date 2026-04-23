import { NextRequest, NextResponse } from 'next/server';
import { getGradeLevelById, updateGradeLevel, deleteGradeLevel } from '@/lib/dataverse/gradelevels';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getGradeLevelById(id);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Not found';
        return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data = await updateGradeLevel(id, body);
        return NextResponse.json({ success: true, data, message: 'Grade level updated' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to update';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteGradeLevel(id);
        return NextResponse.json({ success: true, message: 'Grade level deleted' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to delete';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
