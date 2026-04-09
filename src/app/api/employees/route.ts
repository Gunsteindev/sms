// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, createEmployee, getEmployeeStats } from '@/lib/dataverse/employees';

// GET /api/employees - Get all employees
export async function GET(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Error in GET /api/employees:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch employees' 
      },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Error in POST /api/employees:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create employee' 
      },
      { status: 500 }
    );
  }
}