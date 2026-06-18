import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { updateFeePayment, deleteFeePayment } from '@/lib/dataverse/fees';
import { serverError, withSchool } from '@/lib/api-guard';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            await updateFeePayment(id, await request.json());
            return NextResponse.json({ success: true, message: 'Payment updated' });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteFeePayment(id);
            return NextResponse.json({ success: true, message: 'Payment deleted' });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}
