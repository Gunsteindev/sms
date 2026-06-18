import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getFeedbackById, updateFeedback } from '@/lib/dataverse/parentFeedback';
import { serverError, withSchool } from '@/lib/api-guard';

const notFound = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 404;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await getFeedbackById(id) });
        } catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const data = await updateFeedback(id, {
                status:   body.status   !== undefined ? Number(body.status) : undefined,
                response: body.response !== undefined ? body.response : undefined,
            });
            return NextResponse.json({ success: true, data, message: 'Feedback updated' });
        } catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
            return serverError(error);
        }
    });
}
