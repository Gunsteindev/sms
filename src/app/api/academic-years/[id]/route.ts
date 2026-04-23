import { NextRequest, NextResponse } from 'next/server';
import { getAcademicYearById, updateAcademicYear, deleteAcademicYear } from '@/lib/dataverse/academicyears';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getAcademicYearById(id);
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
        const data = await updateAcademicYear(id, body);
        return NextResponse.json({ success: true, data, message: 'Academic year updated' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to update';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteAcademicYear(id);
        return NextResponse.json({ success: true, message: 'Academic year deleted' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to delete';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
