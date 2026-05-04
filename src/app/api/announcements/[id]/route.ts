import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncementById, updateAnnouncement, deleteAnnouncement } from '@/lib/dataverse/announcements';
import { serverError } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getAnnouncementById(id);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await updateAnnouncement(id, await request.json());
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteAnnouncement(id);
        return NextResponse.json({ success: true, message: 'Deleted' });
    } catch (error) {
        return serverError(error);
    }
}
