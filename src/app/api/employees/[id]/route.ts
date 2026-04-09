// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeById, updateEmployee, deleteEmployee } from '@/lib/dataverse/employees';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await getEmployeeById(id);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in GET /api/employees/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch employee'
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
    const employee = await updateEmployee(id, body);

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in PUT /api/employees/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update employee'
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
    await deleteEmployee(id);

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in DELETE /api/employees/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete employee'
      },
      { status: 500 }
    );
  }
}
