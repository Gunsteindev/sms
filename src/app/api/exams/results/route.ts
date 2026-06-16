import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getExamResults, createExamResult } from '@/lib/dataverse/examresults';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
    examid:    z.string().min(1),
    studentid: z.string().min(1),
    score:     z.number().min(0),
    remarks:   z.string().optional(),
});

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
            const parsed = await parseBody(request, createSchema);
            if ('response' in parsed) return parsed.response;
            const data = await createExamResult(parsed.data);
            return NextResponse.json({ success: true, data, message: 'Exam result recorded' }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
