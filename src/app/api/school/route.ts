import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSchoolProfile, createSchool, updateSchool } from '@/lib/dataverse/school';
import { parseBody, serverError } from '@/lib/api-guard';

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
    logo:      z.string().optional(),
});

export async function GET() {
    try {
        const data = await getSchoolProfile();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest) {
    try {
        const parsed = await parseBody(request, upsertSchema);
        if ('response' in parsed) return parsed.response;

        // Upsert: update if a school record exists, create otherwise
        const existing = await getSchoolProfile();
        const data = existing
            ? await updateSchool(existing.schoolid, parsed.data)
            : await createSchool(parsed.data);

        return NextResponse.json({ success: true, data, message: 'School profile saved' });
    } catch (error) {
        return serverError(error);
    }
}
