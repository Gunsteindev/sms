import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSchoolProfile, getSchoolById, updateSchool } from '@/lib/dataverse/school';
import { parseBody, serverError, getSession } from '@/lib/api-guard';

const upsertSchema = z.object({
    name:      z.string().min(1, 'School name is required'),
    motto:     z.string().optional(),
    type:      z.enum(['ges', 'cambridge', 'ib', 'american', 'french', 'mixed']).optional(),
    level:     z.enum(['primary', 'jhs', 'shs', 'international', 'all']).optional(),
    address:   z.string().optional(),
    phone:     z.string().optional(),
    email:     z.string().optional(),
    currency:  z.string().optional(),
    website:   z.string().optional(),
    emiscode:  z.string().optional(),
    district:  z.string().optional(),
    region:    z.string().optional(),
    logo:           z.string().optional(),
    primarycolor:   z.string().optional(),
    sidebarcolor:   z.string().optional(),
    enabledmodules: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await getSession(request);
        const data = session?.schoolId
            ? await getSchoolById(session.schoolId)
            : await getSchoolProfile();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession(request);
        const parsed = await parseBody(request, upsertSchema);
        if ('response' in parsed) return parsed.response;

        // Resolve which school to update: prefer session schoolId, fall back to first record
        let schoolId = session?.schoolId;
        if (!schoolId) {
            const existing = await getSchoolProfile();
            schoolId = existing?.schoolid;
        }
        if (!schoolId) {
            return NextResponse.json({ success: false, error: 'No school found to update' }, { status: 404 });
        }

        // Only the super admin (bootstrap) may change module assignments
        const { enabledmodules: _ignored, ...profileData } = parsed.data;
        const payload = session?.userid === 'bootstrap' ? parsed.data : profileData;

        const data = await updateSchool(schoolId, payload);
        return NextResponse.json({ success: true, data, message: 'School profile saved' });
    } catch (error) {
        return serverError(error);
    }
}
