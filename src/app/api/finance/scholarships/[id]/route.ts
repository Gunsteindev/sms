import { NextRequest, NextResponse } from 'next/server';
import { getScholarshipById, updateScholarship, deleteScholarship } from '@/lib/dataverse/scholarships';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await getScholarshipById(id) });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Not found' }, { status: 404 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await updateScholarship(id, await request.json());
        return NextResponse.json({ success: true, data, message: 'Scholarship updated' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteScholarship(id);
        return NextResponse.json({ success: true, message: 'Scholarship deleted' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete' }, { status: 500 });
    }
}
