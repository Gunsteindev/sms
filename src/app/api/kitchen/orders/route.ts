import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/lib/dataverse/mealOrders';
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
            const orders = await getOrders({
                menuid:        sp.get('menuid')        || undefined,
                date:          sp.get('date')          || undefined,
                paymentstatus: sp.get('paymentstatus') ? Number(sp.get('paymentstatus')) : undefined,
            });
            return NextResponse.json({ success: true, data: orders, total: orders.length });
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
            if (!body.menuid)      return badRequest('menuid is required');
            if (!body.studentid)   return badRequest('studentid is required');
            if (!body.studentname) return badRequest('studentname is required');
            const order = await createOrder({
                menuid:        body.menuid,
                menuname:      body.menuname      || '',
                mealtype:      Number(body.mealtype ?? 2),
                studentid:     body.studentid,
                studentname:   body.studentname,
                orderdate:     body.orderdate || new Date().toISOString().slice(0, 10),
                amount:        body.amount        !== undefined ? Number(body.amount) : 0,
                paymentstatus: body.paymentstatus ? Number(body.paymentstatus) : 1,
            });
            return NextResponse.json({ success: true, data: order }, { status: 201 });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'sms_mealorders table not created yet', setup_required: true }, { status: 503 });
            return serverError(error);
        }
    });
}
