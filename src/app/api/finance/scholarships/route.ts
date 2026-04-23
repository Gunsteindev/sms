import { NextRequest, NextResponse } from 'next/server';
import { getScholarships, createScholarship } from '@/lib/dataverse/scholarships';

export async function GET(request: NextRequest) {
    try {
        const search = request.nextUrl.searchParams.get('search') ?? undefined;
        const data   = await getScholarships(search);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to fetch scholarships';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name || body.scholarshiptype === undefined || !body.startdate) {
            return NextResponse.json({ success: false, error: 'name, scholarshiptype, and startdate are required' }, { status: 400 });
        }
        const data = await createScholarship(body);
        return NextResponse.json({ success: true, data, message: 'Scholarship created' }, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to create scholarship';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
