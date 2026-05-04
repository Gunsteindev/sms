import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getExams, createExam } from '@/lib/dataverse/exams';
import { parseBody, serverError } from '@/lib/api-guard';

const createSchema = z.object({
    name:           z.string().min(1),
    examtype:       z.number().int().min(1),
    startdate:      z.string().min(1),
    enddate:        z.string().min(1),
    classid:        z.string().optional(),
    termid:         z.string().optional(),
    academicyearid: z.string().optional(),
    description:    z.string().optional(),
    status:         z.number().int().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const search = request.nextUrl.searchParams.get('search') ?? undefined;
        const data = await getExams(search);
        return NextResponse.json({ success: true, data, total: data.length });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, createSchema);
        if ('response' in parsed) return parsed.response;
        const data = await createExam(parsed.data);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
