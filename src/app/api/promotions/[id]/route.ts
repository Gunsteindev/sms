import { NextRequest, NextResponse } from 'next/server';
import { getPromotionById, updatePromotion, deletePromotion } from '@/lib/dataverse/promotions';
import { serverError } from '@/lib/api-guard';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getPromotionById(id);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data = await updatePromotion(id, body);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        return serverError(error);
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deletePromotion(id);
        return NextResponse.json({ success: true, message: 'Promotion deleted' });
    } catch (error: unknown) {
        return serverError(error);
    }
}
