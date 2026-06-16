import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getDisciplinaryById, updateDisciplinaryRecord, deleteDisciplinaryRecord } from '@/lib/dataverse/disciplinary';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            const data = await getDisciplinaryById(id);
            return NextResponse.json({ success: true, data });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Disciplinary record not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const data = await updateDisciplinaryRecord(id, body);
            return NextResponse.json({ success: true, data });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Disciplinary record not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            await deleteDisciplinaryRecord(id);
            return NextResponse.json({ success: true, message: 'Record deleted' });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Disciplinary record not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}
