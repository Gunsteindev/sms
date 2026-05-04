import { NextRequest, NextResponse } from 'next/server';
import { getTerms, createTerm } from '@/lib/dataverse/terms';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const search        = request.nextUrl.searchParams.get('search')        ?? undefined;
        const academicyearid = request.nextUrl.searchParams.get('academicyearid') ?? undefined;
        const data = await getTerms(search, academicyearid);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name || !body.startdate || !body.enddate) {
            return NextResponse.json({ success: false, error: 'name, startdate, and enddate are required' }, { status: 400 });
        }
        const data = await createTerm(body);
        return NextResponse.json({ success: true, data, message: 'Term created' }, { status: 201 });
    } catch (error: unknown) {
        return serverError(error);
    }
}
