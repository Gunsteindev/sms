import { NextRequest, NextResponse } from 'next/server';
import { getDepartments, createDepartment } from '@/lib/dataverse/departments';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const search = request.nextUrl.searchParams.get('search') ?? undefined;
            const data = await getDepartments(search);
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.name) return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
            const data = await createDepartment(body);
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
