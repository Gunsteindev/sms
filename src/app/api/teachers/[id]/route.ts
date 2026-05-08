import { NextRequest, NextResponse } from 'next/server';
import { getTeacherById, updateTeacher, deleteTeacher } from '@/lib/dataverse/teachers';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSchool(request, async () => {
    try {
      const { id } = await params;
      const teacher = await getTeacherById(id);

      if (!teacher) {
        return NextResponse.json(
          { success: false, error: 'Teacher not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: teacher });
    } catch (error: unknown) {
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
      const teacher = await updateTeacher(id, body);

      return NextResponse.json({
        success: true,
        data: teacher,
        message: 'Teacher updated successfully'
      });
    } catch (error: unknown) {
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
      await deleteTeacher(id);

      return NextResponse.json({
        success: true,
        message: 'Teacher deleted successfully'
      });
    } catch (error: unknown) {
      return serverError(error);
    }
  });
}
