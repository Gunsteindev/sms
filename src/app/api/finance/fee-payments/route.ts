import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFeePayments, createFeePayment } from '@/lib/dataverse/fees';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

// Mobile Money (4) and Bank Transfer (2) require a transaction/reference number; Cash (1) does not.
const REFERENCE_REQUIRED_METHODS = new Set([2, 4]);

const paymentSchema = z.object({
    studentid:     z.string().min(1),
    feeid:         z.string().min(1),
    amount:        z.number().positive(),
    paymentdate:   z.string().min(1),
    paymentmethod: z.number().int().min(1),
    paymentstatus: z.number().int().optional(),
    transactionid: z.string().optional(),
    receiptnumber: z.string().optional(),
}).refine(
    d => !REFERENCE_REQUIRED_METHODS.has(d.paymentmethod) || !!d.transactionid?.trim(),
    { path: ['transactionid'], message: 'Transaction/reference number is required for Mobile Money and Bank Transfer' },
);

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p = request.nextUrl.searchParams;
            const result = await getFeePayments({
                studentid: p.get('studentid') ?? undefined,
                status:    p.get('status')    ? Number(p.get('status'))   : undefined,
                pageSize:  p.get('pageSize')  ? Number(p.get('pageSize')) : undefined,
            });
            return NextResponse.json({ success: true, data: result.items, total: result.totalCount });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const parsed = await parseBody(request, paymentSchema);
            if ('response' in parsed) return parsed.response;

            const body = { ...parsed.data };
            if (!body.receiptnumber) {
                body.receiptnumber = `RCP-${crypto.randomUUID()}`;
            }
            const data = await createFeePayment(body);
            return NextResponse.json({ success: true, data, message: 'Payment recorded' }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
