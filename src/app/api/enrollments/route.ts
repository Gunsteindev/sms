import { NextRequest, NextResponse } from 'next/server';
import { getEnrollments, createEnrollment } from '@/lib/dataverse/enrollments';

export async function GET(request: NextRequest) {
    try {
        const search = request.nextUrl.searchParams.get('search') ?? undefined;
        const data = await getEnrollments(search);
        return NextResponse.json({ success: true, data, total: data.length });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.studentid || !body.classid || !body.academicyearid || !body.enrollmentdate)
            return NextResponse.json({ success: false, error: 'studentid, classid, academicyearid, enrollmentdate are required' }, { status: 400 });
        const data = await createEnrollment(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
