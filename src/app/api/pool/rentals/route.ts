import { NextRequest, NextResponse } from 'next/server';
import { getRentals, createRental } from '@/lib/dataverse/poolrentals';
import { serverError, badRequest } from '@/lib/api-guard';

export async function GET() {
    try {
        const data = await getRentals();
        return NextResponse.json({ success: true, data, total: data.length });
    } catch (error) { return serverError(error); }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name) return badRequest('name is required');
        const data = await createRental(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) { return serverError(error); }
}
