import { NextRequest, NextResponse } from 'next/server';
import { getFeeInvoiceById, updateFeeInvoice, deleteFeeInvoice } from '@/lib/dataverse/feeinvoices';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await getFeeInvoiceById(id) });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const data = await updateFeeInvoice(id, await request.json());
            return NextResponse.json({ success: true, data, message: 'Fee invoice updated' });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteFeeInvoice(id);
            return NextResponse.json({ success: true, message: 'Fee invoice deleted' });
        } catch (error) {
            return serverError(error);
        }
    });
}
