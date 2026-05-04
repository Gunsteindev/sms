import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGrades, createGrade, bulkUpsertGrades, type AssessmentType } from '@/lib/dataverse/grades';
import { serverError } from '@/lib/api-guard';

const assessmentTypeSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);

const gradeFields = {
    assessmenttype: assessmentTypeSchema,
    score:          z.number().min(0).max(100),
    maxscore:       z.number().min(1).max(1000).optional(),
    studentid:      z.string().min(1),
    subjectid:      z.string().min(1),
    classid:        z.string().min(1),
    termid:         z.string().optional(),
    academicyearid: z.string().optional(),
    teacherid:      z.string().optional(),
    date:           z.string().optional(),
    remarks:        z.string().optional(),
};

const gradeSchema     = z.object(gradeFields);
const bulkGradeSchema = z.array(z.object({ gradeid: z.string().optional(), ...gradeFields }));

export async function GET(request: NextRequest) {
    try {
        const p              = request.nextUrl.searchParams;
        const classid        = p.get('classid')        || undefined;
        const subjectid      = p.get('subjectid')      || undefined;
        const termid         = p.get('termid')         || undefined;
        const academicyearid = p.get('academicyearid') || undefined;
        const studentid      = p.get('studentid')      || undefined;
        const assessmenttype = p.get('assessmenttype') ? parseInt(p.get('assessmenttype')!) as 1 : undefined;

        const result = await getGrades({ classid, subjectid, termid, academicyearid, studentid, assessmenttype });
        return NextResponse.json({ success: true, data: result.items, totalCount: result.totalCount });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        let body: unknown;
        try { body = await request.json(); } catch {
            return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
        }

        if (Array.isArray(body)) {
            const parsed = bulkGradeSchema.safeParse(body);
            if (!parsed.success) {
                const errors = parsed.error.issues.map(e => `[${e.path.join('.')}]: ${e.message}`).join(', ');
                return NextResponse.json({ success: false, error: errors }, { status: 400 });
            }
            const saved = await bulkUpsertGrades(parsed.data as never[]);
            return NextResponse.json({ success: true, data: saved, message: `${saved.saved} grades saved` }, { status: 201 });
        }

        const parsed = gradeSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return NextResponse.json({ success: false, error: errors }, { status: 400 });
        }
        const data = await createGrade(parsed.data);
        return NextResponse.json({ success: true, data, message: 'Grade created successfully' }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
