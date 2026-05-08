import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncements, createAnnouncement } from '@/lib/dataverse/announcements';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p = request.nextUrl.searchParams;
            const data = await getAnnouncements({
                audience: p.get('audience') ? Number(p.get('audience')) : undefined,
                limit:    p.get('limit')    ? Number(p.get('limit'))    : undefined,
                pinned:   p.get('pinned')   ? p.get('pinned') === 'true' : undefined,
            });
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.name || !body.message || body.audience === undefined) {
                return NextResponse.json({ success: false, error: 'name, message, and audience are required' }, { status: 400 });
            }
            const data = await createAnnouncement(body);
            return NextResponse.json({ success: true, data, message: 'Announcement created' }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
