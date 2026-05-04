import { NextRequest, NextResponse } from 'next/server';
import { getDisciplinaryRecords, createDisciplinaryRecord } from '@/lib/dataverse/disciplinary';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    const studentid = request.nextUrl.searchParams.get('studentid') || undefined;
    try {
        const data = await getDisciplinaryRecords(studentid);
        return NextResponse.json({ success: true, data });
    } catch {
        // Table may not exist yet — return empty list rather than a 500
        return NextResponse.json({ success: true, data: [] });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.studentid || !body.incidenttype || !body.description || !body.date) {
            return NextResponse.json({ success: false, error: 'Missing required fields: studentid, incidenttype, description, date' }, { status: 400 });
        }
        const data = await createDisciplinaryRecord(body);
        return NextResponse.json({ success: true, data, message: 'Disciplinary record created' }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
