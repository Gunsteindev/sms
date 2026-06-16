import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getStudentById, updateStudent, deleteStudent } from '@/lib/dataverse/students';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSchool(request, async () => {
    try {
      const { id } = await params;
      const student = await getStudentById(id);
      return NextResponse.json({ success: true, data: student });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
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
      const student = await updateStudent(id, body);

      return NextResponse.json({
        success: true,
        data: student,
        message: 'Student updated successfully'
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axErr = error as any;
      if (axErr?.response?.data) {
        console.error('[PUT /students] Dataverse error body:', JSON.stringify(axErr.response.data));
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
      await deleteStudent(id);

      return NextResponse.json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
      }
      return serverError(error);
    }
  });
}
