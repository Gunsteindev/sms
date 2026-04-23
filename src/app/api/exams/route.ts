import { NextRequest, NextResponse } from 'next/server';
import { getExams, createExam } from '@/lib/dataverse/exams';

export async function GET(request: NextRequest) {
    try {
        const search = request.nextUrl.searchParams.get('search') ?? undefined;
        const data = await getExams(search);
        return NextResponse.json({ success: true, data, total: data.length });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name || !body.examtype || !body.startdate || !body.enddate)
            return NextResponse.json({ success: false, error: 'name, examtype, startdate, enddate are required' }, { status: 400 });
        const data = await createExam(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
