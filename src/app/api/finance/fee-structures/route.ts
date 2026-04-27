import { NextRequest, NextResponse } from 'next/server';
import { getFeeStructures, createFeeStructure } from '@/lib/dataverse/fees';

export async function GET(request: NextRequest) {
    try {
        const gradelevel = request.nextUrl.searchParams.get('gradelevel') ?? undefined;
        const data = await getFeeStructures(gradelevel);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to fetch fee structures';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name || body.feetype === undefined || body.amount === undefined) {
            return NextResponse.json({ success: false, error: 'name, feetype, and amount are required' }, { status: 400 });
        }
        const data = await createFeeStructure(body);
        return NextResponse.json({ success: true, data, message: 'Fee structure created' }, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to create fee structure';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
