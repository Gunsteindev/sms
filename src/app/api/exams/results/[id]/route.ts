import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getExamResultById, updateExamResult, deleteExamResult } from '@/lib/dataverse/examresults';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await getExamResultById(id) });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Exam result not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const data = await updateExamResult(id, await request.json());
            return NextResponse.json({ success: true, data, message: 'Exam result updated' });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Exam result not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteExamResult(id);
            return NextResponse.json({ success: true, message: 'Exam result deleted' });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Exam result not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}
