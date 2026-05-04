import { NextRequest, NextResponse } from 'next/server';
import { getMedicalByStudent, createMedicalRecord } from '@/lib/dataverse/medical';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    const studentid = request.nextUrl.searchParams.get('studentid');
    if (!studentid) {
        return NextResponse.json({ success: false, error: 'studentid is required' }, { status: 400 });
    }
    try {
        const data = await getMedicalByStudent(studentid);
        return NextResponse.json({ success: true, data });
    } catch {
        // Table may not exist yet — return null rather than a 500
        return NextResponse.json({ success: true, data: null });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.studentid) {
            return NextResponse.json({ success: false, error: 'Missing required field: studentid' }, { status: 400 });
        }
        const data = await createMedicalRecord(body);
        return NextResponse.json({ success: true, data, message: 'Medical record created' }, { status: 201 });
    } catch (error: unknown) {
        return serverError(error);
    }
}
