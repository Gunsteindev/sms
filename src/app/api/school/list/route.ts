import { NextResponse } from 'next/server';
import { getAllSchools } from '@/lib/dataverse/school';
import { serverError } from '@/lib/api-guard';

export async function GET() {
    try {
        const data = await getAllSchools();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}
