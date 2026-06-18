import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getAcademicYearById, updateAcademicYear, deleteAcademicYear } from '@/lib/dataverse/academicyears';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const data = await getAcademicYearById(id);
            return NextResponse.json({ success: true, data });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Academic year not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const data = await updateAcademicYear(id, body);
            return NextResponse.json({ success: true, data, message: 'Academic year updated' });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Academic year not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteAcademicYear(id);
            return NextResponse.json({ success: true, message: 'Academic year deleted' });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Academic year not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}
