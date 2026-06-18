import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getAnnouncementById, updateAnnouncement, deleteAnnouncement } from '@/lib/dataverse/announcements';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const data = await getAnnouncementById(id);
            return NextResponse.json({ success: true, data });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const data = await updateAnnouncement(id, await request.json());
            return NextResponse.json({ success: true, data });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteAnnouncement(id);
            return NextResponse.json({ success: true, message: 'Deleted' });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}
