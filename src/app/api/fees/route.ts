import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFeeStructures, getFeePayments, createFeePayment, getCurrentMonthRevenue } from '@/lib/dataverse/fees';
import { parseBody, serverError } from '@/lib/api-guard';

const paymentSchema = z.object({
    studentid:     z.string().min(1),
    feeid:         z.string().min(1),
    amount:        z.number().positive(),
    paymentdate:   z.string().min(1),
    paymentmethod: z.number().int().min(1),
    paymentstatus: z.number().int().optional(),
    transactionid: z.string().optional(),
    receiptnumber: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const p          = request.nextUrl.searchParams;
        const studentId  = p.get('studentId');
        const gradelevel = p.get('gradelevel') ?? undefined;
        const revenue    = p.get('revenue') === 'true';
        const month      = p.get('month') ? parseInt(p.get('month')!) : new Date().getMonth() + 1;
        const year       = p.get('year')  ? parseInt(p.get('year')!)  : new Date().getFullYear();

        if (revenue) {
            const revenueData = await getCurrentMonthRevenue();
            return NextResponse.json({ success: true, data: revenueData, period: { month, year } });
        }

        if (studentId) {
            const result = await getFeePayments({ studentid: studentId });
            return NextResponse.json({ success: true, data: result.items, total: result.totalCount });
        }

        const feeStructures = await getFeeStructures(gradelevel);
        return NextResponse.json({ success: true, data: feeStructures, total: feeStructures.length });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, paymentSchema);
        if ('response' in parsed) return parsed.response;

        const body = { ...parsed.data };
        if (!body.receiptnumber) {
            body.receiptnumber = `RCP-${crypto.randomUUID()}`;
        }

        const payment = await createFeePayment(body);
        return NextResponse.json({ success: true, data: payment, message: 'Fee payment recorded successfully' }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
