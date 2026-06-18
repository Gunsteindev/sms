import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAttendance, markAttendance, getAttendanceTrends } from '@/lib/dataverse/attendance';
import { serverError, withSchool } from '@/lib/api-guard';

const attendanceRecordSchema = z.object({
    studentid: z.string().min(1),
    date:      z.string().min(1),
    attendancestatus: z.number().int().min(1).max(4),
    classid:   z.string().optional(),
    subjectid: z.string().optional(),
    checkintime: z.string().optional(),
    remarks:   z.string().optional(),
});

const markSchema = z.object({
    records: z.array(attendanceRecordSchema).min(1),
});

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p      = request.nextUrl.searchParams;
            const date   = p.get('date')   || undefined;
            const trends = p.get('trends') === 'true';
            const days   = Math.min(Math.max(parseInt(p.get('days') || '30'), 1), 365);

            if (trends) {
                const data = await getAttendanceTrends(days);
                return NextResponse.json({ success: true, data });
            }

            const data = await getAttendance(date);
            return NextResponse.json({ success: true, data });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            let body: unknown;
            try { body = await request.json(); } catch { return serverError(new Error('Invalid JSON body')); }

            const parsed = markSchema.safeParse(body);
            if (!parsed.success) {
                const errors = parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return NextResponse.json({ success: false, error: errors }, { status: 400 });
            }

            const result = await markAttendance(parsed.data.records);
            return NextResponse.json({ success: true, data: result, message: `Marked ${parsed.data.records.length} attendance records successfully` }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
