import { NextRequest, NextResponse } from 'next/server';
import { getStudentParents, getParentStudents, linkStudentParent } from '@/lib/dataverse/studentparents';

export async function GET(request: NextRequest) {
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
        const msg = error instanceof Error ? error.message : 'Failed to fetch student-parents';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.studentid || !body.parentid) {
            return NextResponse.json({ success: false, error: 'studentid and parentid are required' }, { status: 400 });
        }
        const data = await linkStudentParent(body);
        return NextResponse.json({ success: true, data, message: 'Parent linked to student' }, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to link parent';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
