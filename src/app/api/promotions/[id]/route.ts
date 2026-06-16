import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getPromotionById, updatePromotion, deletePromotion } from '@/lib/dataverse/promotions';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            const data = await getPromotionById(id);
            return NextResponse.json({ success: true, data });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Promotion not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const data = await updatePromotion(id, body);
            return NextResponse.json({ success: true, data, message: 'Promotion updated' });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Promotion not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            await deletePromotion(id);
            return NextResponse.json({ success: true, message: 'Promotion deleted' });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Promotion not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}
