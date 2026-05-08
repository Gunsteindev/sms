import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFeeTypes, createFeeType } from '@/lib/dataverse/feetypes';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
    name:        z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    category:    z.enum(['academic', 'residential', 'extracurricular', 'administrative']),
    mandatory:   z.boolean(),
    color:       z.string().min(1),
});

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const category = request.nextUrl.searchParams.get('category') as Parameters<typeof getFeeTypes>[0] | null;
            const data = await getFeeTypes(category ?? undefined);
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
            const data = await createFeeType(parsed.data);
            return NextResponse.json({ success: true, data, message: 'Fee type created' }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
