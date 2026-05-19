import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUsers, getUserByEmail, getUserStats, createUser } from '@/lib/dataverse/users';
import { parseBody, serverError, badRequest, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
    name:            z.string().min(1, 'Name is required'),
    email:           z.string().email('Invalid email'),
    password:        z.string().min(8, 'Password must be at least 8 characters'),
    userrole:        z.number().int().min(1).max(8),
    relatedrecordid: z.string().optional(),
});

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const p = request.nextUrl.searchParams;
            const email = p.get('email');
            const role  = p.get('role') ? Number(p.get('role')) : undefined;
            const stats = p.get('stats') === 'true';

            if (stats) {
                const data = await getUserStats();
                return NextResponse.json({ success: true, data });
            }
            if (email) {
                const data = await getUserByEmail(email);
                if (!data) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
                return NextResponse.json({ success: true, data });
            }
            const data = await getUsers(role);
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const parsed = await parseBody(request, createSchema);
            if ('response' in parsed) return parsed.response;

            // Prevent duplicate emails within this school
            const existing = await getUserByEmail(parsed.data.email.toLowerCase().trim());
            if (existing) return badRequest('A user with this email already exists');

            const data = await createUser({ ...parsed.data, email: parsed.data.email.toLowerCase().trim() });
            return NextResponse.json({ success: true, data }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
