import { NextRequest, NextResponse } from 'next/server';
import { getStudents, createStudent, getStudentStats, searchStudents } from '@/lib/dataverse/students';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const search = searchParams.get('search') || undefined;
        const status = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined;
        const className = searchParams.get('className') || undefined;
        const stats = searchParams.get('stats') === 'true';

        // Return stats if requested
        if (stats) {
            const studentStats = await getStudentStats();
            return NextResponse.json({
                success: true,
                data: studentStats
            });
        }

        // Search if search query provided
        if (search) {
            const results = await searchStudents(search);
            return NextResponse.json({
                success: true,
                data: results,
                total: results.length
            });
        }

        // Get students (Dataverse handles pagination differently)
        const students = await getStudents({
            pageSize,
            search,
            status,
            class: className
        });

        return NextResponse.json({
            success: true,
            data: students.items,
            pagination: {
                page: page,
                pageSize: pageSize,
                totalCount: students.totalCount,
                hasNextPage: students.hasNextPage
            }
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in GET /api/students:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to fetch students',
                details: error.response?.data 
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const requiredFields = ['firstname', 'lastname', 'emailaddress1', 'dateofbirth'];
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

        const student = await createStudent(body);
        
        return NextResponse.json({
            success: true,
            data: student,
            message: 'Student created successfully'
        }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in POST /api/students:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to create student',
                details: error.response?.data 
            },
            { status: 500 }
        );
    }
}