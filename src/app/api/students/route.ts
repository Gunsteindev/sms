import { NextRequest, NextResponse } from 'next/server';
import { getStudents, createStudent, getStudentStats } from '@/lib/dataverse/students';

export async function GET(request: NextRequest) {
    try {
        const p      = request.nextUrl.searchParams;
        const search = p.get('search') || undefined;
        const status = p.get('status') ? parseInt(p.get('status')!) : undefined;

        if (p.get('stats') === 'true') {
            const data = await getStudentStats();
            return NextResponse.json({ success: true, data });
        }

        const result = await getStudents({ search, status });

        return NextResponse.json({
            success: true,
            data:       result.items,
            totalCount: result.totalCount,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to fetch students';
        console.error('GET /api/students:', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const missing = ['firstname', 'lastname', 'dateofbirth', 'enrollmentdate']
            .filter(f => !body[f]);
        if (missing.length) {
            return NextResponse.json({ success: false, error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
        }
        const data = await createStudent(body);
        return NextResponse.json({ success: true, data, message: 'Student created successfully' }, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to create student';
        console.error('POST /api/students:', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
