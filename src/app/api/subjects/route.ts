import { NextRequest, NextResponse } from 'next/server';
import { getSubjects, createSubject } from '@/lib/dataverse/subjects';

export async function GET(request: NextRequest) {
    try {
        const search = request.nextUrl.searchParams.get('search') ?? undefined;
        const data = await getSubjects(search);
        return NextResponse.json({ success: true, data, total: data.length });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name) return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
        const data = await createSubject(body);
        return NextResponse.json({ success: true, data }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
