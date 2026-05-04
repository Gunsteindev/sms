import { NextRequest, NextResponse } from 'next/server';
import { getExamResultById, updateExamResult, deleteExamResult } from '@/lib/dataverse/examresults';
import { serverError } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await getExamResultById(id) });
    } catch (error) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await updateExamResult(id, await request.json());
        return NextResponse.json({ success: true, data, message: 'Exam result updated' });
    } catch (error) {
        return serverError(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteExamResult(id);
        return NextResponse.json({ success: true, message: 'Exam result deleted' });
    } catch (error) {
        return serverError(error);
    }
}
