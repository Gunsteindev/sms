import { NextRequest, NextResponse } from 'next/server';
import { getFeePayments, createFeePayment } from '@/lib/dataverse/fees';

export async function GET(request: NextRequest) {
    try {
        const p = request.nextUrl.searchParams;
        const result = await getFeePayments({
            studentid: p.get('studentid') ?? undefined,
            status:    p.get('status')    ? Number(p.get('status'))   : undefined,
            pageSize:  p.get('pageSize')  ? Number(p.get('pageSize')) : undefined,
        });
        return NextResponse.json({ success: true, data: result.items, total: result.totalCount });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to fetch fee payments';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.studentid || !body.feeid || body.amount === undefined || !body.paymentmethod) {
            return NextResponse.json({ success: false, error: 'studentid, feeid, amount, and paymentmethod are required' }, { status: 400 });
        }
        if (!body.receiptnumber) {
            body.receiptnumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        const data = await createFeePayment(body);
        return NextResponse.json({ success: true, data, message: 'Payment recorded' }, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to record payment';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
