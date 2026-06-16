import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSubjects, createSubject } from '@/lib/dataverse/subjects';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
    name:         z.string().min(1),
    code:         z.string().min(1),
    description:  z.string().optional(),
    credithours:  z.number().int().min(0).optional(),
    passscore:    z.number().min(0).max(100).optional(),
    type:         z.number().optional(),
    gradelevelid: z.string().optional(),
    teacherid:    z.string().optional(),
});

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const search = request.nextUrl.searchParams.get('search') ?? undefined;
            const data = await getSubjects(search);
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const parsed = await parseBody(request, createSchema);
            if ('response' in parsed) return parsed.response;
            const data = await createSubject(parsed.data);
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
