import { NextRequest, NextResponse } from 'next/server';
import { getScholarshipById, updateScholarship, deleteScholarship } from '@/lib/dataverse/scholarships';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await getScholarshipById(id) });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const data = await updateScholarship(id, await request.json());
            return NextResponse.json({ success: true, data, message: 'Scholarship updated' });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteScholarship(id);
            return NextResponse.json({ success: true, message: 'Scholarship deleted' });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
