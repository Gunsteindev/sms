import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, createTransaction } from '@/lib/dataverse/pooltransactions';
import { serverError, badRequest } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const sp         = request.nextUrl.searchParams;
        const sessionref = sp.get('sessionref') ?? undefined;
        const transtype  = sp.get('transtype')  ? Number(sp.get('transtype'))  : undefined;
        const from       = sp.get('from')       ?? undefined;
        const to         = sp.get('to')         ?? undefined;
        const data = await getTransactions({ sessionref, transtype, from, to });
        return NextResponse.json({ success: true, data, total: data.length });
    } catch (error) { return serverError(error); }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name)      return badRequest('name is required');
        if (!body.transdate) return badRequest('transdate is required');
        const data = await createTransaction(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) { return serverError(error); }
}
