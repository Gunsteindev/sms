import { NextRequest, NextResponse } from 'next/server';
import { getMenus, createMenu } from '@/lib/dataverse/kitchen';
import { serverError, badRequest, withSchool, makeTableGuard } from '@/lib/api-guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissing(e: any) {
    const msg: string = e?.response?.data?.error?.message ?? '';
    return e?.response?.status === 404 && msg.includes('Resource not found for the segment');
}

export async function GET(req: NextRequest) {
    return withSchool(req, async () => {
        try {
            const sp = req.nextUrl.searchParams;
            const menus = await getMenus({
                date:     sp.get('date')     || undefined,
                mealtype: sp.get('mealtype') ? Number(sp.get('mealtype')) : undefined,
                status:   sp.get('status')   ? Number(sp.get('status'))   : undefined,
            });
            return NextResponse.json({ success: true, data: menus, total: menus.length });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: true, data: [], total: 0, setup_required: true });
            return serverError(error);
        }
    });
}

export async function POST(req: NextRequest) {
    return withSchool(req, async () => {
        try {
            const body = await req.json();
            if (!body.menudate) return badRequest('menudate is required');
            if (!body.mealtype) return badRequest('mealtype is required (1=Breakfast 2=Lunch 3=Dinner 4=Snack)');
            const menu = await createMenu({
                name:        body.name        || undefined,
                menudate:    body.menudate,
                mealtype:    Number(body.mealtype),
                items:       body.items       || undefined,
                price:       body.price !== undefined ? Number(body.price) : undefined,
                totalserved: body.totalserved !== undefined ? Number(body.totalserved) : undefined,
                status:      body.status      ? Number(body.status) : 1,
            });
            return NextResponse.json({ success: true, data: menu }, { status: 201 });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'sms_kitchenmenus table not created yet', setup_required: true }, { status: 503 });
            return serverError(error);
        }
    });
}
