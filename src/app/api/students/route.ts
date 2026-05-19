import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStudents, createStudent, getStudentStats } from '@/lib/dataverse/students';
import { parseBody, serverError, badRequest, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
    firstname:        z.string().min(1),
    lastname:         z.string().min(1),
    dateofbirth:      z.string().min(1),
    enrollmentdate:   z.string().min(1),
    gender:           z.number().int().optional().default(1),
    studentstatus:    z.number().int().optional(),
    enrollmentstatus: z.number().int().optional(),
    classid:          z.string().optional(),
    gradelevelid:     z.string().optional(),
    address:          z.string().optional(),
    phone:            z.string().optional(),
    email:            z.string().email().optional().or(z.literal('')),
    rollnumber:       z.string().optional(),
    parentid:         z.string().optional(),
    profilepicture:   z.string().optional(),
});

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p          = request.nextUrl.searchParams;
            const search     = p.get('search')   || undefined;
            const status     = p.get('status')   ? parseInt(p.get('status')!)   : undefined;
            const classid    = p.get('classid')  || undefined;
            const page       = p.get('page')     ? parseInt(p.get('page')!)     : 1;
            const pageSize   = p.get('pageSize') ? parseInt(p.get('pageSize')!) : 20;

            if (p.get('stats') === 'true') {
                const data = await getStudentStats();
                return NextResponse.json({ success: true, data });
            }

            const result = await getStudents({ search, status, classid, page, pageSize });
            return NextResponse.json({
                success: true,
                data: result.items,
                totalCount: result.totalCount,
                page: result.page,
                pageSize: result.pageSize,
            });
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

            const data = await createStudent(parsed.data);
            return NextResponse.json({ success: true, data, message: 'Student created successfully' }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
