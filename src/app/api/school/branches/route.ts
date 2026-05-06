import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBranches, createBranch } from '@/lib/dataverse/school';
import { parseBody, serverError } from '@/lib/api-guard';

const createSchema = z.object({
    schoolid:  z.string().min(1, 'School ID is required'),
    name:      z.string().min(1, 'Branch name is required'),
    address:   z.string().optional(),
    district:  z.string().optional(),
    region:    z.string().optional(),
    phone:     z.string().optional(),
    email:     z.string().optional(),
    ismain:    z.boolean().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const schoolid = request.nextUrl.searchParams.get('schoolid') ?? undefined;
        const data = await getBranches(schoolid);
        return NextResponse.json({ success: true, data, total: data.length });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, createSchema);
        if ('response' in parsed) return parsed.response;
        const data = await createBranch(parsed.data);
        return NextResponse.json({ success: true, data, message: 'Branch created' }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
