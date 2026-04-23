import { NextRequest, NextResponse } from 'next/server';
import { updateFeePayment, deleteFeePayment } from '@/lib/dataverse/fees';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await updateFeePayment(id, await request.json());
        return NextResponse.json({ success: true, message: 'Payment updated' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteFeePayment(id);
        return NextResponse.json({ success: true, message: 'Payment deleted' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete' }, { status: 500 });
    }
}
