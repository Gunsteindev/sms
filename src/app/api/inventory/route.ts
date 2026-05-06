import { NextRequest, NextResponse } from 'next/server';
import { getInventoryItems, createInventoryItem } from '@/lib/dataverse/inventory';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const category = request.nextUrl.searchParams.get('category') || undefined;
        const items = await getInventoryItems(category);
        return NextResponse.json({ success: true, data: items, total: items.length });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name) return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
        const item = await createInventoryItem(body);
        return NextResponse.json({ success: true, data: item }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
