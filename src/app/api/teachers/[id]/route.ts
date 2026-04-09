// src/app/api/teachers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTeacherById, updateTeacher, deleteTeacher } from '@/lib/dataverse/teachers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teacher = await getTeacherById(id);

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: teacher
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in GET /api/teachers/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch teacher'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const teacher = await updateTeacher(id, body);

    return NextResponse.json({
      success: true,
      data: teacher,
      message: 'Teacher updated successfully'
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in PUT /api/teachers/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update teacher'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTeacher(id);

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in DELETE /api/teachers/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete teacher'
      },
      { status: 500 }
    );
  }
}
