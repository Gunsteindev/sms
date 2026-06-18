import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getMedicalById, updateMedicalRecord, deleteMedicalRecord } from '@/lib/dataverse/medical';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            const data = await getMedicalById(id);
            return NextResponse.json({ success: true, data });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Medical record not found' }, { status: 404 });
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
            const data = await updateMedicalRecord(id, body);
            return NextResponse.json({ success: true, data });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Medical record not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_, async () => {
        try {
            const { id } = await params;
            await deleteMedicalRecord(id);
            return NextResponse.json({ success: true, message: 'Medical record deleted' });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Medical record not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}
