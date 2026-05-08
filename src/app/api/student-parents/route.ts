import { NextRequest, NextResponse } from 'next/server';
import { getStudentParents, getParentStudents, linkStudentParent } from '@/lib/dataverse/studentparents';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p = request.nextUrl.searchParams;
            const studentid = p.get('studentid');
            const parentid  = p.get('parentid');
            if (!studentid && !parentid) {
                return NextResponse.json({ success: false, error: 'studentid or parentid is required' }, { status: 400 });
            }
            const data = studentid
                ? await getStudentParents(studentid)
                : await getParentStudents(parentid!);
            return NextResponse.json({ success: true, data });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.studentid || !body.parentid) {
                return NextResponse.json({ success: false, error: 'studentid and parentid are required' }, { status: 400 });
            }
            const data = await linkStudentParent(body);
            return NextResponse.json({ success: true, data, message: 'Parent linked to student' }, { status: 201 });
        } catch (error: unknown) {
            return serverError(error);
        }
    });
}
