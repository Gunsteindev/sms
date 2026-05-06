import { NextRequest, NextResponse } from 'next/server';
import { getInventoryItemById, updateInventoryItem, deleteInventoryItem } from '@/lib/dataverse/inventory';
import { serverError } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const item = await getInventoryItemById(id);
        return NextResponse.json({ success: true, data: item });
    } catch (error) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const item = await updateInventoryItem(id, body);
        return NextResponse.json({ success: true, data: item });
    } catch (error) {
        return serverError(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteInventoryItem(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return serverError(error);
    }
}
