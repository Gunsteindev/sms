import { NextRequest, NextResponse } from 'next/server';
import { getParents, createParent } from '@/lib/dataverse/parents';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const search = request.nextUrl.searchParams.get('search') ?? undefined;
        const data = await getParents(search);
        return NextResponse.json({ success: true, data, total: data.length });
    } catch (error: unknown) {
        return serverError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.firstname || !body.lastname) {
            return NextResponse.json({ success: false, error: 'firstname and lastname are required' }, { status: 400 });
        }
        const data = await createParent(body);
        return NextResponse.json({ success: true, data, message: 'Parent created' }, { status: 201 });
    } catch (error: unknown) {
        return serverError(error);
    }
}
