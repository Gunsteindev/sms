import { NextRequest, NextResponse } from 'next/server';
import { getLoans, createLoan } from '@/lib/dataverse/libraryloans';

export async function GET(request: NextRequest) {
    try {
        const p = request.nextUrl.searchParams;
        const search     = p.get('search')     ?? undefined;
        const loanstatus = p.get('loanstatus') ? Number(p.get('loanstatus')) : undefined;
        const bookid     = p.get('bookid')     ?? undefined;
        const data = await getLoans(search, loanstatus, bookid);
        return NextResponse.json({ success: true, data, total: data.length });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        const detail = e?.response?.data?.error?.message ?? e?.error?.message ?? e?.message ?? String(e);
        return NextResponse.json({ success: false, error: detail }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.issuedate) return NextResponse.json({ success: false, error: 'issuedate is required' }, { status: 400 });
        if (!body.duedate)   return NextResponse.json({ success: false, error: 'duedate is required' }, { status: 400 });
        if (!body.name)      body.name = `LN-${Date.now().toString(36).toUpperCase()}`;
        const data = await createLoan(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        const detail = e?.response?.data?.error?.message ?? e?.error?.message ?? e?.message ?? String(e);
        return NextResponse.json({ success: false, error: detail }, { status: 500 });
    }
}
