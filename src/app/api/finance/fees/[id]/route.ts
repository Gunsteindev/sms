import { NextRequest, NextResponse } from 'next/server';
import { getFeeInvoiceById, updateFeeInvoice, deleteFeeInvoice } from '@/lib/dataverse/feeinvoices';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await getFeeInvoiceById(id) });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Not found' }, { status: 404 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await updateFeeInvoice(id, await request.json());
        return NextResponse.json({ success: true, data, message: 'Fee invoice updated' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteFeeInvoice(id);
        return NextResponse.json({ success: true, message: 'Fee invoice deleted' });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete' }, { status: 500 });
    }
}
