import { NextRequest, NextResponse } from 'next/server';
import { getFeeStructureById, updateFeeStructure, deleteFeeStructure } from '@/lib/dataverse/fees';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getFeeStructureById(id);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Not found';
        return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await updateFeeStructure(id, await request.json());
        return NextResponse.json({ success: true, data, message: 'Fee structure updated' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to update';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteFeeStructure(id);
        return NextResponse.json({ success: true, message: 'Fee structure deleted' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to delete';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
