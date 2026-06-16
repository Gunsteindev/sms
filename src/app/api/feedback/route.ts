import { NextRequest, NextResponse } from 'next/server';
import { getAllFeedback } from '@/lib/dataverse/parentFeedback';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const data = await getAllFeedback();
            return NextResponse.json({ success: true, data, total: data.length });
        } catch (error) {
            return serverError(error);
        }
    });
}
