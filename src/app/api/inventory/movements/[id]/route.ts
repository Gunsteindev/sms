import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getMovementById, deleteMovement } from '@/lib/dataverse/inventoryMovements';
import { serverError, withSchool } from '@/lib/api-guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissing(error: any): boolean {
    const msg: string = error?.response?.data?.error?.message ?? '';
    return error?.response?.status === 404 && msg.includes('Resource not found for the segment');
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const movement = await getMovementById(id);
            return NextResponse.json({ success: true, data: movement });
        } catch (error: unknown) {
            if (isTableMissing(error)) {
                return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            }
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Movement not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteMovement(id);
            return NextResponse.json({ success: true });
        } catch (error: unknown) {
            if (isTableMissing(error)) {
                return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            }
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Movement not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}
