// src/app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStudentById, updateStudent, deleteStudent } from '@/lib/dataverse/students';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await getStudentById(id);

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in GET /api/students/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch student'
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
    const student = await updateStudent(id, body);

    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student updated successfully'
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in PUT /api/students/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update student'
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
    await deleteStudent(id);

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in DELETE /api/students/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete student'
      },
      { status: 500 }
    );
  }
}
