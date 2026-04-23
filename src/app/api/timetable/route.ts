import { NextRequest, NextResponse } from 'next/server';
import { getTimetable, createTimetableEntry } from '@/lib/dataverse/timetable';

export async function GET(request: NextRequest) {
    try {
        const day = request.nextUrl.searchParams.get('dayofweek');
        const data = await getTimetable(day ? parseInt(day) : undefined);
        return NextResponse.json({ success: true, data, total: data.length });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.dayofweek || !body.starttime || !body.endtime)
            return NextResponse.json({ success: false, error: 'dayofweek, starttime, endtime are required' }, { status: 400 });
        const data = await createTimetableEntry(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
