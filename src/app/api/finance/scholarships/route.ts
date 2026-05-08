import { NextRequest, NextResponse } from 'next/server';
import { getScholarships, createScholarship } from '@/lib/dataverse/scholarships';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const search = request.nextUrl.searchParams.get('search') ?? undefined;
            const data   = await getScholarships(search);
            return NextResponse.json({ success: true, data });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.name || body.scholarshiptype === undefined || !body.startdate) {
                return NextResponse.json({ success: false, error: 'name, scholarshiptype, and startdate are required' }, { status: 400 });
            }
            const data = await createScholarship(body);
            return NextResponse.json({ success: true, data, message: 'Scholarship created' }, { status: 201 });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
