import { NextRequest, NextResponse } from 'next/server';
import { getFeeInvoices, createFeeInvoice } from '@/lib/dataverse/feeinvoices';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const p = request.nextUrl.searchParams;
        const data = await getFeeInvoices({
            studentid:     p.get('studentid')     ?? undefined,
            status:        p.get('status')        ? Number(p.get('status'))  : undefined,
            academicyearid: p.get('academicyearid') ?? undefined,
            termid:        p.get('termid')        ?? undefined,
            pageSize:      p.get('pageSize')      ? Number(p.get('pageSize')) : undefined,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.studentid || !body.feestructureid || body.amount === undefined) {
            return NextResponse.json({ success: false, error: 'studentid, feestructureid, and amount are required' }, { status: 400 });
        }
        const data = await createFeeInvoice(body);
        return NextResponse.json({ success: true, data, message: 'Fee invoice created' }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
