import { NextRequest, NextResponse } from 'next/server';
import { bulkPromote } from '@/lib/dataverse/promotions';
import { serverError } from '@/lib/api-guard';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!Array.isArray(body) || !body.length) {
            return NextResponse.json({ success: false, error: 'Request body must be a non-empty array of promotion entries' }, { status: 400 });
        }
        const result = await bulkPromote(body);
        return NextResponse.json({
            success: true,
            data:    result,
            message: `${result.promoted} students promoted${result.failed ? `, ${result.failed} failed` : ''}`,
        }, { status: 201 });
    } catch (error: unknown) {
        return serverError(error);
    }
}
