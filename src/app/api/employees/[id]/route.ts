// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeById, updateEmployee, deleteEmployee } from '@/lib/dataverse/employees';
import { serverError } from '@/lib/api-guard';

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
  } catch (error) {
    return serverError(error);
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
  } catch (error) {
    return serverError(error);
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
  } catch (error) {
    return serverError(error);
  }
}
