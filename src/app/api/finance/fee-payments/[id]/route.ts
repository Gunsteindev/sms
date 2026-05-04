import { NextRequest, NextResponse } from 'next/server';
import { updateFeePayment, deleteFeePayment } from '@/lib/dataverse/fees';
import { serverError } from '@/lib/api-guard';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await updateFeePayment(id, await request.json());
        return NextResponse.json({ success: true, message: 'Payment updated' });
    } catch (error) {
        return serverError(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteFeePayment(id);
        return NextResponse.json({ success: true, message: 'Payment deleted' });
    } catch (error) {
        return serverError(error);
    }
}
