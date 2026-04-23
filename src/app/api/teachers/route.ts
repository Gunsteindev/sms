import { NextRequest, NextResponse } from 'next/server';
import { getTeachers, createTeacher, getTeacherStats } from '@/lib/dataverse/teachers';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const stats = searchParams.get('stats') === 'true';

        if (stats) {
            const teacherStats = await getTeacherStats();
            return NextResponse.json({
                success: true,
                data: teacherStats
            });
        }

        const search   = searchParams.get('search')   ?? undefined;
        const status   = searchParams.get('status')   ? Number(searchParams.get('status'))   : undefined;
        const pageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined;

        const result = await getTeachers({ search, status, pageSize });

        return NextResponse.json({
            success: true,
            data: result.items,
            total: result.totalCount
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in GET /api/teachers:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to fetch teachers',
                details: error.response?.data 
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const requiredFields = ['firstname', 'lastname', 'emailaddress1', 'employeecode'];
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

        const teacher = await createTeacher(body);
        
        return NextResponse.json({
            success: true,
            data: teacher,
            message: 'Teacher created successfully'
        }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in POST /api/teachers:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to create teacher',
                details: error.response?.data 
            },
            { status: 500 }
        );
    }
}