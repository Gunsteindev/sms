import { NextRequest, NextResponse } from 'next/server';
import { getEnrollments, createEnrollment } from '@/lib/dataverse/enrollments';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const search = request.nextUrl.searchParams.get('search') ?? undefined;
        const data = await getEnrollments(search);
        return NextResponse.json({ success: true, data, total: data.length });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.studentid || !body.classid || !body.academicyearid || !body.enrollmentdate)
            return NextResponse.json({ success: false, error: 'studentid, classid, academicyearid, enrollmentdate are required' }, { status: 400 });
        const data = await createEnrollment(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
