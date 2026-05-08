import { NextRequest, NextResponse } from 'next/server';
import { getSubjects, createSubject } from '@/lib/dataverse/subjects';
import { serverError, withSchool } from '@/lib/api-guard';

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
            const body = await request.json();
            if (!body.name) return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
            const data = await createSubject(body);
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
