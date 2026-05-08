import { NextRequest, NextResponse } from 'next/server';
import { getRentals, createRental } from '@/lib/dataverse/poolrentals';
import { serverError, badRequest, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const data = await getRentals();
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error) { return serverError(error); }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.name) return badRequest('name is required');
            const data = await createRental(body);
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error) { return serverError(error); }
    });
}
