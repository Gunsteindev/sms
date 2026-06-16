import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { serverError, withSchool, getSession } from '@/lib/api-guard';
import { buildReportCard } from '@/lib/reportcard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p         = request.nextUrl.searchParams;
            const studentId = p.get('studentId');
            const termId    = p.get('termId') || undefined;

            if (!studentId) {
                return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
            }

            const session = await getSession(request);
            const data = await buildReportCard(studentId, termId, session?.schoolId);
            return NextResponse.json({ success: true, data });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}
