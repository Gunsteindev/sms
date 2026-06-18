import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getMenuById, updateMenu, deleteMenu } from '@/lib/dataverse/kitchen';
import { serverError, withSchool } from '@/lib/api-guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissing(e: any) {
    const msg: string = e?.response?.data?.error?.message ?? '';
    return e?.response?.status === 404 && msg.includes('Resource not found for the segment');
}
const notFound = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 404;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await getMenuById(id) });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Menu not found' }, { status: 404 });
            return serverError(error);
        }
    });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(req, async () => {
        try {
            const { id } = await params;
            const body = await req.json();
            const menu = await updateMenu(id, {
                name:        body.name        || undefined,
                menudate:    body.menudate    || undefined,
                mealtype:    body.mealtype    ? Number(body.mealtype)    : undefined,
                items:       body.items       !== undefined ? body.items  : undefined,
                price:       body.price       !== undefined ? Number(body.price)       : undefined,
                totalserved: body.totalserved !== undefined ? Number(body.totalserved) : undefined,
                status:      body.status      ? Number(body.status) : undefined,
            });
            return NextResponse.json({ success: true, data: menu });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Menu not found' }, { status: 404 });
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteMenu(id);
            return NextResponse.json({ success: true });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Menu not found' }, { status: 404 });
            return serverError(error);
        }
    });
}
