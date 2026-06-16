import { NextRequest, NextResponse } from 'next/server';
import { getSession, serverError, withSchool } from '@/lib/api-guard';
import { getParentByEmail } from '@/lib/dataverse/parents';
import { getParentStudents } from '@/lib/dataverse/studentparents';

export async function GET(request: NextRequest) {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    return withSchool(request, async () => {
        try {
            const parent = await getParentByEmail(session.email);
            if (!parent) {
                return NextResponse.json({ success: true, data: [], parentFound: false, parentName: '' });
            }
            const links = await getParentStudents(parent.parentid);
            const data = links.map(l => ({
                studentid:   l.studentid,
                studentname: l.studentname,
                isprimary:   l.isprimary,
            }));
            return NextResponse.json({
                success: true,
                data,
                parentFound: true,
                parentid: parent.parentid,
                parentName: parent.fullname || `${parent.firstname} ${parent.lastname}`.trim(),
            });
        } catch (error) {
            return serverError(error);
        }
    });
}
