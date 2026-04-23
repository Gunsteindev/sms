import { NextRequest, NextResponse } from 'next/server';
import { getTimetableEntryById, updateTimetableEntry, deleteTimetableEntry } from '@/lib/dataverse/timetable';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await getTimetableEntryById(id) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await updateTimetableEntry(id, await request.json()) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteTimetableEntry(id);
        return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
