import { NextRequest, NextResponse } from 'next/server';
import { getFeeStructureById, updateFeeStructure, deleteFeeStructure } from '@/lib/dataverse/fees';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const data = await getFeeStructureById(id);
            return NextResponse.json({ success: true, data });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const data = await updateFeeStructure(id, await request.json());
            return NextResponse.json({ success: true, data, message: 'Fee structure updated' });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteFeeStructure(id);
            return NextResponse.json({ success: true, message: 'Fee structure deleted' });
        } catch (error) {
            return serverError(error);
        }
    });
}
