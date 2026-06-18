import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateSchool, getSchoolById } from '@/lib/dataverse/school';
import { parseBody, serverError, getSession } from '@/lib/api-guard';

const modulesSchema = z.object({
    enabledmodules:   z.array(z.string()).optional(),
    rolemoduleaccess: z.record(z.string(), z.array(z.string())).optional(),
}).refine(
    d => d.enabledmodules !== undefined || d.rolemoduleaccess !== undefined,
    { message: 'Provide enabledmodules or rolemoduleaccess' },
);

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const data = await getSchoolById(id);
        if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const session = await getSession(request);
        if (!session || session.userid !== 'bootstrap') {
            return NextResponse.json({ success: false, error: 'Forbidden — super admin only' }, { status: 403 });
        }
        const { id } = await params;
        const parsed = await parseBody(request, modulesSchema);
        if ('response' in parsed) return parsed.response;

        await updateSchool(id, parsed.data);
        return NextResponse.json({ success: true, message: 'Modules updated' });
    } catch (error) {
        return serverError(error);
    }
}
