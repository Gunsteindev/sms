import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentById, updateDepartment, deleteDepartment } from '@/lib/dataverse/departments';
import { serverError } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await getDepartmentById(id) });
    } catch (error) { return serverError(error); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return NextResponse.json({ success: true, data: await updateDepartment(id, await request.json()) });
    } catch (error) { return serverError(error); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteDepartment(id);
        return NextResponse.json({ success: true });
    } catch (error) { return serverError(error); }
}
