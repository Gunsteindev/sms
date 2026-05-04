import { NextRequest, NextResponse } from 'next/server';
import { getGradeLevels, createGradeLevel } from '@/lib/dataverse/gradelevels';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const search = request.nextUrl.searchParams.get('search') ?? undefined;
        const data = await getGradeLevels(search);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name || body.ordernumber === undefined) {
            return NextResponse.json({ success: false, error: 'name and ordernumber are required' }, { status: 400 });
        }
        const data = await createGradeLevel(body);
        return NextResponse.json({ success: true, data, message: 'Grade level created' }, { status: 201 });
    } catch (error: unknown) {
        return serverError(error);
    }
}
