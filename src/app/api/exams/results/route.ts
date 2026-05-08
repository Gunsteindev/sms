import { NextRequest, NextResponse } from 'next/server';
import { getExamResults, createExamResult } from '@/lib/dataverse/examresults';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p = request.nextUrl.searchParams;
            const data = await getExamResults({
                examid:    p.get('examid')    ?? undefined,
                studentid: p.get('studentid') ?? undefined,
                pageSize:  p.get('pageSize')  ? Number(p.get('pageSize')) : undefined,
            });
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.examid || !body.studentid || body.score === undefined) {
                return NextResponse.json({ success: false, error: 'examid, studentid, and score are required' }, { status: 400 });
            }
            const data = await createExamResult(body);
            return NextResponse.json({ success: true, data, message: 'Exam result recorded' }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
