import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncementById, updateAnnouncement, deleteAnnouncement } from '@/lib/dataverse/announcements';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getAnnouncementById(id);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Not found';
        return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await updateAnnouncement(id, await request.json());
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to update';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteAnnouncement(id);
        return NextResponse.json({ success: true, message: 'Deleted' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to delete';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
