import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getUserByEmail, getUserStats } from '@/lib/dataverse/users';
import { serverError } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const p = request.nextUrl.searchParams;
        const email = p.get('email');
        const role  = p.get('role')  ? Number(p.get('role'))  : undefined;
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
    } catch (error: unknown) {
        return serverError(error);
    }
}
