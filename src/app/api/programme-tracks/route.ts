import { NextRequest, NextResponse } from 'next/server';
import { getProgrammeTracks, createProgrammeTrack } from '@/lib/dataverse/programmetracks';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const search = request.nextUrl.searchParams.get('search') ?? undefined;
            const data = await getProgrammeTracks(search);
            return NextResponse.json({ success: true, data });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.name || !body.abbreviation) {
                return NextResponse.json({ success: false, error: 'name and abbreviation are required' }, { status: 400 });
            }
            const data = await createProgrammeTrack(body);
            return NextResponse.json({ success: true, data, message: 'Programme track created' }, { status: 201 });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
