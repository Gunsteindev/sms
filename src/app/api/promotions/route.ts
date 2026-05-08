import { NextRequest, NextResponse } from 'next/server';
import { getPromotions, createPromotion } from '@/lib/dataverse/promotions';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p              = request.nextUrl.searchParams;
            const academicyearid   = p.get('academicyearid')   || undefined;
            const fromgradelevelid = p.get('fromgradelevelid') || undefined;
            const studentid        = p.get('studentid')        || undefined;

            try {
                const result = await getPromotions({ academicyearid, fromgradelevelid, studentid });
                return NextResponse.json({ success: true, data: result.items, totalCount: result.totalCount });
            } catch {
                // Table may not exist yet — return empty list rather than a 500
                return NextResponse.json({ success: true, data: [], totalCount: 0 });
            }
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.studentid || !body.status) {
                return NextResponse.json({ success: false, error: 'Missing required fields: studentid, status' }, { status: 400 });
            }
            const data = await createPromotion(body);
            return NextResponse.json({ success: true, data, message: 'Promotion created' }, { status: 201 });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
