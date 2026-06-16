import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getClassById, updateClass, deleteClass } from '@/lib/dataverse/classes';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withSchool(_request, async () => {
        try {
            const { id } = await params;
            const classData = await getClassById(id);
            return NextResponse.json({ success: true, data: classData });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const updatedClass = await updateClass(id, body);

            return NextResponse.json({
                success: true,
                data: updatedClass,
                message: 'Class updated successfully'
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            await deleteClass(id);

            return NextResponse.json({
                success: true,
                message: 'Class deleted successfully'
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}
