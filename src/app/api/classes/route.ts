import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClasses, createClass, getClassesCount } from '@/lib/dataverse/classes';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
    classname:      z.string().min(1),
    capacity:       z.number().int().min(1).max(200),
    roomnumber:     z.string().optional().default(''),
    gradelevelid:   z.string().optional(),
    teacherid:      z.string().optional(),
    academicyearid: z.string().optional(),
    description:    z.string().optional(),
});

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p = request.nextUrl.searchParams;
            if (p.get('stats') === 'true') {
                const data = await getClassesCount();
                return NextResponse.json({ success: true, data });
            }
            const classes = await getClasses();
            return NextResponse.json({ success: true, data: classes, total: classes.length });
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
            const newClass = await createClass(parsed.data);
            return NextResponse.json({ success: true, data: newClass, message: 'Class created successfully' }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
