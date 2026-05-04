import { NextRequest, NextResponse } from 'next/server';
import { getDisciplinaryById, updateDisciplinaryRecord, deleteDisciplinaryRecord } from '@/lib/dataverse/disciplinary';
import { serverError } from '@/lib/api-guard';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getDisciplinaryById(id);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data = await updateDisciplinaryRecord(id, body);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteDisciplinaryRecord(id);
        return NextResponse.json({ success: true, message: 'Record deleted' });
    } catch (error) {
        return serverError(error);
    }
}
