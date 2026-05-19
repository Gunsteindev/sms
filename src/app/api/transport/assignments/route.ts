import { NextRequest, NextResponse } from 'next/server';
import { getRouteAssignments, createRouteAssignment } from '@/lib/dataverse/routeAssignments';
import { serverError, withSchool } from '@/lib/api-guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissing(e: any) {
    const msg: string = e?.response?.data?.error?.message ?? e?.message ?? '';
    const code: string = e?.response?.data?.error?.code ?? '';
    return msg.includes('sms_routeassignment') && (msg.includes('Could not find') || msg.includes('does not exist') || msg.includes('Invalid entity') || msg.includes('Resource not found') || code === '0x80060888');
}

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const vehicleid = request.nextUrl.searchParams.get('vehicleid') ?? undefined;
            const data = await getRouteAssignments(vehicleid);
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: true, data: [], total: 0, setup_required: true });
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.studentid)   return NextResponse.json({ success: false, error: 'studentid is required' }, { status: 400 });
            if (!body.studentname) return NextResponse.json({ success: false, error: 'studentname is required' }, { status: 400 });
            if (!body.vehicleid)   return NextResponse.json({ success: false, error: 'vehicleid is required' }, { status: 400 });
            if (!body.vehiclename) return NextResponse.json({ success: false, error: 'vehiclename is required' }, { status: 400 });
            const data = await createRouteAssignment(body);
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error) {
            if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'sms_routeassignments table not created yet', setup_required: true }, { status: 503 });
            return serverError(error);
        }
    });
}
