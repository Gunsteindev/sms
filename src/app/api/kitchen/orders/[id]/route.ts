import { NextRequest, NextResponse } from 'next/server';
import { deleteOrder } from '@/lib/dataverse/mealOrders';
import { serverError, withSchool, makeTableGuard } from '@/lib/api-guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissing(e: any) {
    const msg: string = e?.response?.data?.error?.message ?? '';
    return e?.response?.status === 404 && msg.includes('Resource not found for the segment');
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteOrder(id);
            return NextResponse.json({ success: true });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            return serverError(error);
        }
    });
}
