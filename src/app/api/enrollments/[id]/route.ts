import { NextRequest, NextResponse } from 'next/server';
import { getEnrollmentById, updateEnrollment, deleteEnrollment } from '@/lib/dataverse/enrollments';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await getEnrollmentById(id) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await updateEnrollment(id, await request.json()) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteEnrollment(id);
        return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
