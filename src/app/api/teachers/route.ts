import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTeachers, createTeacher, getTeacherStats } from '@/lib/dataverse/teachers';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
    firstname:      z.string().min(1),
    lastname:       z.string().min(1),
    email:          z.string().email(),
    dateofbirth:    z.string().min(1),
    gender:         z.number().int().default(1),
    hiredate:       z.string().min(1),
    qualification:  z.string().min(1),
    specialization: z.string().min(1),
    phone:          z.string().optional(),
    address:        z.string().optional(),
    employeeid:     z.string().optional(),
});

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p = request.nextUrl.searchParams;
            if (p.get('stats') === 'true') {
                const data = await getTeacherStats();
                return NextResponse.json({ success: true, data });
            }
            const result = await getTeachers({
                search:   p.get('search')   ?? undefined,
                status:   p.get('status')   ? Number(p.get('status'))   : undefined,
                pageSize: p.get('pageSize') ? Number(p.get('pageSize')) : undefined,
            });
            return NextResponse.json({ success: true, data: result.items, total: result.totalCount });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const parsed = await parseBody(request, createSchema);
            if ('response' in parsed) return parsed.response;
            const teacher = await createTeacher(parsed.data);
            return NextResponse.json({ success: true, data: teacher, message: 'Teacher created successfully' }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
