import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEnrollments, createEnrollment } from '@/lib/dataverse/enrollments';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
    studentid:        z.string().min(1),
    classid:          z.string().min(1),
    academicyearid:   z.string().min(1),
    enrollmentdate:   z.string().min(1),
    rollnumber:       z.string().optional(),
    enrollmentstatus: z.number().optional(),
});

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const search = request.nextUrl.searchParams.get('search') ?? undefined;
            const data = await getEnrollments(search);
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
            const data = await createEnrollment(parsed.data);
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
