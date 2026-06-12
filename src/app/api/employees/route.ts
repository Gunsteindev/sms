import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, createEmployee, getEmployeeStats } from '@/lib/dataverse/employees';
import { serverError, withSchool, makeTableGuard } from '@/lib/api-guard';

const isTableMissing = makeTableGuard('sms_employee');

// GET /api/employees - Get all employees
export async function GET(request: NextRequest) {
  return withSchool(request, async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const department = searchParams.get('department') || undefined;
      const stats = searchParams.get('stats') === 'true';

      if (stats) {
        const employeeStats = await getEmployeeStats();
        return NextResponse.json({
          success: true,
          data: employeeStats
        });
      }

      const employees = await getEmployees(department);

      return NextResponse.json({
        success: true,
        data: employees,
        total: employees.length
      });
    } catch (error) {
      if (isTableMissing(error)) return NextResponse.json({ success: true, data: [], total: 0, setup_required: true });
      return serverError(error);
    }
  });
}

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
  return withSchool(request, async () => {
    try {
      const body = await request.json();

      const requiredFields = ['firstname', 'lastname', 'emailaddress1', 'employeecode', 'department'];
      const missingFields = requiredFields.filter(field => !body[field]);

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
          },
          { status: 400 }
        );
      }

      const employee = await createEmployee(body);

      return NextResponse.json({
        success: true,
        data: employee,
        message: 'Employee created successfully'
      }, { status: 201 });
    } catch (error) {
      if (isTableMissing(error)) return NextResponse.json({ success: false, error: 'sms_employees table not created yet', setup_required: true }, { status: 503 });
      return serverError(error);
    }
  });
}
