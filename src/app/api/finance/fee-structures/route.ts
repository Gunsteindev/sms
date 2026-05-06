import { NextRequest, NextResponse } from 'next/server';
import { getFeeStructures, createFeeStructure } from '@/lib/dataverse/fees';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const gradelevel = request.nextUrl.searchParams.get('gradelevel') ?? undefined;
        const data = await getFeeStructures(gradelevel);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name || body.amount === undefined) {
            return NextResponse.json({ success: false, error: 'name and amount are required' }, { status: 400 });
        }
        const data = await createFeeStructure(body);
        return NextResponse.json({ success: true, data, message: 'Fee structure created' }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
