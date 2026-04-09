// src/app/api/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        message: 'School Management System API',
        version: '1.0.0',
        endpoints: {
            students: '/api/students',
            teachers: '/api/teachers',
            employees: '/api/employees',
            attendance: '/api/attendance',
            classes: '/api/classes',
            fees: '/api/fees',
            dashboard: '/api/dashboard'
        }
    });
}