import { NextRequest, NextResponse } from 'next/server';
import { getExpenditures, createExpenditure } from '@/lib/dataverse/procurement';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const category = request.nextUrl.searchParams.get('category');
            const status   = request.nextUrl.searchParams.get('status');
            const items = await getExpenditures(
                category ? Number(category) : undefined,
                status   ? Number(status)   : undefined,
            );
            return NextResponse.json({ success: true, data: items, total: items.length });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.name || body.amount === undefined || !body.expendituredate) {
                return NextResponse.json({ success: false, error: 'name, amount and expendituredate are required' }, { status: 400 });
            }
            const item = await createExpenditure(body);
            return NextResponse.json({ success: true, data: item }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
