import { NextRequest, NextResponse } from 'next/server';
import { searchStudents } from '@/lib/dataverse/students';
import { searchTeachers } from '@/lib/dataverse/teachers';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
        return NextResponse.json({ success: true, data: [] });
    }

    try {
        const [students, teachers] = await Promise.allSettled([
            searchStudents(q),
            searchTeachers(q),
        ]);

        const results = [
            ...(students.status === 'fulfilled' ? students.value.slice(0, 5).map((s: any) => ({
                id: s.studentid,
                label: `${s.firstname} ${s.lastname}`,
                sub: s.emailaddress1 ?? s.classname ?? '',
                type: 'student' as const,
                href: '/students',
            })) : []),
            ...(teachers.status === 'fulfilled' ? teachers.value.slice(0, 5).map((t: any) => ({
                id: t.teacherid,
                label: `${t.firstname} ${t.lastname}`,
                sub: t.emailaddress1 ?? t.subjectspecialization ?? '',
                type: 'teacher' as const,
                href: '/teachers',
            })) : []),
        ];

        return NextResponse.json({ success: true, data: results });
    } catch (error: unknown) {
        return serverError(error);
    }
}
