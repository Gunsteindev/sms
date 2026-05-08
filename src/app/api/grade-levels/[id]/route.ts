import { NextRequest, NextResponse } from 'next/server';
import { getGradeLevelById, updateGradeLevel, deleteGradeLevel } from '@/lib/dataverse/gradelevels';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const data = await getGradeLevelById(id);
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
            const data = await updateGradeLevel(id, body);
            return NextResponse.json({ success: true, data, message: 'Grade level updated' });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteGradeLevel(id);
            return NextResponse.json({ success: true, message: 'Grade level deleted' });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
