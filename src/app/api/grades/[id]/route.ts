import { NextRequest, NextResponse } from 'next/server';
import { getGradeById, updateGrade, deleteGrade } from '@/lib/dataverse/grades';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            const data = await getGradeById(id);
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
            const data = await updateGrade(id, body);
            return NextResponse.json({ success: true, data });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            await deleteGrade(id);
            return NextResponse.json({ success: true, message: 'Grade deleted' });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
