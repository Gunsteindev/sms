import { NextRequest, NextResponse } from 'next/server';
import { getSessions, createSession } from '@/lib/dataverse/poolsessions';
import { serverError, badRequest, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const status = request.nextUrl.searchParams.get('status');
            const data   = await getSessions(status ? Number(status) : undefined);
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error) { return serverError(error); }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.name)        return badRequest('name is required');
            if (!body.sessiondate) return badRequest('sessiondate is required');
            if (!body.mode)        return badRequest('mode is required');
            if (!body.shift)       return badRequest('shift is required');
            const data = await createSession(body);
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error) { return serverError(error); }
    });
}
