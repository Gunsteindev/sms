import { NextRequest, NextResponse } from 'next/server';
import { getExpenditureById, updateExpenditure, deleteExpenditure } from '@/lib/dataverse/procurement';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const item = await getExpenditureById(id);
            return NextResponse.json({ success: true, data: item });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const item = await updateExpenditure(id, body);
            return NextResponse.json({ success: true, data: item });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteExpenditure(id);
            return NextResponse.json({ success: true });
        } catch (error) {
            return serverError(error);
        }
    });
}
