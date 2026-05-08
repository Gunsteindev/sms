import { NextRequest, NextResponse } from 'next/server';
import { getExamById, updateExam, deleteExam } from '@/lib/dataverse/exams';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await getExamById(id) });
        } catch (error) { return serverError(error); }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await updateExam(id, await request.json()) });
        } catch (error) { return serverError(error); }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteExam(id);
            return NextResponse.json({ success: true });
        } catch (error) { return serverError(error); }
    });
}
