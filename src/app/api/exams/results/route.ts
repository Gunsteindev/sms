import { NextRequest, NextResponse } from 'next/server';
import { getExamResults, createExamResult } from '@/lib/dataverse/examresults';

export async function GET(request: NextRequest) {
    try {
        const p = request.nextUrl.searchParams;
        const data = await getExamResults({
            examid:    p.get('examid')    ?? undefined,
            studentid: p.get('studentid') ?? undefined,
            pageSize:  p.get('pageSize')  ? Number(p.get('pageSize')) : undefined,
        });
        return NextResponse.json({ success: true, data, total: data.length });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to fetch exam results';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.examid || !body.studentid || body.score === undefined) {
            return NextResponse.json({ success: false, error: 'examid, studentid, and score are required' }, { status: 400 });
        }
        const data = await createExamResult(body);
        return NextResponse.json({ success: true, data, message: 'Exam result recorded' }, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to create exam result';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
