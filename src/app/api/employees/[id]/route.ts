import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeById, updateEmployee, deleteEmployee } from '@/lib/dataverse/employees';
import { serverError, withSchool, makeTableGuard } from '@/lib/api-guard';

const isTableMissing = makeTableGuard('sms_employee');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSchool(request, async () => {
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
      if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'Employee not found', setup_required: true }, { status: 404 });
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
      const employee = await updateEmployee(id, body);

      return NextResponse.json({
        success: true,
        data: employee,
        message: 'Employee updated successfully'
      });
    } catch (error) {
      if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'sms_employees table not created yet', setup_required: true }, { status: 503 });
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
      await deleteEmployee(id);

      return NextResponse.json({
        success: true,
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'sms_employees table not created yet', setup_required: true }, { status: 503 });
      return serverError(error);
    }
  });
}
