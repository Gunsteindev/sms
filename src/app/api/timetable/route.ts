import { NextRequest, NextResponse } from 'next/server';
import { getTimetable, createTimetableEntry } from '@/lib/dataverse/timetable';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const day = request.nextUrl.searchParams.get('dayofweek');
            const data = await getTimetable(day ? parseInt(day) : undefined);
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
            if (!body.dayofweek || !body.starttime || !body.endtime)
                return NextResponse.json({ success: false, error: 'dayofweek, starttime, endtime are required' }, { status: 400 });
            const data = await createTimetableEntry(body);
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
