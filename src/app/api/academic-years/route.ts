import { NextRequest, NextResponse } from 'next/server';
import { getAcademicYears, createAcademicYear } from '@/lib/dataverse/academicyears';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const search = request.nextUrl.searchParams.get('search') ?? undefined;
        const data = await getAcademicYears(search);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name || !body.startdate || !body.enddate) {
            return NextResponse.json({ success: false, error: 'name, startdate, and enddate are required' }, { status: 400 });
        }
        const data = await createAcademicYear(body);
        return NextResponse.json({ success: true, data, message: 'Academic year created' }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
